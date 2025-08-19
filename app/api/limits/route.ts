import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { knowledgeItems, collections, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getUserFromCookies } from "@/lib/user";

const FREE = { text: 2, link: 2, pdf: 1 };

export async function GET(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("collectionId");
  if (!collectionId) return NextResponse.json({ ok: false, error: "collectionId-required" }, { status: 400 });

  const owned = await db.select().from(collections).where(and(eq(collections.id, collectionId), eq(collections.userId, user.id))).limit(1);
  if (!owned.length) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  const rows = await db.select({ type: knowledgeItems.type }).from(knowledgeItems).where(eq(knowledgeItems.collectionId, collectionId));
  const used = { text: 0, link: 0, pdf: 0 } as Record<"text" | "link" | "pdf", number>;
  rows.forEach((r) => (used[r.type as "text" | "link" | "pdf"] += 1));

  const max = user.isPro ? { text: 9999, link: 9999, pdf: 9999 } : FREE;

  return NextResponse.json({
    text: { used: used.text, max: max.text },
    link: { used: used.link, max: max.link },
    pdf: { used: used.pdf, max: max.pdf },
    isPro: user.isPro,
  });
}