"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * 1. Standard Login Action
 */
export async function authenticate(prevState: string | undefined, formData: FormData) {
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
}

export async function verifyCurrentPassword(password: string) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  
  if (!userId || isNaN(userId)) return { success: false };

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.password) return { success: false };

  const isPassValid = await bcrypt.compare(password, user.password);
  return { success: isPassValid };
}



/**
 * 2. PIN Verification Action
 */
export async function verifyAdminPin(enteredPin: string) {
  const session = await auth();
  
  // FIX: Convert String ID to Number for Drizzle
  const userId = Number(session?.user?.id);
  
  if (!userId || isNaN(userId)) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.adminPin) return { success: false, error: "No PIN set" };

    const isValid = await bcrypt.compare(enteredPin, user.adminPin);

    if (isValid) {
      (await cookies()).set("admin_2fa_verified", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 12,
        path: "/",
      });
      return { success: true };
    }
    return { success: false, error: "Incorrect PIN" };
  } catch (err) {
    return { success: false, error: "Server Error" };
  }
}


export async function resetAdminPin(password: string, newPin: string) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  
  if (!userId || isNaN(userId)) return { success: false, error: "Unauthorized" };

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.password) return { success: false, error: "User not found" };

  // Re-verify password as a final safety check before DB write
  const isPassValid = await bcrypt.compare(password, user.password);
  if (!isPassValid) return { success: false, error: "Incorrect Password" };

  const hashedPin = await bcrypt.hash(newPin, 10);
  
  await db.update(users)
    .set({ adminPin: hashedPin })
    .where(eq(users.id, userId));

  return { success: true };
}


/**
 * 4. Logout Action
 */
export async function logOut() {
  (await cookies()).delete("admin_2fa_verified");
  await signOut({ redirectTo: "/login" });
}