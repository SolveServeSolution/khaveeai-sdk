"use server";

/**
 * Server-side RAG Configuration
 * Runs on the server to avoid CORS issues with Qdrant
 */

import { RAGProvider } from "@khaveeai/providers-rag";

// Server-side RAG search function
export async function searchKnowledgeBase(query: string) {
  try {
    const ragProvider = new RAGProvider({
      qdrantUrl: process.env.QDRANT_URL || "",
      qdrantApiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.QDRANT_COLLECTION || "",
      openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
      
      topK: 10,
      scoreThreshold: 0.21,
      embeddingModel: "text-embedding-3-large",
    });

    const context = await ragProvider.prepareContext(query);
    
    return {
      success: context.documents.length > 0,
      message: context.formattedContext,
      documents: context.documents,
    };
  } catch (error) {
    console.error("❌ RAG Error:", error);
    return {
      success: false,
      message: `Failed to search: ${error instanceof Error ? error.message : String(error)}`,
      documents: [],
    };
  }
}
