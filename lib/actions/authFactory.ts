// Location: lib/actions/authFactory.ts
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface WhiteLabelActionConfig {
  db: any;               // Accepts the tenant's Drizzle instance
  usersTable: any;       // Accepts the user table schema layout
  signIn: Function;      // Passed from the host's initialized auth instance
  signOut: Function;     // Passed from the host's initialized auth instance
  auth: Function;        // Passed from the host's initialized auth instance
  isEmbeddedIframe?: boolean; 
}

/**
 * Generates runtime execution server actions for white-label distributions.
 * Synchronous initialization guarantees safe top-level named destructuring.
 */
export function createAuthActions({
  db,
  usersTable,
  signIn,
  signOut,
  auth,
  isEmbeddedIframe = true,
}: WhiteLabelActionConfig) {
  
  return {
    /**
     * 1. Standard Login Action
     */
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

    /**
     * 2. Current Password Verification Action
     */
    verifyCurrentPassword: async (password: string) => {
      const session = await auth();
      const userId = Number(session?.user?.id);

      if (!userId || isNaN(userId)) return { success: false };

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      if (!user || !user.password) return { success: false };

      const isPassValid = await bcrypt.compare(password, user.password);
      return { success: isPassValid };
    },

    /**
     * 3. PIN Verification Action (Supports both custom form fields & direct string invocation calls)
     */
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

      // Environment Variable Master PIN Verification Gate Pass
      const targetMasterPin = process.env.ADMIN_MASTER_PIN;
      if (targetMasterPin && enteredPin === targetMasterPin.trim()) {
        const cookieStore = await cookies();
        cookieStore.set("admin_2fa_verified", "true", {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 12, 
          secure: process.env.NODE_ENV === "production", 
          sameSite: isEmbeddedIframe ? "none" : "lax",
        });
        return { success: true };
      }

      const session = await auth();
      const userId = Number(session?.user?.id);
      if (!userId || isNaN(userId)) return { success: false, error: "Unauthorized" };

      try {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
        const activePin = user?.adminPin || user?.admin_pin; 

        if (!activePin) {
          return { success: false, error: "No PIN set and environment Master pass key is mismatching." };
        }

        const isValid = await bcrypt.compare(enteredPin, activePin);

        if (isValid) {
          const cookieStore = await cookies();
          cookieStore.set("admin_2fa_verified", "true", {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 12, 
            secure: process.env.NODE_ENV === "production", 
            sameSite: isEmbeddedIframe ? "none" : "lax",
          });
          return { success: true };
        }
        return { success: false, error: "Incorrect PIN" };
      } catch (err) {
        // 🌟 FIXED: If the error caught is an internal Next.js redirect payload instruction,
        // bypass the error logs and re-throw it instantly so the framework can transition pages!
        if (err instanceof Error && (err.message === "NEXT_REDIRECT" || err.constructor.name === "RedirectError")) {
          throw err;
        }
        
        console.error("PIN Verification Error: ", err);
        return { success: false, error: "Server Error" };
      }
    },

    /**
     * 4. Reset Admin Security PIN
     */
    resetAdminPin: async (password: string, newPin: string) => {
      const session = await auth();
      const userId = Number(session?.user?.id);

      if (!userId || isNaN(userId)) return { success: false, error: "Unauthorized" };

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      if (!user || !user.password) return { success: false, error: "User not found" };

      const isPassValid = await bcrypt.compare(password, user.password);
      if (!isPassValid) return { success: false, error: "Incorrect Password" };

      const hashedPin = await bcrypt.hash(newPin, 10);

      const updatePayload = "admin_pin" in usersTable ? { admin_pin: hashedPin } : { adminPin: hashedPin };

      await db
        .update(usersTable)
        .set(updatePayload)
        .where(eq(usersTable.id, userId));

      return { success: true };
    },

    /**
     * 5. Logout Action
     */
    logOut: async () => {
      const cookieStore = await cookies();
      cookieStore.delete("admin_2fa_verified");
      await signOut({ redirectTo: "/login" });
    },
  };
}