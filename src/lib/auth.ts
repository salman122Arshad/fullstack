import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/constants";

export { SESSION_COOKIE };

const secret = process.env.AUTH_SECRET ?? "insecure-dev-secret";

function sign(userId: string): string {
  const sig = createHmac("sha256", secret).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

function verify(value: string): string | null {
  const [userId, sig] = value.split(".");
  if (!userId || !sig) return null;
  const expected = createHmac("sha256", secret).update(userId).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

/** Signed cookie value to hand to a Set-Cookie response (mocked auth: no password, just a seeded user id). */
export function createSessionCookieValue(userId: string): string {
  return sign(userId);
}

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verify(raw);
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
