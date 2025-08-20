import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/user";
import { db } from "@/db/client";
import { collections, knowledgeItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { buildDocumentsFromText } from "@/lib/docs";
import { addDocuments } from "@/lib/rag";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { collectionId, itemId, itemType, title, sourceUrl, text } = await req.json().catch(() => ({}));
  if (!collectionId || !itemId || !itemType || !title || !text) {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  // Ownership and item check
  const owned = await db.select().from(collections).where(and(eq(collections.id, collectionId), eq(collections.userId, user.id))).limit(1);
  if (!owned.length) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  const item = await db.select().from(knowledgeItems).where(and(eq(knowledgeItems.id, itemId), eq(knowledgeItems.collectionId, collectionId))).limit(1);
  if (!item.length) return NextResponse.json({ ok: false, error: "item-not-found" }, { status: 404 });

  try {
    const docs = buildDocumentsFromText(String(text), {
      collectionId,
      itemId,
      itemType,
      title,
      sourceUrl: sourceUrl ?? null,
    });
    await addDocuments(docs);
    return NextResponse.json({ ok: true, count: docs.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "embed-failed" }, { status: 500 });
  }
}
