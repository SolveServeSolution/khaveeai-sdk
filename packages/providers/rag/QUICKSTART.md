# Quick Start: RAG in 5 Minutes

Get RAG working with your VRM avatar in just 5 minutes!

## Step 1: Install (30 seconds)

```bash
npm install @khaveeai/providers-rag
```

## Step 2: Environment Variables (1 minute)

```bash
# .env.local
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your-key-here
QDRANT_COLLECTION=your-collection-name
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-key
```

## Step 3: Add to Your App (2 minutes)

```typescript
import { RAGProvider, createRAGTool } from "@khaveeai/providers-rag";
import { OpenAIRealtimeProvider } from "@khaveeai/providers-openai-realtime";
import { KhaveeProvider } from "@khaveeai/react";

// Create RAG
const rag = new RAGProvider({
  qdrantUrl: process.env.QDRANT_URL!,
  collectionName: process.env.QDRANT_COLLECTION!,
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
});

// Create tool
const ragTool = createRAGTool({ ragProvider: rag });

// Add to realtime
const realtime = new OpenAIRealtimeProvider({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  instructions: "Use search_knowledge_base to answer questions.",
  tools: [ragTool], // <- Add this line!
});

// Use as normal
export default function App() {
  return (
    <KhaveeProvider config={{ realtime }}>
      {/* Your app */}
    </KhaveeProvider>
  );
}
```

## Step 4: Test (1 minute)

Run your app and ask your avatar:
- "What services do you offer?"
- "Tell me about your products"
- "How does it work?"

The AI will automatically search your knowledge base and answer! 🎉

## That's It!

**Total time: 5 minutes**
**Total code: 10 lines**
**Total complexity: Zero**

## Optional: Monitor RAG

```typescript
realtime.onToolCall = (toolName, args, result) => {
  console.log("Searched for:", args.query);
  console.log("Found:", result.message);
};
```

## Need More?

- Full docs: [README.md](./README.md)
- Examples: [example.tsx](./example.tsx)
- Migration: [MIGRATION.md](./MIGRATION.md)

Happy coding! 🚀
