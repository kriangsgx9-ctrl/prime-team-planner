import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./token";

export type SessionMember = {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
};

/** The signed-in member, re-read from the DB on every request so isAdmin
 *  changes and deactivation take effect immediately. Deduplicated per request. */
const sessionState = cache(async (): Promise<{ member: SessionMember | null; kicked: boolean }> => {
  const store = await cookies();
  const token = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!token) return { member: null, kicked: false };
  const member = await prisma.member.findUnique({
    where: { id: token.memberId },
    select: { id: true, name: true, username: true, isAdmin: true, isActive: true, sessionId: true, sessionSeenAt: true },
  });
  if (!member || !member.isActive || !member.username) return { member: null, kicked: false };
  // One login at a time: a newer login (or an admin reset) replaces sessionId.
  if (member.sessionId !== token.sid) return { member: null, kicked: true };
  if (!member.sessionSeenAt || Date.now() - member.sessionSeenAt.getTime() > 5 * 60_000) {
    await prisma.member.update({ where: { id: member.id }, data: { sessionSeenAt: new Date() } });
  }
  const { id, name, username, isAdmin } = member;
  return { member: { id, name, username, isAdmin }, kicked: false };
});

export const getSessionMember = cache(async (): Promise<SessionMember | null> => (await sessionState()).member);

export async function startSession(memberId: string) {
  const sid = crypto.randomUUID();
  // Replacing sessionId signs out any other device using this account.
  await prisma.member.update({ where: { id: memberId }, data: { sessionId: sid, sessionSeenAt: new Date() } });
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(memberId, sid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (token) await prisma.member.updateMany({ where: { id: token.memberId, sessionId: token.sid }, data: { sessionId: null } });
  store.delete(SESSION_COOKIE);
}

/** Any signed-in manager. */
export async function requireUser(): Promise<SessionMember> {
  const { member, kicked } = await sessionState();
  if (!member) redirect(kicked ? "/login?reason=other-device" : "/login");
  return member;
}

export async function requireAdmin(): Promise<SessionMember> {
  const member = await requireUser();
  if (!member.isAdmin) redirect("/dashboard?reason=admin-only");
  return member;
}

/** For server actions: throws instead of redirecting. */
export async function actionUser(): Promise<SessionMember> {
  const { member, kicked } = await sessionState();
  if (!member) throw new Error(kicked ? "บัญชีนี้ถูกเข้าใช้งานจากอุปกรณ์อื่น กรุณาเข้าสู่ระบบใหม่" : "กรุณาเข้าสู่ระบบใหม่");
  return member;
}

export async function actionAdmin(): Promise<SessionMember> {
  const member = await actionUser();
  if (!member.isAdmin) throw new Error("เฉพาะแอดมินเท่านั้น");
  return member;
}
