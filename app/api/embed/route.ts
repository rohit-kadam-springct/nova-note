import { buildDocumentsFromText } from "@/lib/docs";
import { addDocuments } from "@/lib/rag";
import { NextRequest } from "next/server";

// This handles chunking, embeddings, and Qdrant writes with minimal code.
export async function POST(req: NextRequest) {
  try {
    const { collectionId, itemId, itemType, title, sourceUrl, text } = await req.json();
    
    const docs = buildDocumentsFromText(
      text, 
      { collectionId, itemId, itemType, title, sourceUrl }
    )
    await addDocuments(docs)
    return Response.json({ ok: true, count: docs.length });
  } catch (error: any) {
    return new Response(JSON.stringify({ ok: false, error: error?.message || "embed-failed" }), { status: 500 });
  }
}