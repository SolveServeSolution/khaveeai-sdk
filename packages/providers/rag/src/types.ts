/**
 * Types for RAG Provider
 */

export interface RAGConfig {
  // Qdrant Configuration
  qdrantUrl: string;
  qdrantApiKey?: string;
  collectionName: string;
  
  // OpenAI Configuration for embeddings
  openaiApiKey: string;
  embeddingModel?: string;
  
  // Search Configuration
  topK?: number;
  scoreThreshold?: number;
  
  // Context Configuration
  includeMetadata?: boolean;
  metadataFields?: string[];
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload: any;
}

export interface RAGDocument {
  content: string;
  metadata?: Record<string, any>;
  score?: number;
}

export interface RAGContext {
  query: string;
  documents: RAGDocument[];
  formattedContext: string;
}
