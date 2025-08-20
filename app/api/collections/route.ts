import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { collections, knowledgeItems, users } from "@/db/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/user";

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Return collections with item count and last modified (max createdAt/updatedAt)
  const rows = await db.select({
    id: collections.id,
    name: collections.name,
    description: collections.description,
    isShared: collections.isShared,
    createdAt: collections.createdAt,
    updatedAt: collections.updatedAt,
    itemCount: sql<number>`COUNT(${knowledgeItems.id})`,
    lastModified: sql<Date>`GREATEST(MAX(${knowledgeItems.createdAt}), MAX(${collections.updatedAt}), MAX(${collections.createdAt}))`
  })
  .from(collections)
  .leftJoin(knowledgeItems, eq(knowledgeItems.collectionId, collections.id))
  .where(
    or(
      eq(collections.userId, user.id),       // Owned by user
      eq(collections.isShared, true)         // Or shared collections
    )
  )
  .groupBy(collections.id)
  .orderBy(desc(sql`GREATEST(${collections.updatedAt}, ${collections.createdAt})`));

  return NextResponse.json({ ok: true, collections: rows });
}

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { name, description } = await req.json().catch(() => ({}));
  const safeName = (name ?? "").toString().trim();
  if (!safeName) return NextResponse.json({ ok: false, error: "name-required" }, { status: 400 });

  // Enforce free-tier: max 2 collections unless isPro
  if (!user.isPro) {
    const count = await db.$count(collections, eq(collections.userId, user.id));
    if (count >= 2) {
      return NextResponse.json({ ok: false, error: "limit-reached" }, { status: 403 });
    }
  }

  const [inserted] = await db
    .insert(collections)
    .values({ userId: user.id, name: safeName, description: (description ?? "").toString() })
    .returning();

  return NextResponse.json({ ok: true, collection: inserted });
}