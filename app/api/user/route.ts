import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromCookies, setUserCookies } from "@/lib/user";
import { z } from "zod";

const BodySchema = z.object({
  username: z.string().trim().min(2).max(40),
});


export async function GET() {
  // If cookie exists, return user
  const existing = await getUserFromCookies();
  if (existing) return NextResponse.json({ ok: true, user: existing });

  return NextResponse.json({ ok: false, user: null }, { status: 404 });
}

export async function POST(req: Request) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid-username" }, { status: 400 });
    }
    const username = parsed.data.username;

    // If already have cookies, return existing
    const existing = await getUserFromCookies();
    if (existing) return NextResponse.json({ ok: true, user: existing });

    // Create new user
    const inserted = await db.insert(users).values({ username }).returning()
    const user = inserted[0];
    setUserCookies({ id: user.id, username: user.username });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, isPro: user.isPro ?? false },
    });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "user-create-failed" }, { status: 500 });
  }
}
