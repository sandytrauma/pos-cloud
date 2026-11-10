import { auth } from "@/lib/auth";

const SECRET_KEY = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "pos-cloud-production-secret-key-2026";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// In-memory sliding window rate limiter for PIN verification
interface RateLimitEntry {
  attempts: number;
  lockedUntil: number;
}
const pinRateLimitMap = new Map<string, RateLimitEntry>();

export function checkPinRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = pinRateLimitMap.get(identifier);

  if (!entry) {
    return { allowed: true, remainingAttempts: 5 };
  }

  if (entry.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // If lockout expired, reset
  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    pinRateLimitMap.delete(identifier);
    return { allowed: true, remainingAttempts: 5 };
  }

  return { allowed: true, remainingAttempts: Math.max(0, 5 - entry.attempts) };
}

export function recordFailedPinAttempt(identifier: string): { locked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = pinRateLimitMap.get(identifier) || { attempts: 0, lockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
    pinRateLimitMap.set(identifier, entry);
    return { locked: true, retryAfterSeconds: 15 * 60 };
  }

  pinRateLimitMap.set(identifier, entry);
  return { locked: false };
}

export function resetPinRateLimit(identifier: string): void {
  pinRateLimitMap.delete(identifier);
}

/**
 * Generates an HMAC-SHA256 signature for 2FA token using Web Crypto API.
 * Compatible with Edge runtime (middleware) and Node.js runtimes.
 */
async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sign2FAToken(userId: string | number): Promise<string> {
  const uid = String(userId);
  const timestamp = Date.now().toString();
  const data = `${uid}:${timestamp}`;
  const key = await getHmacKey(SECRET_KEY);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const hexSig = bufferToHex(signature);
  const payload = `${data}:${hexSig}`;
  
  if (typeof Buffer !== "undefined") {
    return Buffer.from(payload).toString("base64url");
  }
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verify2FAToken(token: string, expectedUserId: string | number): Promise<boolean> {
  if (!token || !expectedUserId) return false;

  try {
    let decoded = "";
    if (typeof Buffer !== "undefined") {
      decoded = Buffer.from(token, "base64url").toString("utf-8");
    } else {
      const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      decoded = atob(base64);
    }

    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [tokenUserId, tokenTimestampStr, providedHexSig] = parts;
    if (tokenUserId !== String(expectedUserId)) return false;

    const tokenTimestamp = parseInt(tokenTimestampStr, 10);
    if (isNaN(tokenTimestamp)) return false;

    // Check expiration (12 hours)
    if (Date.now() - tokenTimestamp > TOKEN_TTL_MS) return false;

    const data = `${tokenUserId}:${tokenTimestampStr}`;
    const key = await getHmacKey(SECRET_KEY);
    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    const expectedHexSig = bufferToHex(expectedSigBuffer);

    return providedHexSig === expectedHexSig;
  } catch (err) {
    return false;
  }
}

/**
 * Server Action Auth & RBAC Guards
 */
export async function assertAuthenticated() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Active session required.");
  }
  return session.user;
}

export async function assertRole(allowedRoles: string[]) {
  const user = await assertAuthenticated();
  const userRole = (user.role || "staff").toLowerCase();
  if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
    throw new Error(`Forbidden: Requires one of [${allowedRoles.join(", ")}] roles.`);
  }
  return user;
}
