import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { Document } from "@langchain/core/documents";

const COLLECTION_NAME = "novanote_chucks";

export function getEmbeddings() {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function getQdrantClient() {
  return new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });
}

export async function getVectorStore() {
  const client = getQdrantClient();
  const embeddings = getEmbeddings();

  return await QdrantVectorStore.fromExistingCollection(embeddings, {
    collectionName: COLLECTION_NAME,
    client,
  });
}

export async function addDocuments(docs: Document[]) {
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(docs);
}
// k = number of record to return
export async function similaritySearch(
  collectionId: string,
  query: string,
  k = 2
) {
  const vectorStore = await getVectorStore();
  // Filter by metadata.collectionId
  const results = await vectorStore.similaritySearch(query, k, {
    must: [
      {
        key: "collectionId",
        match: {
          value: collectionId,
        },
      },
    ],
  });

  return results
}
