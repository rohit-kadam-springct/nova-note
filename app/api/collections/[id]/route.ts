import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { collections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/user";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await req.json().catch(() => ({}));
  const updates: any = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.description === "string") updates.description = body.description;

  if (!updates.name && !updates.description) {
    return NextResponse.json({ ok: false, error: "nothing-to-update" }, { status: 400 });
  }

  const [updated] = await db
    .update(collections)
    .set({ ...updates })
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  return NextResponse.json({ ok: true, collection: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const id = params.id;

  const [deleted] = await db
    .delete(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}