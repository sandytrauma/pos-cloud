// Location: lib/actions/auth.ts
"use server"; 

import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn, signOut, auth } from "@/lib/auth"; 
import { createAuthActions } from "./authFactory";

const authInstance = createAuthActions({
  db,
  usersTable: users,
  signIn,
  signOut,
  auth,
  isEmbeddedIframe: false
});

export async function authenticate(prevState: string | undefined, formData: FormData) {
  return authInstance.authenticate(prevState, formData);
}

export async function verifyCurrentPassword(password: string) {
  return authInstance.verifyCurrentPassword(password);
}

// 🌟 FIXED: Remove the server-side redirect trap block entirely!
// Return the raw validation payload token down to the client layout component,
// allowing the browser window to handle the page shift smoothly without thread crashes.
export async function verifyAdminPin(enteredPin: string) {
  const result = await authInstance.verifyAdminPin(enteredPin);
  return result;
}

export async function resetAdminPin(password: string, newPin: string) {
  return authInstance.resetAdminPin(password, newPin);
}

export async function logOutAction() {
  return authInstance.logOut();
}