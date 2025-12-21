# Complete Setup Guide - No External Server Needed

This guide shows you how to use Nova Provider **without running a separate WebSocket server**.

## 📋 Prerequisites

- AWS Account with Bedrock access
- AWS credentials (access key & secret)
- Node.js 18+ installed

## 🚀 Option 1: Next.js (Recommended)

### Step 1: Install Dependencies

```bash
pnpm add @khaveeai/providers-nova ws @aws-sdk/client-bedrock-runtime
pnpm add -D @types/ws
```

### Step 2: Create API Route

Create `pages/api/nova.ts`:

```typescript
import { createNovaProxyHandler } from '@khaveeai/providers-nova/server';
import type { NextApiRequest, NextApiResponse } from 'next';

const proxy = createNovaProxyHandler({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.upgrade === 'websocket') {
    const { socket, head } = req as any;
    proxy.handleUpgrade(req, socket, head, () => {});
    return;
  }
  res.status(200).json({ status: 'ok' });
}

export const config = {
  api: { bodyParser: false },
};
```

### Step 3: Add Environment Variables

Create `.env.local`:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Use in Your Component

```typescript
'use client';

import { NovaProvider } from '@khaveeai/providers-nova';
import { useState, useEffect } from 'react';

export default function VoiceChat() {
  const [nova, setNova] = useState<NovaProvider | null>(null);

  useEffect(() => {
    const provider = new NovaProvider({
      mode: 'websocket',
      websocketUrl: 'ws://localhost:3000/api/nova', // Your API route!
      voice: 'matthew',
    });

    provider.onConversationUpdate = (conv) => {
      console.log('Conversation:', conv);
    };

    setNova(provider);
  }, []);

  return (
    <div>
      <button onClick={() => nova?.connect()}>Start</button>
      <button onClick={() => nova?.disconnect()}>Stop</button>
    </div>
  );
}
```

### Step 5: Run

```bash
pnpm dev
```

**That's it!** Open http://localhost:3000 and click "Start"!

## 🚀 Option 2: Standalone Express Server

### Step 1: Create Server

Create `server.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import { createNovaProxyHandler } from '@khaveeai/providers-nova/server';

const app = express();
const server = createServer(app);

const proxy = createNovaProxyHandler({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/nova') {
    proxy.handleUpgrade(req, socket, head, () => {});
  }
});

server.listen(3001, () => {
  console.log('Server on ws://localhost:3001/nova');
});
```

### Step 2: Run

```bash
AWS_REGION=us-east-1 \
AWS_ACCESS_KEY_ID=xxx \
AWS_SECRET_ACCESS_KEY=xxx \
node server.ts
```

### Step 3: Connect

```typescript
const nova = new NovaProvider({
  websocketUrl: 'ws://localhost:3001/nova',
  voice: 'matthew',
});

await nova.connect();
```

## 🔐 Security Notes

### ✅ Safe (Server-side)
```typescript
// API route or server
const proxy = createNovaProxyHandler({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!, // ✅ Server-side only
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

### ❌ Unsafe (Browser)
```typescript
// Browser code - DON'T DO THIS!
const nova = new NovaProvider({
  aws: {
    credentials: { /* ❌ Never put credentials here! */ }
  }
});
```

## 🎯 What Happened?

Before:
```
Browser → Python Server → AWS Bedrock
          (separate process)
```

After:
```
Browser → Next.js API Route → AWS Bedrock
          (same app, no extra server!)
```

## 🌐 Deploy to Production

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
4. Deploy!

Your Nova chat is now live with zero infrastructure!

### Other Platforms

Same process:
- Netlify: Add env vars in dashboard
- AWS Amplify: Add env vars in console
- Self-hosted: Use `.env` file

## ✅ Benefits

✅ No separate WebSocket server  
✅ One codebase  
✅ One deployment  
✅ Secure by default  
✅ Auto-scaling  
✅ Easy to maintain  

## 🆘 Troubleshooting

**WebSocket not connecting?**
- Check AWS credentials are correct
- Ensure AWS region has Bedrock access
- Check browser console for errors

**Credentials error?**
- Verify `.env.local` file exists
- Restart dev server after adding env vars
- Check env var names match exactly

**"Mode not implemented" error?**
- Use `mode: 'websocket'` for now
- Direct AWS mode coming soon

## 📚 Next Steps

- Add custom tools
- Integrate with VRM avatars
- Deploy to production
- Add authentication

**Congratulations!** You now have Amazon Nova Speech-to-Speech with zero external dependencies! 🎉
