import { NextAuthConfig } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth"; // 🌟 ADD THIS IMPORT
import { db } from "../db";         // 🌟 ADD YOUR DB IMPORT (Adjust path if needed)
import { users } from "../db/schema"; // 🌟 ADD YOUR SCHEMA IMPORT (Adjust path if needed)

// --- WHITE-LABEL UNIFIED TYPESCRIPT AUGMENTATIONS ---
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & import("next-auth").DefaultSession["user"];
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  }

  interface JWT {
    id: string;
    role: string;
  }
}

interface WhiteLabelAuthConfig {
  db: any;                     
  usersTable: any;             
  isEmbeddedIframe?: boolean;  
}

/**
 * Builds and returns a clean, fully initialized NextAuthConfig block.
 */
export function createAuthConfig({ 
  db, 
  usersTable, 
  isEmbeddedIframe = true 
}: WhiteLabelAuthConfig): NextAuthConfig {
  
  return {
    adapter: DrizzleAdapter(db),
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
    },
    // --- SAFE EMBEDDED IFRAME COOKIE CONFIGURATION ---
    cookies: isEmbeddedIframe 
      ? {
          sessionToken: {
            name: `next-auth.session-token`,
            options: {
              httpOnly: true,
              sameSite: "none", 
              secure: true,     
              path: "/",
            },
          },
        }
      : undefined,
      
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = (user.id ?? "").toString();
          token.role = (user.role ?? "staff").toString();
        }
        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = (token.id ?? "").toString();
          session.user.role = (token.role ?? "staff").toString();
        }
        return session;
      },
    },
    providers: [
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;

          try {
            const [user] = await db
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, credentials.email as string));

            if (!user || !user.password) return null;

            const isPasswordCorrect = await bcrypt.compare(
              credentials.password as string,
              user.password
            );

            if (!isPasswordCorrect) return null;

            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              role: user.role, 
            };
          } catch (error) {
            console.error("Auth Engine Authorization Database Error: ", error);
            return null;
          }
        },
      }),
    ],
  };
}

// ==========================================
// 🌟 ADD THIS INITIALIZATION & EXPORT BLOCK AT THE BOTTOM 🌟
// ==========================================
const authInstance = NextAuth(
  createAuthConfig({
    db,
    usersTable: users,
    isEmbeddedIframe: true
  })
);

export const handlers = authInstance.handlers;
export const auth = authInstance.auth;
export const signIn = authInstance.signIn;
export const signOut = authInstance.signOut;