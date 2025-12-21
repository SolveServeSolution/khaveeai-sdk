# Nova Provider - Zero Configuration Setup

## 🎯 Goal
Use Amazon Nova Speech-to-Speech **WITHOUT** running a separate WebSocket server!

## 📦 Two Modes Available

### Mode 1: WebSocket Proxy (Recommended for Production)
Uses a simple Next.js API route as a proxy to AWS Bedrock.

### Mode 2: Direct Integration (Coming Soon)
Direct AWS SDK integration from the browser.

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd /Users/whitemalt/Documents/vrm
pnpm add @khaveeai/providers-nova
pnpm add @aws-sdk/client-bedrock-runtime ws
```

### Step 2: Create API Route (Next.js)

Create `src/app/api/nova/route.ts`:

```typescript
import { NovaProxyServer } from '@khaveeai/providers-nova/server';

const server = new NovaProxyServer({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: Request) {
  const { socket, response } = await server.upgrade(request);
  return response;
}
```

### Step 3: Add Environment Variables

Create `.env.local`:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Step 4: Use the Provider

```typescript
import { NovaProvider } from '@khaveeai/providers-nova';

const nova = new NovaProvider({
  mode: 'websocket',
  websocketUrl: '/api/nova', // Your local API route!
  voice: 'matthew',
});

await nova.connect();
```

## 🎨 Complete Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { NovaProvider } from '@khaveeai/providers-nova';

export default function VoiceChat() {
  const [nova, setNova] = useState<NovaProvider | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const provider = new NovaProvider({
      mode: 'websocket',
      websocketUrl: '/api/nova', // No external server needed!
      voice: 'matthew',
      systemPrompt: 'You are a helpful AI assistant.',
    });

    provider.onConnect = () => setIsConnected(true);
    provider.onDisconnect = () => setIsConnected(false);
    provider.onConversationUpdate = (conv) => setConversation(conv);

    setNova(provider);

    return () => {
      if (provider.isConnected) {
        provider.disconnect();
      }
    };
  }, []);

  return (
    <div>
      <h1>Nova Voice Chat</h1>
      
      {!isConnected ? (
        <button onClick={() => nova?.connect()}>
          Start Conversation
        </button>
      ) : (
        <button onClick={() => nova?.disconnect()}>
          End Conversation
        </button>
      )}

      <div>
        {conversation.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔐 Security Best Practices

**Never expose AWS credentials in the browser!**

✅ **Correct**: Credentials in API route (server-side)
```typescript
// src/app/api/nova/route.ts
const server = new NovaProxyServer({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!, // Server-side only
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

❌ **Wrong**: Credentials in browser code
```typescript
// DON'T DO THIS!
const nova = new NovaProvider({
  aws: {
    credentials: { /* Never put credentials here! */ }
  }
});
```

## 📊 Architecture

```
Browser Client
    ↓
    ↓ WebSocket
    ↓
Next.js API Route (/api/nova)
    ↓
    ↓ AWS SDK
    ↓
AWS Bedrock (Nova Sonic)
```

## 🎯 Benefits

✅ **No separate server** - API route handles everything
✅ **Secure** - AWS credentials stay server-side  
✅ **Simple deployment** - Just deploy your Next.js app  
✅ **Auto-scaling** - Serverless by default  
✅ **Easy to use** - Same API as WebSocket mode  

## 🔧 Advanced: Custom Tools

```typescript
const nova = new NovaProvider({
  websocketUrl: '/api/nova',
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        location: { type: 'string', required: true }
      },
      execute: async ({ location }) => {
        const weather = await fetch(`/api/weather?loc=${location}`);
        return {
          success: true,
          message: `Weather in ${location}: ${await weather.text()}`
        };
      }
    }
  ]
});
```

## 🌐 Deploy Anywhere

- ✅ Vercel
- ✅ Netlify
- ✅ AWS Amplify
- ✅ Self-hosted

Just deploy your Next.js app - no additional infrastructure needed!

## 📝 Summary

1. Create API route with AWS credentials (secure)
2. Use Nova provider pointing to your API route
3. Done! No external WebSocket server required

**That's it! You now have Amazon Nova Speech-to-Speech without any external dependencies!**
