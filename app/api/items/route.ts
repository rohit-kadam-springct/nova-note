import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { knowledgeItems, collections } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/user";

export async function GET(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("collectionId");
  if (!collectionId) return NextResponse.json({ ok: false, error: "collectionId-required" }, { status: 400 });

  const owned = await db.select().from(collections).where(and(eq(collections.id, collectionId), eq(collections.userId, user.id))).limit(1);
  if (!owned.length) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  const items = await db
    .select()
    .from(knowledgeItems)
    .where(eq(knowledgeItems.collectionId, collectionId))
    .orderBy(desc(knowledgeItems.createdAt));

  return NextResponse.json({ ok: true, items });
}

export async function DELETE(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id-required" }, { status: 400 });

  // ensure item belongs to a collection of this user
  const [item] = await db.select().from(knowledgeItems).where(eq(knowledgeItems.id, id)).limit(1);
  if (!item) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  const owned = await db.select().from(collections).where(and(eq(collections.id, item.collectionId), eq(collections.userId, user.id))).limit(1);
  if (!owned.length) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  await db.delete(knowledgeItems).where(eq(knowledgeItems.id, id));
  return NextResponse.json({ ok: true });
}
