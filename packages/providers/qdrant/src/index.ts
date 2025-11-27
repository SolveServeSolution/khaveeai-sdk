// Main exports
export { KhaveeQdrantClient } from './QdrantClient';

// Export types from core
export type {
  QdrantConfig,
  Document,
  DocumentMetadata,
  EmbeddingConfig,
  LLMConfig,
  SearchOptions,
  SearchResult,
  IndexConfig,
  IndexStats,
  BatchOperationResult,
  CSVImportConfig,
  QdrantCollectionConfig,
  CollectionInfo,
  PointFilter,
  ScrollOptions,
  ScrollFilter,
  DistanceMetric
} from '@khaveeai/core';

// Re-export Qdrant types for convenience
export type { PointId } from '@qdrant/js-client-rest';