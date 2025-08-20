import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { knowledgeItems, collections } from "@/db/schema";
import { and, desc, eq, or } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/user";

const FREE = { text: 2, link: 2, pdf: 1 };

export async function GET(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("collectionId");
  if (!collectionId) return NextResponse.json({ ok: false, error: "collectionId-required" }, { status: 400 });

  const owned = await db.select().from(collections).where(
    or(
      and(eq(collections.id, collectionId), eq(collections.userId, user.id)),
      eq(collections.isShared, true)  
    )
  ).limit(1);
  if (!owned.length) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  const items = await db
    .select()
    .from(knowledgeItems)
    .where(eq(knowledgeItems.collectionId, collectionId))
    .orderBy(desc(knowledgeItems.createdAt));

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { collectionId, type, title, url } = await req.json().catch(() => ({}));
  if (!collectionId || !type || !title) {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }
  if (!["text", "link", "pdf"].includes(type)) {
    return NextResponse.json({ ok: false, error: "invalid-type" }, { status: 400 });
  }

  // Ownership check
  const owned = await db.select().from(collections).where(
    or(
      and(eq(collections.id, collectionId), eq(collections.userId, user.id)),
      eq(collections.isShared, true)  
    )
  ).limit(1);
  if (!owned.length) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  // Enforce per-collection limits for free users
  if (!user.isPro) {
    const rows = await db.select({ t: knowledgeItems.type }).from(knowledgeItems).where(eq(knowledgeItems.collectionId, collectionId));
    const used = { text: 0, link: 0, pdf: 0 } as Record<"text"|"link"|"pdf", number>;
    rows.forEach(r => { used[r.t as "text"|"link"|"pdf"] += 1; });
    const max = FREE[type as "text"|"link"|"pdf"];
    if (used[type as "text"|"link"|"pdf"] >= max) {
      return NextResponse.json({ ok: false, error: "limit-reached" }, { status: 403 });
    }
  }

  const [inserted] = await db.insert(knowledgeItems).values({
    collectionId,
    type,
    title: String(title),
    url: type === "link" ? (url ?? null) : null,
  }).returning();

  return NextResponse.json({ ok: true, item: inserted });
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
