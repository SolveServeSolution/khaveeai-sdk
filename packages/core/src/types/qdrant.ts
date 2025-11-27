/**
 * Types and interfaces for the Khavee AI Qdrant SDK
 */

export interface QdrantConfig {
  host?: string;
  apiKey?: string;
  timeout?: number;
  batchSize?: number;
  chunkSize?: number;
  inMemory?: boolean;
}

export interface DocumentMetadata {
  [key: string]: any;
}

export interface Document {
  id: string;
  text: string;
  metadata?: DocumentMetadata;
}

export interface EmbeddingConfig {
  model: string;
  apiKey: string;
  provider: 'openai' | 'azure-openai';
  apiBase?: string; // For Azure OpenAI
}

export interface LLMConfig {
  model: string;
  apiKey: string;
  provider: 'openai' | 'azure-openai';
  apiBase?: string; // For Azure OpenAI
  temperature?: number;
}

export interface SearchOptions {
  limit?: number;
  scoreThreshold?: number;
  includeMetadata?: boolean;
  filter?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: DocumentMetadata;
}

export interface IndexConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  batchInsertSize?: number;
  recreateIfExists?: boolean;
}

export interface IndexStats {
  totalDocuments: number;
  totalVectors: number;
  indexSize: string;
  collectionName: string;
}

export interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
  duration: number; // in milliseconds
}

export interface CSVImportConfig {
  filePath: string;
  textColumns: string[]; // Columns to concatenate for text content
  metadataColumns?: string[]; // Columns to include in metadata
  delimiter?: string; // Default: ','
  encoding?: string; // Default: 'utf-8'
  skipRows?: number; // Number of rows to skip from start
  maxRows?: number; // Maximum number of rows to process
}

export interface QdrantCollectionConfig {
  vectors: {
    size: number;
    distance: 'Cosine' | 'Euclidean' | 'DotProduct';
  };
  optimizer?: {
    deleted_threshold?: number;
    vacuum_min_vector_number?: number;
    default_segment_number?: number;
    max_segment_size?: number;
    memmap_threshold?: number;
    indexing_threshold?: number;
    flush_interval_sec?: number;
  };
  wal_config?: {
    wal_capacity_mb?: number;
    wal_segments_ahead?: number;
  };
  quantization_config?: {
    quantization?: {
      product?: {
        compression?: 'x32' | 'x16' | 'x8';
        always_ram?: boolean;
      };
      scalar?: {
        type?: 'int8' | 'int16';
        quantile?: number;
        always_ram?: boolean;
      };
    };
  };
  hnsw_config?: {
    m?: number;
    ef_construct?: number;
    full_scan_threshold?: number;
    max_indexing_threads?: number;
    on_disk?: boolean;
    payload_m?: number;
  };
}

export type DistanceMetric = 'Cosine' | 'Euclidean' | 'DotProduct';

export interface CollectionInfo {
  name: string;
  vectorSize: number;
  distance: DistanceMetric;
  documentCount: number;
  status: 'creating' | 'created' | 'updating' | 'optimizing' | 'deleting';
  optimizerStatus?: string;
  indexedVectorsCount?: number;
  pointsCount?: number;
}

export interface PointFilter {
  key: string;
  value: any;
  operation?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
}

export interface ScrollFilter {
  must?: PointFilter[];
  should?: PointFilter[];
  must_not?: PointFilter[];
}

export interface ScrollOptions {
  limit?: number;
  offset?: { point_id?: string | number; uuid?: string };
  filter?: ScrollFilter;
  with_payload?: boolean | string[];
  with_vector?: boolean;
}