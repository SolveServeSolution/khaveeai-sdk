import {
  QdrantClient,
  Filter,
  ScrollResult,
  SearchResponse,
  PointStruct,
  CreateCollection,
  PointId,
  WithPayloadSelector,
  WithVectorSelector
} from '@qdrant/js-client-rest';
import { OpenAI } from 'openai';
import {
  QdrantConfig,
  Document,
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
  ScrollFilter
} from '@khaveeai/core';

/**
 * Qdrant SDK for vector database operations
 * Based on the indexer_khavee.py implementation
 */
export class KhaveeQdrantClient {
  private client: QdrantClient;
  private embeddingConfig?: EmbeddingConfig;
  private llmConfig?: LLMConfig;
  private openaiClient?: OpenAI;
  private config: Required<QdrantConfig>;

  constructor(config: QdrantConfig = {}) {
    this.config = {
      host: config.host || 'http://localhost:6333',
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
      batchSize: config.batchSize || 100,
      chunkSize: config.chunkSize || 512,
      inMemory: config.inMemory || false,
    };

    this.client = this.config.inMemory
      ? new QdrantClient({ url: ':memory:' })
      : new QdrantClient({
          url: this.config.host,
          apiKey: this.config.apiKey,
          timeout: this.config.timeout,
        });
  }

  /**
   * Initialize embedding configuration
   */
  setEmbeddingConfig(config: EmbeddingConfig): void {
    this.embeddingConfig = config;
    this.openaiClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiBase,
    });
  }

  /**
   * Initialize LLM configuration
   */
  setLLMConfig(config: LLMConfig): void {
    this.llmConfig = config;
    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.apiBase,
      });
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(
    collectionName: string,
    vectorSize: number,
    distance: 'Cosine' | 'Euclidean' | 'DotProduct' = 'Cosine'
  ): Promise<void> {
    try {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: distance,
        },
      });
      console.log(`✅ Collection '${collectionName}' created successfully`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.warn(`⚠️ Collection '${collectionName}' already exists`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionName: string): Promise<void> {
    try {
      await this.client.deleteCollection(collectionName);
      console.log(`✅ Collection '${collectionName}' deleted successfully`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn(`⚠️ Collection '${collectionName}' not found`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if a collection exists
   */
  async collectionExists(collectionName: string): Promise<boolean> {
    try {
      const collections = await this.client.getCollections();
      return collections.collections.some(
        (collection) => collection.name === collectionName
      );
    } catch (error) {
      console.error(`Error checking collection existence: ${error}`);
      return false;
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(collectionName: string): Promise<CollectionInfo | null> {
    try {
      const info = await this.client.getCollection(collectionName);
      return {
        name: collectionName,
        vectorSize: info.config.params.vectors.size,
        distance: info.config.params.vectors.distance as any,
        documentCount: info.points_count || 0,
        status: info.status as any,
        optimizerStatus: info.optimizer_status,
        indexedVectorsCount: info.indexed_vectors_count,
        pointsCount: info.points_count,
      };
    } catch (error) {
      console.error(`Error getting collection info: ${error}`);
      return null;
    }
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    try {
      const collections = await this.client.getCollections();
      return collections.collections.map((collection) => collection.name);
    } catch (error) {
      console.error(`Error listing collections: ${error}`);
      return [];
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingConfig || !this.openaiClient) {
      throw new Error('Embedding configuration not set. Call setEmbeddingConfig() first.');
    }

    try {
      const response = await this.openaiClient.embeddings.create({
        model: this.embeddingConfig.model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error(`Error generating embedding: ${error}`);
      throw error;
    }
  }

  /**
   * Generate embeddings in batch
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!this.embeddingConfig || !this.openaiClient) {
      throw new Error('Embedding configuration not set. Call setEmbeddingConfig() first.');
    }

    try {
      const response = await this.openaiClient.embeddings.create({
        model: this.embeddingConfig.model,
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error(`Error generating embeddings batch: ${error}`);
      throw error;
    }
  }

  /**
   * Add a single document to collection
   */
  async addDocument(
    collectionName: string,
    document: Document
  ): Promise<void> {
    const embedding = await this.generateEmbedding(document.text);

    await this.client.upsert(collectionName, {
      points: [{
        id: document.id,
        vector: embedding,
        payload: {
          text: document.text,
          ...document.metadata
        }
      }]
    });
  }

  /**
   * Add multiple documents to collection in batch
   */
  async addDocuments(
    collectionName: string,
    documents: Document[]
  ): Promise<BatchOperationResult> {
    const startTime = Date.now();
    const batchSizes = this.config.batchSize;
    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    console.log(`📄 Processing ${documents.length} documents...`);

    for (let i = 0; i < documents.length; i += batchSizes) {
      const batch = documents.slice(i, i + batchSizes);

      try {
        // Generate embeddings for batch
        const texts = batch.map(doc => doc.text);
        const embeddings = await this.generateEmbeddingsBatch(texts);

        // Prepare points for upsert
        const points = batch.map((doc, index) => ({
          id: doc.id,
          vector: embeddings[index],
          payload: {
            text: doc.text,
            ...doc.metadata
          }
        }));

        // Upsert batch
        await this.client.upsert(collectionName, {
          points: points
        });

        processedCount += batch.length;
        console.log(`✅ Processed ${processedCount}/${documents.length} documents`);

      } catch (error) {
        failedCount += batch.length;
        const errorMsg = `Batch ${Math.floor(i/batchSizes) + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: failedCount === 0,
      processedCount,
      failedCount,
      errors,
      duration
    };
  }

  /**
   * Search documents in collection
   */
  async search(
    collectionName: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.embeddingConfig || !this.openaiClient) {
      throw new Error('Embedding configuration not set. Call setEmbeddingConfig() first.');
    }

    try {
      const embedding = await this.generateEmbedding(query);

      const searchResult = await this.client.search(collectionName, {
        vector: embedding,
        limit: options.limit || 10,
        score_threshold: options.scoreThreshold,
        with_payload: options.includeMetadata !== false,
        filter: options.filter ? this.buildFilter(options.filter) : undefined,
      });

      return searchResult.map((point) => ({
        id: point.id as string,
        text: point.payload?.text as string || '',
        score: point.score || 0,
        metadata: options.includeMetadata !== false ? point.payload as Record<string, any> : undefined,
      }));
    } catch (error) {
      console.error(`Error searching documents: ${error}`);
      throw error;
    }
  }

  /**
   * Search documents with custom embedding
   */
  async searchWithEmbedding(
    collectionName: string,
    embedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const searchResult = await this.client.search(collectionName, {
        vector: embedding,
        limit: options.limit || 10,
        score_threshold: options.scoreThreshold,
        with_payload: options.includeMetadata !== false,
        filter: options.filter ? this.buildFilter(options.filter) : undefined,
      });

      return searchResult.map((point) => ({
        id: point.id as string,
        text: point.payload?.text as string || '',
        score: point.score || 0,
        metadata: options.includeMetadata !== false ? point.payload as Record<string, any> : undefined,
      }));
    } catch (error) {
      console.error(`Error searching documents: ${error}`);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionName: string): Promise<IndexStats | null> {
    try {
      const info = await this.client.getCollection(collectionName);
      return {
        totalDocuments: info.points_count || 0,
        totalVectors: info.vectors_count || 0,
        indexSize: `${Math.round((info.points_count || 0) * 0.001)}MB`, // Rough estimate
        collectionName,
      };
    } catch (error) {
      console.error(`Error getting collection stats: ${error}`);
      return null;
    }
  }

  /**
   * Import documents from CSV file
   */
  async importFromCSV(
    collectionName: string,
    config: CSVImportConfig
  ): Promise<BatchOperationResult> {
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      // For Node.js environment, we'd use fs and csv-parser
      // For browser environment, this would need to be implemented differently
      if (typeof window === 'undefined') {
        // Node.js implementation
        const fs = await import('fs');
        const csv = await import('csv-parser');

        const documents: Document[] = [];

        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(config.filePath)
            .pipe(csv({ separator: config.delimiter || ',' }))
            .on('data', (row) => {
              try {
                // Combine text columns
                const textParts = config.textColumns
                  .map(col => row[col] || '')
                  .filter(text => text.trim())
                  .join(' ');

                if (textParts.trim()) {
                  const metadata: Record<string, any> = {};

                  // Add metadata columns
                  if (config.metadataColumns) {
                    config.metadataColumns.forEach(col => {
                      if (row[col] !== undefined) {
                        metadata[col] = row[col];
                      }
                    });
                  }

                  documents.push({
                    id: `doc_${documents.length}`,
                    text: textParts.trim(),
                    metadata
                  });
                }
              } catch (error) {
                failedCount++;
                errors.push(`Row processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            })
            .on('end', () => resolve())
            .on('error', reject);
        });

        // Batch insert documents
        const result = await this.addDocuments(collectionName, documents);

        return {
          success: result.success,
          processedCount: result.processedCount,
          failedCount: result.failedCount + failedCount,
          errors: [...result.errors, ...errors],
          duration: Date.now() - startTime
        };

      } else {
        throw new Error('CSV import is only supported in Node.js environment');
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        processedCount,
        failedCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration
      };
    }
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(
    collectionName: string,
    documentIds: string[]
  ): Promise<void> {
    try {
      await this.client.delete(collectionName, {
        points: documentIds
      });
      console.log(`✅ Deleted ${documentIds.length} documents from '${collectionName}'`);
    } catch (error) {
      console.error(`Error deleting documents: ${error}`);
      throw error;
    }
  }

  /**
   * Update document
   */
  async updateDocument(
    collectionName: string,
    document: Document
  ): Promise<void> {
    const embedding = await this.generateEmbedding(document.text);

    await this.client.upsert(collectionName, {
      points: [{
        id: document.id,
        vector: embedding,
        payload: {
          text: document.text,
          ...document.metadata
        }
      }]
    });
  }

  /**
   * Scroll through all documents in collection
   */
  async scrollCollection(
    collectionName: string,
    options: ScrollOptions = {}
  ): Promise<{ documents: Document[], nextCursor?: PointId }> {
    try {
      const scrollParams: any = {
        limit: options.limit || 100,
        filter: options.filter ? this.buildFilter(options.filter) : undefined,
        with_payload: options.with_payload !== false,
        with_vector: options.with_vector || false,
      };

      if (options.offset) {
        scrollParams.offset = options.offset;
      }

      const result = await this.client.scroll(collectionName, scrollParams);

      const documents = result.points.map((point) => ({
        id: point.id as string,
        text: point.payload?.text as string || '',
        metadata: point.payload as Record<string, any>
      }));

      return {
        documents,
        nextCursor: result.next_page_offset
      };
    } catch (error) {
      console.error(`Error scrolling collection: ${error}`);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(
    collectionName: string,
    documentId: string
  ): Promise<Document | null> {
    try {
      const result = await this.client.retrieve(collectionName, {
        ids: [documentId],
        with_payload: true
      });

      if (result.points.length === 0) {
        return null;
      }

      const point = result.points[0];
      return {
        id: point.id as string,
        text: point.payload?.text as string || '',
        metadata: point.payload as Record<string, any>
      };
    } catch (error) {
      console.error(`Error getting document: ${error}`);
      return null;
    }
  }

  /**
   * Build Qdrant filter from filter object
   */
  private buildFilter(filter: Record<string, any>): Filter {
    const conditions: any[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle operation objects
        const operation = value as any;
        let condition: any;

        switch (operation.operation) {
          case 'gt':
            condition = { field: key, range: { gt: operation.value } };
            break;
          case 'gte':
            condition = { field: key, range: { gte: operation.value } };
            break;
          case 'lt':
            condition = { field: key, range: { lt: operation.value } };
            break;
          case 'lte':
            condition = { field: key, range: { lte: operation.value } };
            break;
          case 'in':
            condition = { field: key, match: { any: operation.value } };
            break;
          case 'nin':
            condition = { field: key, match: { except: operation.value } };
            break;
          default:
            condition = { field: key, match: { value: operation.value } };
        }

        conditions.push(condition);
      } else {
        // Simple equality
        conditions.push({ field: key, match: { value } });
      }
    }

    return { must: conditions };
  }

  /**
   * Close the client connection
   */
  async close(): Promise<void> {
    // Qdrant client doesn't have explicit close method in JS client
    console.log('🔌 Qdrant client connection closed');
  }
}