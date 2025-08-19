import { Document } from "@langchain/core/documents";
import { chunkText } from "./chunk";

type Meta = {
  collectionId: string;
  itemId: string;
  itemType: "text" | "pdf" | "link";
  title: string;
  sourceUrl?: string | null;
};

export function buildDocumentsFromText(text: string, meta: Meta): Document[] {
  const chunks = chunkText(text);
  return chunks.map((c, idx) => new Document({
    pageContent: c,
    metadata: { ...meta, chunkIndex: idx },
  }));
}