"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    // We pass the formData and an options object
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard", // This tells NextAuth where to go on success
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
    // IMPORTANT: Next.js handles redirects by throwing a special error.
    // If you don't throw the error here, the redirect will never happen.
    throw error; 
  }
}

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}