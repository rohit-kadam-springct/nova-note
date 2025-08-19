import { cookies } from "next/headers";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const USER_ID_COOKIE = "novanote_user_id";
const USERNAME_COOKIE = "novanote_username";

export type AppUser = {
  id: string;
  username: string;
  isPro: boolean;
};

export async function getUserFromCookies(): Promise<AppUser | null > {
  const store = await cookies()
  const uid = store.get(USER_ID_COOKIE)?.value;
  const uname = store.get(USERNAME_COOKIE)?.value;

  if (!uid || !uname) return null;

  const row = await db.select().from(users).where(eq(users.id, uid)).limit(1)
  if (!row.length) return null;

  const user = row[0]

  return { id: user.id, username: user.username, isPro: user.isPro ?? false };
}

export async function setUserCookies({ id, username }: { id: string; username: string }) {
  const store = await cookies();
  const maxAge = 60 * 60 * 24 * 180; // 180 days
  store.set(USER_ID_COOKIE, id, { httpOnly: true, sameSite: "lax", maxAge, path: "/" });
  store.set(USERNAME_COOKIE, username, { httpOnly: false, sameSite: "lax", maxAge, path: "/" });
}