# @khaveeai/provider-qdrant

A comprehensive Qdrant vector database provider for the Khavee AI SDK, inspired by the indexer_khavee.py implementation.

## Features

- 🚀 **High Performance**: Batch processing and optimized operations
- 🔍 **Advanced Search**: Semantic search with filtering and scoring
- 📄 **CSV Import**: Easy data ingestion from CSV files
- 🎯 **TypeScript**: Full type safety and IntelliSense support
- ⚛️ **React Hook**: Easy integration with React applications
- 🔄 **Real-time**: Live updates and state management
- 🛡️ **Error Handling**: Comprehensive error handling and recovery

## Installation

```bash
npm install @khaveeai/provider-qdrant
# or
yarn add @khaveeai/provider-qdrant
```

## Quick Start

### Basic Usage

```typescript
import { KhaveeQdrantClient } from '@khaveeai/provider-qdrant';

// Initialize the client
const client = new KhaveeQdrantClient({
  host: 'http://localhost:6333', // or your Qdrant instance
  apiKey: 'your-api-key',        // optional
});

// Set up OpenAI for embeddings
client.setEmbeddingConfig({
  model: 'text-embedding-ada-002',
  apiKey: 'your-openai-api-key',
  provider: 'openai'
});

// Create a collection
await client.createCollection('my-knowledge-base', 1536);

// Add documents
const documents = [
  {
    id: 'doc1',
    text: 'The capital of France is Paris.',
    metadata: { category: 'geography', difficulty: 'easy' }
  },
  {
    id: 'doc2',
    text: 'The Eiffel Tower is located in Paris.',
    metadata: { category: 'landmarks', difficulty: 'medium' }
  }
];

await client.addDocuments('my-knowledge-base', documents);

// Search documents
const results = await client.search('my-knowledge-base', 'What is the capital of France?');
console.log(results);
```

### React Hook Usage

```tsx
import { useQdrant } from '@khaveeai/provider-qdrant';
import { useState } from 'react';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const {
    search,
    addDocuments,
    isLoading,
    error,
    setEmbeddingConfig,
    createCollection
  } = useQdrant({
    host: 'http://localhost:6333'
  });

  // Initialize embedding config
  React.useEffect(() => {
    setEmbeddingConfig({
      model: 'text-embedding-ada-002',
      apiKey: 'your-openai-api-key',
      provider: 'openai'
    });
  }, []);

  const handleSearch = async () => {
    if (!query) return;

    try {
      const searchResults = await search('my-collection', query);
      setResults(searchResults);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your knowledge base..."
      />
      <button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>

      {error && <div className="error">{error}</div>}

      <div>
        {results.map((result) => (
          <div key={result.id}>
            <h4>Score: {result.score.toFixed(3)}</h4>
            <p>{result.text}</p>
            {result.metadata && (
              <pre>{JSON.stringify(result.metadata, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Configuration

### Qdrant Client Configuration

```typescript
const client = new KhaveeQdrantClient({
  host: 'http://localhost:6333',        // Qdrant server URL
  apiKey: 'your-api-key',               // Optional authentication
  timeout: 30000,                       // Request timeout in ms
  batchSize: 100,                       // Batch size for operations
  chunkSize: 512,                       // Text chunk size
  inMemory: false                       // Use in-memory instance
});
```

### Embedding Configuration

```typescript
// OpenAI
client.setEmbeddingConfig({
  model: 'text-embedding-ada-002',
  apiKey: 'your-openai-api-key',
  provider: 'openai'
});

// Azure OpenAI
client.setEmbeddingConfig({
  model: 'text-embedding-ada-002',
  apiKey: 'your-azure-api-key',
  provider: 'azure-openai',
  apiBase: 'https://your-resource.openai.azure.com'
});
```

## API Reference

### KhaveeQdrantClient

#### Collection Management

```typescript
// Create collection
await client.createCollection(
  collectionName: string,
  vectorSize: number,
  distance?: 'Cosine' | 'Euclidean' | 'DotProduct'
);

// Delete collection
await client.deleteCollection(collectionName: string);

// Check if collection exists
const exists = await client.collectionExists(collectionName: string);

// Get collection info
const info = await client.getCollectionInfo(collectionName: string);

// List all collections
const collections = await client.listCollections();

// Get collection statistics
const stats = await client.getCollectionStats(collectionName: string);
```

#### Document Management

```typescript
// Add single document
await client.addDocument(collectionName, {
  id: 'unique-id',
  text: 'Document content here',
  metadata: { category: 'example', priority: 1 }
});

// Add multiple documents (batch processing)
const result = await client.addDocuments(collectionName, documents);
console.log(result);
// { success: true, processedCount: 100, failedCount: 0, errors: [], duration: 2500 }

// Update document
await client.updateDocument(collectionName, {
  id: 'existing-id',
  text: 'Updated content',
  metadata: { category: 'updated' }
});

// Delete documents
await client.deleteDocuments(collectionName, ['id1', 'id2', 'id3']);

// Get document by ID
const document = await client.getDocument(collectionName, documentId);
```

#### Search Operations

```typescript
// Semantic search
const results = await client.search(
  collectionName: string,
  query: string,
  options?: {
    limit?: number;              // Default: 10
    scoreThreshold?: number;     // Minimum similarity score
    includeMetadata?: boolean;  // Default: true
    filter?: object;            // Filter results
  }
);

// Search with custom embedding
const results = await client.searchWithEmbedding(
  collectionName: string,
  embedding: number[],
  options?: SearchOptions
);

// Scroll through all documents
const { documents, nextCursor } = await client.scrollCollection(
  collectionName: string,
  options?: {
    limit?: number;
    offset?: string;
    filter?: object;
  }
);
```

#### Data Import

```typescript
// Import from CSV file
const result = await client.importFromCSV('my-collection', {
  filePath: './data/documents.csv',
  textColumns: ['title', 'content'],    // Columns to concatenate for text
  metadataColumns: ['category', 'date'], // Columns to include in metadata
  delimiter: ',',                       // Default: ','
  encoding: 'utf-8',                    // Default: 'utf-8'
  skipRows: 1,                          // Skip header row
  maxRows: 1000                         // Maximum rows to process
});
```

### React Hook: useQdrant

```typescript
const {
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
  getClient
} = useQdrant({
  host: 'http://localhost:6333',
  apiKey: 'your-api-key'
});
```

## Examples

### Knowledge Base Application

```typescript
import { KhaveeQdrantClient } from '@khaveeai/provider-qdrant';

class KnowledgeBase {
  private client: KhaveeQdrantClient;

  constructor() {
    this.client = new KhaveeQdrantClient({
      host: process.env.QDRANT_HOST || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY
    });

    this.client.setEmbeddingConfig({
      model: 'text-embedding-ada-002',
      apiKey: process.env.OPENAI_API_KEY!,
      provider: 'openai'
    });
  }

  async initialize() {
    await this.client.createCollection('documents', 1536, 'Cosine');
  }

  async addDocument(text: string, metadata: Record<string, any>) {
    const doc = {
      id: `doc_${Date.now()}_${Math.random()}`,
      text,
      metadata
    };

    await this.client.addDocument('documents', doc);
    return doc.id;
  }

  async search(query: string, filters?: Record<string, any>) {
    return await this.client.search('documents', query, {
      limit: 5,
      scoreThreshold: 0.7,
      filter: filters
    });
  }
}

// Usage
const kb = new KnowledgeBase();
await kb.initialize();

await kb.addDocument('Paris is the capital of France', { category: 'geography' });
await kb.addDocument('The Eiffel Tower is in Paris', { category: 'landmarks' });

const results = await kb.search('French landmarks', { category: 'landmarks' });
```

### Document Management System

```tsx
import { useQdrant } from '@khaveeai/provider-qdrant';

function DocumentManager() {
  const {
    createCollection,
    addDocuments,
    search,
    deleteDocuments,
    isLoading,
    error
  } = useQdrant();

  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create collection for documents
    await createCollection('user-documents', 1536);

    // Process and add documents
    const docs = await processFile(file); // Your file processing logic
    const result = await addDocuments('user-documents', docs);

    if (result.success) {
      setDocuments([...documents, ...docs]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;

    const results = await search('user-documents', searchQuery);
    setSearchResults(results);
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} accept=".txt,.md,.csv" />

      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
        />
        <button onClick={handleSearch} disabled={isLoading}>
          Search
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div>
        <h3>Search Results</h3>
        {searchResults.map((result) => (
          <div key={result.id}>
            <p>{result.text}</p>
            <small>Score: {result.score.toFixed(3)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
import { useQdrant } from '@khaveeai/provider-qdrant';

function SearchComponent() {
  const { search, error, clearError } = useQdrant();

  const handleSearch = async () => {
    clearError(); // Clear previous errors

    try {
      const results = await search('collection', 'query');
      // Process results
    } catch (err) {
      // Error is automatically handled and stored in state
      console.error('Search failed:', err);
    }
  };

  return (
    <div>
      {error && (
        <div className="error">
          Error: {error}
          <button onClick={clearError}>Clear Error</button>
        </div>
      )}

      <button onClick={handleSearch}>Search</button>
    </div>
  );
}
```

## Performance Tips

1. **Batch Processing**: Use `addDocuments()` for bulk operations instead of multiple `addDocument()` calls
2. **Batch Size**: Adjust `batchSize` in config based on your system's memory
3. **Chunk Size**: For large documents, consider splitting them into smaller chunks
4. **Filtering**: Use search filters to reduce result sets
5. **Score Threshold**: Set appropriate score thresholds to filter out irrelevant results

## Migration from indexer_khavee.py

If you're migrating from the Python indexer, here's the equivalent mappings:

| Python Method | TypeScript Method |
|---------------|-------------------|
| `init_vector_store_index()` | `addDocuments()` |
| `load_existing_index()` | Use existing collection |
| `index_documents_async()` | `addDocuments()` + `createCollection()` |
| `ask_question_async()` | `search()` |
| `delete_all_indexed()` | `deleteCollection()` |

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](../../LICENSE) file for details.