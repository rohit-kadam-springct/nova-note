import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { getUserFromCookies } from "@/lib/user";
import { db } from "@/db/client";
import { collections } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { collectionId, url } = await req.json().catch(() => ({}));
  if (!collectionId || !url) return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });

  // Verify collection ownership
  const owned = await db.select().from(collections).where(and(eq(collections.id, collectionId), eq(collections.userId, user.id))).limit(1);
  if (!owned.length) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  try {
    const html = await fetch(url, { headers: { "User-Agent": "NovaNoteBot/1.0" } }).then(r => r.text());
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const title = article?.title || url;
    const content = (article?.textContent || "").trim();

    if (!content) {
      return NextResponse.json({ ok: false, error: "empty-content" }, { status: 422 });
    }

    return NextResponse.json({ ok: true, title, content });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "crawl-failed" }, { status: 500 });
  }
}