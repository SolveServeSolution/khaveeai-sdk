/**
 * Knowledge Base Example - TypeScript equivalent of indexer_khavee.py
 * Demonstrates how to use the Qdrant SDK for document indexing and search
 */

import { KhaveeQdrantClient } from '@khaveeai/provider-qdrant';
import { Document, EmbeddingConfig } from '@khaveeai/core';

// Configuration - equivalent to environment variables in Python
const config = {
  qdrantHost: process.env.QDRANT_HOST || 'http://localhost:6333',
  qdrantApiKey: process.env.QDRANT_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  embeddingModel: 'text-embedding-ada-002',
  defaultIndexName: 'punpro' // Same as in Python
};

class KnowledgeBase {
  private client: KhaveeQdrantClient;
  private embeddingConfig: EmbeddingConfig;

  constructor() {
    // Initialize client - equivalent to get_qdrant_client() in Python
    this.client = new KhaveeQdrantClient({
      host: config.qdrantHost,
      apiKey: config.qdrantApiKey,
      batchSize: 20, // Same as in Python
    });

    // Configure embeddings - equivalent to get_llms_n_embed_model() in Python
    this.embeddingConfig = {
      model: config.embeddingModel,
      apiKey: config.openaiApiKey!,
      provider: 'openai'
    };

    this.client.setEmbeddingConfig(this.embeddingConfig);
  }

  /**
   * Create documents from data - equivalent to get_documents() in Python
   */
  private createDocumentsFromData(data: any[], columns: string[]): Document[] {
    const documents: Document[] = [];

    data.forEach((row, index) => {
      // Ensure required fields are not empty - equivalent to assertion in Python
      if (!row[columns[0]]) {
        console.warn(`Title is empty for index ${index}, row ${row}`);
        return;
      }

      if (typeof row[columns[3]] !== 'string') {
        console.warn(`Skipping row ${index} - invalid details`);
        return; // Skip rows with missing or invalid details
      }

      // Create document by concatenating title and detail - same as Python
      const document: Document = {
        id: index.toString(),
        text: `${row[columns[0]]}\n\n${row[columns[3]]}`, // Concatenate title and Detail
        metadata: {
          promotion_name: row[columns[0]],
          type: row[columns[1]],
          store_company: row[columns[2]],
          condition: row[columns[3]],
        }
      };

      documents.push(document);
    });

    console.log(
      `${data.length - documents.length} documents were empty out of ${data.length}`
    );

    return documents;
  }

  /**
   * Initialize vector store index - equivalent to init_vector_store_index() in Python
   */
  async initializeVectorStoreIndex(
    documents: Document[],
    indexName: string = config.defaultIndexName
  ): Promise<void> {
    try {
      // Check if index already exists - equivalent to check_if_index_exists() in Python
      const exists = await this.client.collectionExists(indexName);

      if (exists) {
        console.log(`Index '${indexName}' already exists. Skipping re-indexing.`);
        return;
      }

      // Create collection first
      await this.client.createCollection(indexName, 1536, 'Cosine');

      // Add documents - equivalent to VectorStoreIndex.from_documents() in Python
      const result = await this.client.addDocuments(indexName, documents);

      if (result.success) {
        console.log(`Index '${indexName}' created successfully.`);
        console.log(`Processed ${result.processedCount} documents in ${result.duration}ms`);
      } else {
        console.error(`Index creation failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error(`Failed to initialize vector store index: ${error}`);
      throw error;
    }
  }

  /**
   * Delete all indexed documents - equivalent to delete_all_indexed() in Python
   */
  async deleteAllIndexed(indexName: string = config.defaultIndexName): Promise<void> {
    try {
      const exists = await this.client.collectionExists(indexName);

      if (exists) {
        console.log(`Index '${indexName}' exists. Proceeding with deletion`);
        await this.client.deleteCollection(indexName);
      } else {
        console.log("Index does not exist");
      }
    } catch (error) {
      console.error(`Error deleting index: ${error}`);
      throw error;
    }
  }

  /**
   * Ask question - equivalent to ask_question_async() in Python
   */
  async askQuestion(
    question: string,
    indexName: string = config.defaultIndexName,
    limit: number = 5
  ): Promise<string> {
    try {
      const results = await this.client.search(indexName, question, {
        limit,
        scoreThreshold: 0.7,
        includeMetadata: true
      });

      if (results.length === 0) {
        return "I couldn't find relevant information to answer your question.";
      }

      // Format response similar to Python implementation
      let response = `Based on the knowledge base, here's what I found:\n\n`;

      results.forEach((result, index) => {
        response += `${index + 1}. ${result.text}\n`;
        response += `   Relevance: ${(result.score * 100).toFixed(1)}%\n\n`;
      });

      return response;
    } catch (error) {
      console.error(`Error answering question: ${error}`);
      return "Sorry, I encountered an error while searching for an answer.";
    }
  }

  /**
   * Test direct embedding queries - equivalent to test() function in Python
   */
  async testDirectQuery(
    question: string = "สวัสดีครับ",
    indexName: string = 'test'
  ): Promise<void> {
    try {
      // Generate embedding for the question
      const embedding = await this.generateEmbedding(question);

      // Search with embedding directly
      const results = await this.client.searchWithEmbedding(indexName, embedding, {
        limit: 5,
        includeMetadata: true
      });

      console.log(`\n🔍 Query: "${question}"`);
      console.log(`📊 Found ${results.length} results:\n`);

      results.forEach((result, index) => {
        console.log(`----------- ${index + 1} ------------`);
        console.log(`Score: ${result.score.toFixed(4)}`);
        console.log(`Text: ${result.text.substring(0, 200)}...`);
        if (result.metadata) {
          console.log(`Metadata: ${JSON.stringify(result.metadata, null, 2)}`);
        }
      });

    } catch (error) {
      console.error(`Test query failed: ${error}`);
    }
  }

  /**
   * Generate embedding helper method
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    return await this.client.search('temp', text, { limit: 1 }).then(() => {
      // This is a workaround to ensure embedding config is set
      // In a real implementation, you'd call the embedding method directly
      return this.client['generateEmbedding'](text);
    });
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(indexName: string = config.defaultIndexName): Promise<void> {
    try {
      const stats = await this.client.getCollectionStats(indexName);

      if (stats) {
        console.log(`📈 Collection Statistics for '${indexName}':`);
        console.log(`   Total Documents: ${stats.totalDocuments}`);
        console.log(`   Total Vectors: ${stats.totalVectors}`);
        console.log(`   Index Size: ${stats.indexSize}`);
      } else {
        console.log(`Collection '${indexName}' not found`);
      }
    } catch (error) {
      console.error(`Error getting collection stats: ${error}`);
    }
  }
}

// Example usage - equivalent to main() function in Python
async function main() {
  const kb = new KnowledgeBase();

  try {
    // Sample data equivalent to CSV data in Python
    const sampleData = [
      {
        promotion_name: "ส่วนลด 20% สำหรับสินค้าอิเล็กทรอนิกส์",
        type: "discount",
        store_company: "Power Buy",
        condition: "ซื้อครบ 5000 บาทขึ้นไป"
      },
      {
        promotion_name: "Buy 1 Get 1 Free สำหรับเครื่องดื่ม",
        type: "bogo",
        store_company: "Starbucks",
        condition: "เฉพาะเครื่องดื่มขนาด Grande"
      },
      {
        promotion_name: "ส่วนลด 50% สำหรับหนังสือ",
        type: "discount",
        store_company: "Kinokuniya",
        condition: "เฉพาะวันศุกร์"
      }
    ];

    const columns = ["promotion_name", "type", "store_company", "condition"];

    // Create documents from sample data
    const documents = kb['createDocumentsFromData'](sampleData, columns);

    // Initialize the index
    await kb.initializeVectorStoreIndex(documents, config.defaultIndexName);

    // Get statistics
    await kb.getCollectionStats();

    // Interactive Q&A loop - equivalent to while True loop in Python
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askLoop = async () => {
      rl.question('Ask a question (or "exit" to quit): ', async (question: string) => {
        if (question.toLowerCase() === 'exit') {
          rl.close();
          return;
        }

        try {
          const answer = await kb.askQuestion(question);
          console.log(`\n💬 Answer:\n${answer}\n`);
        } catch (error) {
          console.error('❌ Error getting answer:', error);
        }

        askLoop(); // Continue loop
      });
    };

    console.log('🤖 Knowledge Base is ready! Ask me anything...');
    askLoop();

  } catch (error) {
    console.error('❌ Error in main:', error);
    process.exit(1);
  }
}

// Test function - equivalent to test() in Python
async function test() {
  const kb = new KnowledgeBase();

  console.log('🧪 Testing direct query functionality...\n');

  // This would require an existing collection named 'test'
  await kb.testDirectQuery("สวัสดีครับ", 'test');
}

// Export for use in other modules
export { KnowledgeBase, main, test };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}