import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { SessionUser } from "./types";

const SESSION_COOKIE = "smapp_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const authSession = await prisma.authSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!authSession) return null;
  if (new Date() > authSession.expiresAt) {
    await prisma.authSession.delete({ where: { token } });
    return null;
  }

  const { user } = authSession;
  return {
    id: user.id,
    username: user.username,
    role: user.role as "SENIOR" | "CAREGIVER",
    displayName: user.displayName,
    seniorId: user.seniorId,
  };
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const authSession = await prisma.authSession.create({
    data: { userId, expiresAt },
  });
  return authSession.token;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({ where: { token } });
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_DURATION_MS / 1000,
  path: "/",
};
