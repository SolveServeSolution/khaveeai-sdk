/**
 * RAG Provider for Khavee AI SDK
 * Clean and easy-to-use RAG implementation with Qdrant
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { RAGConfig, RAGContext, RAGDocument, SearchResult } from "./types";

export class RAGProvider {
  private qdrantClient: QdrantClient;
  private openaiClient: OpenAI;
  private config: RAGConfig & {
    topK: number;
    scoreThreshold: number;
    includeMetadata: boolean;
    metadataFields: string[];
    embeddingModel: string;
  };

  constructor(config: RAGConfig) {
    // Initialize with defaults
    this.config = {
      topK: 10,
      scoreThreshold: 0.21,
      includeMetadata: true,
      metadataFields: ["title", "source"],
      embeddingModel: "text-embedding-3-small",
      ...config,
    };

    // Initialize Qdrant client
    this.qdrantClient = new QdrantClient({
      url: this.config.qdrantUrl,
      apiKey: this.config.qdrantApiKey,
    });

    // Initialize OpenAI client
    this.openaiClient = new OpenAI({
      apiKey: this.config.openaiApiKey,
    });
  }

  /**
   * Generate embedding for text using OpenAI
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.embeddings.create({
        model: this.config.embeddingModel || "text-embedding-3-large",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Search documents in Qdrant
   */
  async searchDocuments(query: string): Promise<SearchResult[]> {
    try {
      const embedding = await this.getEmbedding(query);

      const searchResults = await this.qdrantClient.search(
        this.config.collectionName,
        {
          vector: embedding,
          limit: this.config.topK,
          score_threshold: this.config.scoreThreshold,
          with_payload: true,
        }
      );

      return searchResults.map((result: any) => ({
        id: result.id,
        score: result.score,
        payload: result.payload,
      }));
    } catch (error) {
      console.error("Qdrant search error:", error);
      throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format document content
   */
  private formatDocument(doc: any, score?: number): RAGDocument {
    // Handle nested _node_content structure (like your Morritt project)
    let content = doc;
    if (typeof doc._node_content === "string") {
      try {
        content = JSON.parse(doc._node_content);
      } catch {
        content = doc;
      }
    }

    // Extract text content
    const text = content.text || content.content || JSON.stringify(content);

    // Extract metadata
    const metadata: Record<string, any> = {};
    if (this.config.includeMetadata) {
      if (content.metadata) {
        Object.assign(metadata, content.metadata);
      }

      // Include specified metadata fields
      for (const field of this.config.metadataFields) {
        if (content[field]) {
          metadata[field] = content[field];
        }
      }
    }

    return {
      content: text,
      metadata,
      score,
    };
  }

  /**
   * Format context for AI prompt
   */
  private formatContext(documents: RAGDocument[]): string {
    return documents
      .map((doc, index) => {
        let formatted = `[${index + 1}] ${doc.content}`;

        if (doc.metadata && Object.keys(doc.metadata).length > 0) {
          const metaStr = Object.entries(doc.metadata)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");

          if (metaStr) {
            formatted += `\n(${metaStr})`;
          }
        }

        if (doc.score) {
          formatted += `\n[Relevance: ${(doc.score * 100).toFixed(1)}%]`;
        }

        return formatted;
      })
      .join("\n\n");
  }

  /**
   * Main method: Search and prepare context for AI
   */
  async prepareContext(query: string): Promise<RAGContext> {
    try {
      // Search documents
      const searchResults = await this.searchDocuments(query);

      // Format documents
      const documents = searchResults.map((result) =>
        this.formatDocument(result.payload, result.score)
      );

      // Format context
      const formattedContext = this.formatContext(documents);

      return {
        query,
        documents,
        formattedContext,
      };
    } catch (error) {
      throw new Error(`Failed to prepare context: ${error}`);
    }
  }

  /**
   * Create a prompt with RAG context
   */
  async createPromptWithContext(
    query: string,
    promptTemplate?: (query: string, context: string) => string
  ): Promise<string> {
    const ragContext = await this.prepareContext(query);

    // Default prompt template
    const defaultTemplate = (q: string, ctx: string) =>
      `${q}\n\nRelevant information:\n${ctx}`;

    const template = promptTemplate || defaultTemplate;
    return template(query, ragContext.formattedContext);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RAGConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}
