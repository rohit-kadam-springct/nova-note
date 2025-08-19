import { NextRequest } from "next/server";
import { similaritySearch } from "@/lib/rag";
import OpenAI from "openai"
// Retrieval for Chat RAG
// Two simple steps
// 1. Manual: similarity Search + custom prompt to LLM 
// 2. Use LangChain’s RunnableSequence/Chains for a RetrievalQA chain.

const CHAT_MODEL = process.env.MODEL ?? "gpt-4o-mini"; 

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: process.env.BASE_URL
})

export async function POST(req: NextRequest) {
  try {
    const { collectionId, question } = await req.json();
    
    const docs = await similaritySearch(collectionId, question, 4)
    const contextBlocks = docs.map((d, i) => {
      const m = d.metadata as any;
      const label = `[${i + 1}] ${m?.title || "Untitled"}${m?.sourceUrl ? ` - ${m.sourceUrl}` : ""}`;
      return `${label}\n${d.pageContent}`;  //label:pageContent
    }).join("\n\n");

    const system = `You are NovaNote. Answer only using provided context. 
    Use bracketed citations like [1] [2] that refer to the context blocks.
    If the answer is not in context, say you don't know.
    Be concise

    Context:
    ${contextBlocks}
    `

    const userMsg = `Question: ${question}`

    const response = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg }
      ],
      temperature: 0.2
    })
    const answer = response.choices[0].message.content

    const references = docs.map((d, i) => {
      const m = d.metadata as any;
      return { idx: i + 1, title: m?.title || "Untitled", url: m?.sourceUrl || null, itemId: m?.itemId, itemType: m?.itemType };
    });

     return Response.json({ answer: answer ?? "something went wrong", references });
  
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "chat-failed" }), { status: 500 });
  }
}