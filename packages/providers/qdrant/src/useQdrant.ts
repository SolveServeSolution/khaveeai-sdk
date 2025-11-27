import { useState, useCallback, useRef, useEffect } from 'react';
import {
  QdrantConfig,
  Document,
  SearchOptions,
  SearchResult,
  BatchOperationResult,
  CSVImportConfig,
  IndexStats,
  CollectionInfo,
  EmbeddingConfig,
  LLMConfig
} from '@khaveeai/core';
import { KhaveeQdrantClient } from './QdrantClient';

/**
 * React Hook for Khavee Qdrant Client
 */
export function useQdrant(config: QdrantConfig = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<KhaveeQdrantClient | null>(null);

  // Initialize client
  useEffect(() => {
    try {
      clientRef.current = new KhaveeQdrantClient(config);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Qdrant client');
      setIsConnected(false);
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.close();
      }
    };
  }, [config.host, config.apiKey, config.inMemory]);

  const getClient = useCallback(() => {
    if (!clientRef.current) {
      throw new Error('Qdrant client not initialized');
    }
    return clientRef.current;
  }, []);

  const setEmbeddingConfig = useCallback((embeddingConfig: EmbeddingConfig) => {
    try {
      getClient().setEmbeddingConfig(embeddingConfig);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set embedding config');
    }
  }, [getClient]);

  const setLLMConfig = useCallback((llmConfig: LLMConfig) => {
    try {
      getClient().setLLMConfig(llmConfig);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set LLM config');
    }
  }, [getClient]);

  const createCollection = useCallback(async (
    collectionName: string,
    vectorSize: number,
    distance: 'Cosine' | 'Euclidean' | 'DotProduct' = 'Cosine'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await getClient().createCollection(collectionName, vectorSize, distance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  const deleteCollection = useCallback(async (collectionName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await getClient().deleteCollection(collectionName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  const collectionExists = useCallback(async (collectionName: string): Promise<boolean> => {
    try {
      return await getClient().collectionExists(collectionName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check collection existence');
      return false;
    }
  }, [getClient]);

  const getCollectionInfo = useCallback(async (collectionName: string): Promise<CollectionInfo | null> => {
    try {
      return await getClient().getCollectionInfo(collectionName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get collection info');
      return null;
    }
  }, [getClient]);

  const listCollections = useCallback(async (): Promise<string[]> => {
    try {
      return await getClient().listCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list collections');
      return [];
    }
  }, [getClient]);

  const addDocument = useCallback(async (
    collectionName: string,
    document: Document
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await getClient().addDocument(collectionName, document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  const addDocuments = useCallback(async (
    collectionName: string,
    documents: Document[]
  ): Promise<BatchOperationResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().addDocuments(collectionName, documents);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add documents');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  const search = useCallback(async (
    collectionName: string,
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> => {
    try {
      return await getClient().search(collectionName, query, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search documents');
      return [];
    }
  }, [getClient]);

  const searchWithEmbedding = useCallback(async (
    collectionName: string,
    embedding: number[],
    options?: SearchOptions
  ): Promise<SearchResult[]> => {
    try {
      return await getClient().searchWithEmbedding(collectionName, embedding, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search with embedding');
      return [];
    }
  }, [getClient]);

  const getCollectionStats = useCallback(async (collectionName: string): Promise<IndexStats | null> => {
    try {
      return await getClient().getCollectionStats(collectionName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get collection stats');
      return null;
    }
  }, [getClient]);

  const importFromCSV = useCallback(async (
    collectionName: string,
    csvConfig: CSVImportConfig
  ): Promise<BatchOperationResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().importFromCSV(collectionName, csvConfig);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import from CSV');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  const deleteDocuments = useCallback(async (
    collectionName: string,
    documentIds: string[]
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await getClient().deleteDocuments(collectionName, documentIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete documents');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  const updateDocument = useCallback(async (
    collectionName: string,
    document: Document
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await getClient().updateDocument(collectionName, document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  const scrollCollection = useCallback(async (
    collectionName: string,
    options?: { limit?: number; offset?: { point_id?: string | number; uuid?: string }; filter?: any }
  ) => {
    try {
      return await getClient().scrollCollection(collectionName, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scroll collection');
      return { documents: [] };
    }
  }, [getClient]);

  const getDocument = useCallback(async (
    collectionName: string,
    documentId: string
  ): Promise<Document | null> => {
    try {
      return await getClient().getDocument(collectionName, documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get document');
      return null;
    }
  }, [getClient]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isConnected,
    isLoading,
    error,

    // Configuration
    setEmbeddingConfig,
    setLLMConfig,

    // Collection Management
    createCollection,
    deleteCollection,
    collectionExists,
    getCollectionInfo,
    listCollections,

    // Document Management
    addDocument,
    addDocuments,
    deleteDocuments,
    updateDocument,
    getDocument,

    // Search
    search,
    searchWithEmbedding,

    // Utilities
    getCollectionStats,
    importFromCSV,
    scrollCollection,
    clearError,

    // Access to raw client
    getClient,
  };
}