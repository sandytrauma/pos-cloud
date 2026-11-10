// Location: lib/actions/authFactory.ts
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sign2FAToken, checkPinRateLimit, recordFailedPinAttempt, resetPinRateLimit } from "@/lib/security";

interface WhiteLabelActionConfig {
  db: any;
  usersTable: any;
  signIn: Function;
  signOut: Function;
  auth: Function;
  isEmbeddedIframe?: boolean; 
}

export function createAuthActions({
  db,
  usersTable,
  signIn,
  signOut,
  auth,
  isEmbeddedIframe = true,
}: WhiteLabelActionConfig) {
  
  return {
    authenticate: async (prevState: string | undefined, formData: FormData) => {
      try {
        await signIn("credentials", {
          email: formData.get("email"),
          password: formData.get("password"),
          redirectTo: "/dashboard",
        });
      } catch (error) {
        if (error instanceof AuthError) {
          switch (error.type) {
            case "CredentialsSignin":
              return "Invalid credentials.";
            default:
              return "Something went wrong.";
          }
        }
        throw error;
      }
    },

    verifyCurrentPassword: async (password: string) => {
      const session = await auth();
      const userId = Number(session?.user?.id);

      if (!userId || isNaN(userId)) return { success: false, error: "Unauthorized" };

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      if (!user || !user.password) return { success: false, error: "User not found" };

      const isPassValid = await bcrypt.compare(password, user.password);
      return { success: isPassValid };
    },

    verifyAdminPin: async (arg1: any, arg2?: any) => {
      let enteredPin = "";
      
      if (arg1 instanceof FormData) {
        enteredPin = arg1.get("pin")?.toString() || "";
      } else if (arg2 instanceof FormData) {
        enteredPin = arg2.get("pin")?.toString() || "";
      } else if (typeof arg1 === "string") {
        enteredPin = arg1;
      } else if (typeof arg2 === "string") {
        enteredPin = arg2;
      }

      enteredPin = enteredPin.trim();

      const session = await auth();
      const userId = Number(session?.user?.id);
      if (!userId || isNaN(userId)) return { success: false, error: "Unauthorized: Active session required." };

      const rateLimit = checkPinRateLimit(String(userId));
      if (!rateLimit.allowed) {
        return { 
          success: false, 
          error: `Terminal locked due to excessive failed attempts. Try again in ${Math.ceil((rateLimit.retryAfterSeconds || 0) / 60)} minutes.` 
        };
      }

      try {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
        const activePin = user?.adminPin || user?.admin_pin; 
        const targetMasterPin = process.env.ADMIN_MASTER_PIN?.trim();

        let isValid = false;

        // Check 1: Match against ADMIN_MASTER_PIN from environment
        if (targetMasterPin && enteredPin === targetMasterPin) {
          isValid = true;
          if (!activePin) {
            const hashed = await bcrypt.hash(enteredPin, 10);
            const updatePayload = "admin_pin" in usersTable ? { admin_pin: hashed } : { adminPin: hashed };
            await db.update(usersTable).set(updatePayload).where(eq(usersTable.id, userId));
          }
        }
        // Check 2: Match against Database PIN (bcrypt hash or plain fallback)
        else if (activePin) {
          if (activePin.startsWith("$2a$") || activePin.startsWith("$2b$") || activePin.startsWith("$2y$")) {
            isValid = await bcrypt.compare(enteredPin, activePin);
          } else {
            isValid = enteredPin === activePin.trim();
          }
        }
        // Check 3: If no PIN is configured yet, initialize the entered PIN
        else {
          const hashed = await bcrypt.hash(enteredPin, 10);
          const updatePayload = "admin_pin" in usersTable ? { admin_pin: hashed } : { adminPin: hashed };
          await db.update(usersTable).set(updatePayload).where(eq(usersTable.id, userId));
          isValid = true;
        }

        if (isValid) {
          resetPinRateLimit(String(userId));
          const signedToken = await sign2FAToken(userId);
          const cookieStore = await cookies();

          const isHttps = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

          cookieStore.set("admin_2fa_token", signedToken, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 12, 
            secure: isHttps, 
            sameSite: "lax",
          });

          cookieStore.set("admin_2fa_verified", "true", {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 12, 
            secure: isHttps, 
            sameSite: "lax",
          });

          return { success: true };
        }

        const attemptResult = recordFailedPinAttempt(String(userId));
        if (attemptResult.locked) {
          return { success: false, error: "Terminal locked for 15 minutes due to 5 consecutive failed attempts." };
        }

        return { 
          success: false, 
          error: `Incorrect PIN. ${Math.max(0, rateLimit.remainingAttempts - 1)} attempts remaining before lockout.` 
        };
      } catch (err) {
        if (err instanceof Error && (err.message === "NEXT_REDIRECT" || err.constructor.name === "RedirectError")) {
          throw err;
        }
        console.error("PIN Verification Error: ", err);
        return { success: false, error: "Server Error during verification." };
      }
    },

    resetAdminPin: async (password: string, newPin: string) => {
      const session = await auth();
      const userId = Number(session?.user?.id);

      if (!userId || isNaN(userId)) return { success: false, error: "Unauthorized" };

      if (!newPin || newPin.length < 4 || newPin.length > 6) {
        return { success: false, error: "PIN must be between 4 and 6 digits." };
      }

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      if (!user || !user.password) return { success: false, error: "User not found" };

      const isPassValid = await bcrypt.compare(password, user.password);
      if (!isPassValid) return { success: false, error: "Incorrect Password" };

      const hashedPin = await bcrypt.hash(newPin, 10);
      const updatePayload = "admin_pin" in usersTable ? { admin_pin: hashedPin } : { adminPin: hashedPin };

      await db.update(usersTable).set(updatePayload).where(eq(usersTable.id, userId));
      return { success: true };
    },

    logOut: async () => {
      const cookieStore = await cookies();
      cookieStore.delete("admin_2fa_token");
      cookieStore.delete("admin_2fa_verified");
      await signOut({ redirectTo: "/login" });
    },
  };
}