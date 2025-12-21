# Nova Provider - Quick Reference

## 🚀 5-Minute Setup

### Install
```bash
pnpm add @khaveeai/providers-nova ws @aws-sdk/client-bedrock-runtime
```

### Create API Route (`pages/api/nova.ts`)
```typescript
import { createNovaProxyHandler } from '@khaveeai/providers-nova/server';

const proxy = createNovaProxyHandler({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default function handler(req, res) {
  if (req.headers.upgrade === 'websocket') {
    proxy.handleUpgrade(req, req.socket as any, Buffer.alloc(0), () => {});
    return;
  }
  res.json({ status: 'ok' });
}

export const config = { api: { bodyParser: false } };
```

### Environment Variables (`.env.local`)
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### Use in Component
```typescript
import { NovaProvider } from '@khaveeai/providers-nova';

const nova = new NovaProvider({
  websocketUrl: 'ws://localhost:3000/api/nova',
  voice: 'matthew',
});

nova.onConversationUpdate = (conv) => console.log(conv);
await nova.connect();
```

## 📖 API Reference

### Constructor
```typescript
new NovaProvider({
  websocketUrl: string;        // WebSocket URL
  voice?: string;              // matthew|joanna|ruth|gregory|kendra|stephen|tiffany
  systemPrompt?: string;       // System instructions
  temperature?: number;        // 0.0-1.0
  maxTokens?: number;         // Max response tokens
  topP?: number;              // Top P sampling
  tools?: RealtimeTool[];     // Custom tools
})
```

### Methods
```typescript
await nova.connect();          // Start session
await nova.disconnect();       // End session
await nova.sendMessage(text);  // Send text message
nova.interrupt();              // Stop AI speaking
nova.toggleMicrophone();       // Mute/unmute
nova.enableMicrophone();       // Unmute
nova.disableMicrophone();      // Mute
nova.isMicrophoneEnabled();    // Check mic status
```

### Events
```typescript
nova.onConnect = () => {};
nova.onDisconnect = () => {};
nova.onError = (error) => {};
nova.onConversationUpdate = (conv) => {};
nova.onAudioStart = () => {};
nova.onAudioEnd = () => {};
nova.onToolCall = (name, args, result) => {};
```

## 🎨 Examples

### Basic
```typescript
const nova = new NovaProvider({
  websocketUrl: '/api/nova',
  voice: 'matthew',
});

await nova.connect();
```

### With Tools
```typescript
const nova = new NovaProvider({
  websocketUrl: '/api/nova',
  tools: [{
    name: 'get_weather',
    description: 'Get weather',
    parameters: {
      location: { type: 'string', required: true }
    },
    execute: async ({ location }) => ({
      success: true,
      message: `Weather in ${location}: Sunny`
    })
  }]
});
```

### With React
```typescript
function App() {
  const [nova] = useState(() => new NovaProvider({
    websocketUrl: '/api/nova'
  }));

  return (
    <button onClick={() => nova.connect()}>
      Start
    </button>
  );
}
```

### With VRM Avatar
```typescript
import { VRMAvatar } from '@khaveeai/react';

nova.onAudioData = (analyser, audioContext) => {
  setAudioData({ analyser, audioContext });
};

<VRMAvatar
  modelUrl="/avatar.vrm"
  audioAnalyser={audioData?.analyser}
  audioContext={audioData?.audioContext}
/>
```

## 🔐 Security

✅ **Do**: Keep credentials in API route
```typescript
// pages/api/nova.ts (server-side)
credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!
}
```

❌ **Don't**: Put credentials in browser
```typescript
// Browser code - NEVER!
aws: {
  credentials: { /* Don't do this! */ }
}
```

## 🌐 Deploy

### Vercel
1. Push to GitHub
2. Import to Vercel
3. Add env vars
4. Deploy

### Others
Same for Netlify, Amplify, etc.

## 📚 Docs

- [README.md](./README.md) - Full docs
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete guide
- [COMPLETE.md](./COMPLETE.md) - Overview
- [examples/](./examples/) - Examples

## 🆘 Troubleshooting

**Connection fails?**
- Check AWS credentials
- Verify region has Bedrock
- Check WebSocket upgrade enabled

**Audio not working?**
- Allow microphone permission
- Check audio device selected
- Verify sample rates match

**TypeScript errors?**
- Install `@types/ws`
- Check tsconfig.json
- Rebuild project

## ✅ Checklist

- [ ] Install dependencies
- [ ] Create API route
- [ ] Add env variables
- [ ] Create provider instance
- [ ] Connect and test
- [ ] Deploy to production

---

**Need help?** Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.
