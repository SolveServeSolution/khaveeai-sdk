# @khaveeai/providers-rag

[![npm version](https://badge.fury.io/js/@khaveeai%2Fproviders-rag.svg)](https://badge.fury.io/js/@khaveeai%2Fproviders-rag)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Clean and easy-to-use RAG (Retrieval-Augmented Generation) provider for Khavee AI SDK. Seamlessly integrate vector search with your VRM avatar conversations.

## ✨ Features

- 🔍 **Vector Search** - Powered by Qdrant for fast, accurate retrieval
- 🤖 **OpenAI Embeddings** - Automatic embedding generation
- 🎯 **Zero Config** - Works out of the box with sensible defaults
- ⚡ **Easy Integration** - One function to add RAG to your realtime chat
- 🛠️ **Flexible** - Customize search parameters and context formatting
- 📊 **Metadata Support** - Include source, title, and custom metadata

## 📦 Installation

```bash
npm install @khaveeai/providers-rag @khaveeai/providers-openai-realtime @khaveeai/react
```

## 🚀 Quick Start

### 1. Basic Setup (Easiest)

```tsx
import { RAGProvider, createRAGTool } from "@khaveeai/providers-rag";
import { OpenAIRealtimeProvider } from "@khaveeai/providers-openai-realtime";
import { KhaveeProvider, VRMAvatar } from "@khaveeai/react";

// Create RAG provider
const ragProvider = new RAGProvider({
  qdrantUrl: "https://your-qdrant-instance.com",
  qdrantApiKey: process.env.QDRANT_API_KEY,
  collectionName: "your-collection",
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
});

// Create RAG tool (one line!)
const ragTool = createRAGTool({ ragProvider });

// Add to realtime provider
const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  instructions: "You have access to a knowledge base. Use it to answer questions accurately.",
  tools: [ragTool], // That's it!
});

export default function App() {
  return (
    <KhaveeProvider config={{ realtime }}>
      <Canvas>
        <VRMAvatar src="./models/avatar.vrm" />
      </Canvas>
    </KhaveeProvider>
  );
}
```

### 2. Using Environment Variables

```bash
# .env.local
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your-qdrant-key
QDRANT_COLLECTION=your-collection-name
```

```tsx
const ragProvider = new RAGProvider({
  qdrantUrl: process.env.QDRANT_URL!,
  qdrantApiKey: process.env.QDRANT_API_KEY,
  collectionName: process.env.QDRANT_COLLECTION!,
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
});
```

## ⚙️ Configuration

### RAGProvider Options

```tsx
const ragProvider = new RAGProvider({
  // Required
  qdrantUrl: "https://your-qdrant-instance.com",
  collectionName: "your-collection",
  openaiApiKey: "sk-...",
  
  // Optional
  qdrantApiKey: "your-key",              // Optional if Qdrant is public
  embeddingModel: "text-embedding-3-small", // Default
  topK: 10,                               // Number of results (default: 10)
  scoreThreshold: 0.21,                   // Minimum relevance (default: 0.21)
  includeMetadata: true,                  // Include metadata (default: true)
  metadataFields: ["title", "source"],    // Metadata to include
});
```

### Custom Tool Configuration

```tsx
const ragTool = createRAGTool({
  ragProvider,
  toolName: "search_docs",                // Custom tool name
  toolDescription: "Search product documentation", // Custom description
  promptTemplate: (query, context) =>     // Custom formatting
    `Question: ${query}\n\nRelevant docs:\n${context}`
});
```

## 📖 Usage Examples

### Example 1: Customer Support Bot

```tsx
import { RAGProvider, createRAGTool } from "@khaveeai/providers-rag";
import { OpenAIRealtimeProvider } from "@khaveeai/providers-openai-realtime";

const ragProvider = new RAGProvider({
  qdrantUrl: process.env.QDRANT_URL!,
  qdrantApiKey: process.env.QDRANT_API_KEY,
  collectionName: "customer-support-docs",
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  topK: 5,
  scoreThreshold: 0.3,
});

const supportTool = createRAGTool({
  ragProvider,
  toolName: "search_support_docs",
  toolDescription: "Search customer support documentation for answers",
});

const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  instructions: `You are a helpful customer support assistant.
    Use the search_support_docs tool to find accurate answers from our documentation.
    Always cite your sources when using information from the knowledge base.`,
  tools: [supportTool],
  voice: "coral",
});
```

### Example 2: Product Expert

```tsx
const productRag = new RAGProvider({
  qdrantUrl: process.env.QDRANT_URL!,
  collectionName: "product-catalog",
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  metadataFields: ["title", "category", "price", "brand"],
});

const productTool = createRAGTool({
  ragProvider: productRag,
  toolName: "search_products",
  toolDescription: "Search product information and specifications",
  promptTemplate: (query, context) => 
    `Product search for: "${query}"\n\nMatching products:\n${context}\n\nUse this information to help the customer.`
});

const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  instructions: "You are a product expert. Help customers find the right products.",
  tools: [productTool],
});
```

### Example 3: Multi-Source RAG

```tsx
// Multiple knowledge bases
const docsRag = new RAGProvider({
  qdrantUrl: process.env.QDRANT_URL!,
  collectionName: "documentation",
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
});

const faqRag = new RAGProvider({
  qdrantUrl: process.env.QDRANT_URL!,
  collectionName: "faq",
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  topK: 3,
});

const tools = [
  createRAGTool({
    ragProvider: docsRag,
    toolName: "search_docs",
    toolDescription: "Search technical documentation",
  }),
  createRAGTool({
    ragProvider: faqRag,
    toolName: "search_faq",
    toolDescription: "Search frequently asked questions",
  }),
];

const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  instructions: "Search docs for technical questions, FAQ for common questions.",
  tools,
});
```

## 🔧 Advanced Usage

### Manual Context Preparation

```tsx
const ragProvider = new RAGProvider({...});

// Get context without tool wrapper
const context = await ragProvider.prepareContext("What is VRM?");

console.log(context.query);             // Original query
console.log(context.documents);         // Array of documents
console.log(context.formattedContext);  // Formatted string

// Use in custom prompt
const prompt = await ragProvider.createPromptWithContext(
  "Explain VRM avatars",
  (query, context) => `${query}\n\nContext:\n${context}`
);
```

### Update Configuration Dynamically

```tsx
const ragProvider = new RAGProvider({...});

// Update search parameters
ragProvider.updateConfig({
  topK: 15,
  scoreThreshold: 0.4,
});

// Get current config
const config = ragProvider.getConfig();
console.log(config);
```

### Direct Search

```tsx
const ragProvider = new RAGProvider({...});

// Search directly
const results = await ragProvider.searchDocuments("query");

results.forEach(result => {
  console.log(result.id);
  console.log(result.score);
  console.log(result.payload);
});
```

## 📊 Data Structure

### Expected Qdrant Payload Format

Your Qdrant documents should have this structure:

```json
{
  "text": "Your document content here",
  "metadata": {
    "title": "Document Title",
    "source": "https://example.com",
    "category": "FAQ"
  }
}
```

Or with `_node_content` (like your Morritt project):

```json
{
  "_node_content": "{\"text\":\"Content here\",\"metadata\":{\"title\":\"Title\"}}"
}
```

Both formats are automatically handled!

## 🎯 How It Works

1. **User asks a question** → OpenAI Realtime API receives it
2. **AI decides to search** → Calls your RAG tool automatically
3. **Generate embedding** → OpenAI creates vector for query
4. **Search Qdrant** → Finds most relevant documents
5. **Format context** → Prepares formatted response
6. **AI responds** → Uses context to answer accurately

## 🐛 Troubleshooting

### "No relevant information found"

```tsx
// Lower the score threshold
const ragProvider = new RAGProvider({
  scoreThreshold: 0.15, // Lower = more permissive
  topK: 20,             // Get more results
  // ...
});
```

### Metadata not showing

```tsx
const ragProvider = new RAGProvider({
  includeMetadata: true,
  metadataFields: ["title", "source", "author", "date"], // Add your fields
  // ...
});
```

### Connection issues

```bash
# Test Qdrant connection
curl https://your-qdrant-instance.com/collections

# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## 📝 Complete Example

```tsx
"use client";
import { KhaveeProvider, VRMAvatar, useRealtime } from "@khaveeai/react";
import { OpenAIRealtimeProvider } from "@khaveeai/providers-openai-realtime";
import { RAGProvider, createRAGTool } from "@khaveeai/providers-rag";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

// Setup RAG
const ragProvider = new RAGProvider({
  qdrantUrl: process.env.QDRANT_URL!,
  qdrantApiKey: process.env.QDRANT_API_KEY,
  collectionName: process.env.QDRANT_COLLECTION!,
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  topK: 10,
  scoreThreshold: 0.21,
});

const ragTool = createRAGTool({
  ragProvider,
  toolName: "search_knowledge",
  toolDescription: "Search company knowledge base",
});

// Setup Realtime with RAG
const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  instructions: `You are a knowledgeable assistant with access to our knowledge base.
    Use the search_knowledge tool when you need specific information to answer questions.
    Always provide accurate, helpful responses based on the available information.`,
  tools: [ragTool],
  voice: "coral",
});

// Monitor RAG usage
realtime.onToolCall = (toolName, args, result) => {
  console.log(`🔍 RAG Search: ${args.query}`);
  console.log(`📊 Result: ${result.success ? 'Found' : 'Not found'}`);
};

function Chat() {
  const { connect, isConnected, conversation, chatStatus } = useRealtime();
  
  return (
    <div>
      {!isConnected && <button onClick={connect}>Start Chat</button>}
      <div>Status: {chatStatus}</div>
      {conversation.map((msg, i) => (
        <div key={i}>{msg.role}: {msg.text}</div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <KhaveeProvider config={{ realtime }}>
      <Canvas>
        <VRMAvatar src="./models/avatar.vrm" position-y={-1.25} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
      </Canvas>
      <Chat />
    </KhaveeProvider>
  );
}
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- [GitHub Issues](https://github.com/SolveServeSolution/khaveeai-sdk/issues)
- [Documentation](https://github.com/SolveServeSolution/khaveeai-sdk#readme)
- Email: support@khaveeai.com

## 🚀 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to our [GitHub repository](https://github.com/SolveServeSolution/khaveeai-sdk).
