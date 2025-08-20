import { NextRequest, NextResponse } from "next/server";
import { getVectorStore, similaritySearch } from "@/lib/rag";
import OpenAI from "openai"
import { getUserFromCookies } from "@/lib/user";
import { db } from "@/db/client";
// Retrieval for Chat RAG
// Two simple steps
// 1. Manual: similarity Search + custom prompt to LLM 
// 2. Use LangChain’s RunnableSequence/Chains for a RetrievalQA chain.

const CHAT_MODEL = process.env.MODEL ?? "gpt-4o-mini"; 

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: process.env.BASE_URL
})

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { collectionId, question } = await req.json().catch(() => ({}));
  if (!collectionId || !question) return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });

  // Ensure collection belongs to user
  // const owned = await db.select().from(collections).where(and(eq(collections.id, collectionId), eq(collections.userId, user.id))).limit(1);
  // if (!owned.length) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  // 1) Retrieval
  const docs = await similaritySearch(collectionId, question, 4)

  // 2) Build Context
  const contextBlocks = docs.map((d, i) => {
    const m = d[0].metadata as any;
    const label = `[${i + 1}] ${m?.title ?? "Untitled"}${m?.sourceUrl ? ` - ${m.sourceUrl}` : ""}`;
    return `${label}\n${d[0].pageContent}`;
  }).join("\n\n");

  // 3) LLM prompt
  const system = `You are NovaNote. Answer only using the provided context below. Use bracketed citations like [1], [1] that refer to the context blocks. If the answer is not in context, say you don't know. Be concise.`;
  const userMsg = `Question: ${question}\n\nContext:\n${contextBlocks}`;

  console.log("userMsg", userMsg)

  const response = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg }
      ],
      temperature: 0.2
    })
  
  const answer = response.choices[0].message.content

  // 4) References for mapping
  const references = docs.map((d, i) => {
    const m = d[0].metadata as any;
    return { idx: i + 1, title: m?.title ?? "Untitled", url: m?.sourceUrl ?? null, itemId: m?.itemId, itemType: m?.itemType };
  });

  return NextResponse.json({
    ok: true,
    answer: answer ?? "something went wrong",
    references,
  });
}