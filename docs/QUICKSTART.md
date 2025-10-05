# 🚀 Quick Start Guide - @khaveeai/react

Get your VRM AI avatar up and running in minutes!

## 📋 Prerequisites

- **Node.js 18+** and **pnpm** (or npm/yarn)
- **React 18+** application (Next.js recommended)
- Basic knowledge of React and Three.js
- A VRM model file (.vrm)

## 🎯 5-Minute Setup

### Step 1: Install Packages

```bash
# Core packages (required)
pnpm add @khaveeai/react @khaveeai/core

# Choose your providers
pnpm add @khaveeai/providers-mock        # For development/testing
pnpm add @khaveeai/providers-openai     # For OpenAI LLM (optional)
pnpm add @khaveeai/providers-azure      # For Azure TTS (optional)

# Peer dependencies
pnpm add three @pixiv/three-vrm @react-three/fiber @react-three/drei
```

### Step 2: Create Animation Registry

Create `src/animationRegistry.ts`:

```typescript
import { AnimationRegistry } from '@khaveeai/core';

export const ANIM_REGISTRY: AnimationRegistry = {
  idle: {
    name: "idle",
    description: "Default idle breathing animation",
    tags: ["idle", "breathing", "neutral"]
  },
  wave_small: {
    name: "wave_small", 
    description: "Small friendly wave gesture",
    tags: ["greeting", "friendly", "hello", "wave"]
  },
  thinking: {
    name: "thinking",
    description: "Thoughtful pose with hand to chin",
    tags: ["thinking", "contemplating", "pondering"]
  },
  happy: {
    name: "happy",
    description: "Happy bouncing movement showing joy",
    tags: ["happy", "joy", "celebration", "positive"]
  }
};
```

### Step 3: Setup Provider (Development Mode)

Create `src/providers.tsx`:

```tsx
"use client";

import { KhaveeProvider } from "@khaveeai/react";
import { MockLLM, MockTTS } from "@khaveeai/providers-mock";
import { toolAnimate } from "@khaveeai/core";
import { ANIM_REGISTRY } from "./animationRegistry";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <KhaveeProvider
      config={{
        llm: new MockLLM(),          // Mock LLM for development
        tts: new MockTTS(),          // Mock TTS for development  
        tools: [toolAnimate],       // Enable LLM animation triggers
        animationRegistry: ANIM_REGISTRY,
      }}
    >
      {children}
    </KhaveeProvider>
  );
}
```

### Step 4: Wrap Your App

Update your `app/layout.tsx` (Next.js) or root component:

```tsx
import { Providers } from "@/providers";

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Step 5: Create Your First Avatar

Create `src/components/AvatarDemo.tsx`:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { VRMAvatar } from "@khaveeai/react";

export default function AvatarDemo() {
  return (
    <div className="h-[500px] w-full">
      <Canvas camera={{ position: [0, 1.5, 3] }}>
        {/* Lighting */}
        <Environment preset="sunset" />
        <directionalLight intensity={2} position={[10, 10, 5]} />
        
        {/* VRM Avatar */}
        <VRMAvatar 
          src="/models/your-avatar.vrm"  {/* Replace with your VRM file */}
          autoplayIdle
          position={[0, -1, 0]}
        />
        
        {/* Camera controls */}
        <OrbitControls 
          maxPolarAngle={Math.PI / 2}
          minDistance={1}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}
```

### Step 6: Add Chat Interface

Create `src/components/ChatDemo.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useLLM, useVoice, useAnimation } from "@khaveeai/react";

export default function ChatDemo() {
  const { streamChat } = useLLM();
  const { speak, speaking } = useVoice();
  const { animate } = useAnimation();
  const [messages, setMessages] = useState<Array<{role: string, text: string}>>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      let response = "";
      
      // Stream LLM response  
      for await (const chunk of streamChat({ 
        messages: [{ role: "user", content: text }] 
      })) {
        if (chunk.type === "text") {
          response += chunk.delta;
        }
      }

      setMessages(prev => [...prev, { role: "assistant", text: response }]);

      // Speak response with lip-sync
      await speak({ text: response });

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Chat messages */}
      <div className="h-80 overflow-y-auto bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <div className={`max-w-xs rounded-lg px-3 py-2 ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-3 py-2">
              Thinking...
            </div>
          </div>
        )}
      </div>
      
      {/* Input form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const text = formData.get('message') as string;
        sendMessage(text);
        e.currentTarget.reset();
      }}>
        <div className="flex gap-2">
          <input
            name="message"
            placeholder="Say hello to your avatar..."
            className="flex-1 border rounded-lg px-3 py-2"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
      
      {speaking && (
        <div className="mt-2 text-center text-sm text-blue-600">
          🔊 Speaking...
        </div>
      )}
      
      {/* Quick test buttons */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <button 
          onClick={() => animate('wave_small')}
          className="text-xs bg-gray-200 px-2 py-1 rounded"
        >
          👋 Wave
        </button>
        <button 
          onClick={() => animate('thinking')}
          className="text-xs bg-gray-200 px-2 py-1 rounded"
        >
          🤔 Think
        </button>
        <button 
          onClick={() => animate('happy')}
          className="text-xs bg-gray-200 px-2 py-1 rounded"
        >
          😊 Happy
        </button>
      </div>
    </div>
  );
}
```

### Step 7: Complete Demo Page

Update your `app/page.tsx`:

```tsx
import AvatarDemo from "@/components/AvatarDemo";
import ChatDemo from "@/components/ChatDemo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          My VRM AI Avatar
        </h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Avatar display */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold">Avatar</h2>
            </div>
            <AvatarDemo />
          </div>
          
          {/* Chat interface */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold">Chat</h2>
            </div>
            <ChatDemo />
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-600">
          <p>Try saying: "Hello!", "Can you wave?", "Tell me a joke"</p>
          <p className="text-sm mt-2">Using mock providers - no API keys needed!</p>
        </div>
      </div>
    </div>
  );
}
```

### Step 8: Add Your VRM Model

1. **Download a VRM model** or create one:
   - Download from [VRoid Hub](https://hub.vroid.com/)
   - Create with [VRoid Studio](https://vroid.com/studio)
   - Convert from other formats using tools

2. **Add to your project**:
   ```
   public/
     models/
       your-avatar.vrm  ← Place your VRM file here
   ```

3. **Update the src path** in `AvatarDemo.tsx`:
   ```tsx
   <VRMAvatar 
     src="/models/your-avatar.vrm"  {/* Your actual filename */}
     autoplayIdle
     position={[0, -1, 0]}
   />
   ```

## 🎉 You're Done!

Run your application:

```bash
pnpm dev
```

You should now see:
- ✅ A 3D VRM avatar that breathes and moves
- ✅ A chat interface that responds intelligently
- ✅ Automatic animations triggered by conversation
- ✅ Mock voice synthesis (console logs)

## 🔄 Next Steps

### Add Real Providers

When ready for production, replace mock providers:

```tsx
// .env.local
NEXT_PUBLIC_OPENAI_KEY=sk-your-openai-key
NEXT_PUBLIC_AZURE_SPEECH_KEY=your-azure-key
NEXT_PUBLIC_AZURE_REGION=eastus

// providers.tsx
import { LLMOpenAI } from "@khaveeai/providers-openai";
import { TTSAzure } from "@khaveeai/providers-azure";

const config = {
  llm: new LLMOpenAI({ 
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY! 
  }),
  tts: new TTSAzure({
    key: process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
    region: process.env.NEXT_PUBLIC_AZURE_REGION!
  }),
  // ...
};
```

### Add More Animations

Expand your animation registry:

```typescript
// Add FBX animations
dance: {
  name: "dance",
  description: "Energetic dance moves",
  tags: ["dance", "party", "celebration"],
  fbxPath: "/models/animations/dance.fbx"
}
```

### Customize Appearance

Style your components:

```tsx
// Add custom styling
<div className="avatar-container custom-styling">
  <AvatarDemo />
</div>
```

### Advanced Features

- **Multiple avatars** - Different characters
- **Scene environments** - Custom backgrounds
- **Advanced animations** - Complex motion sequences
- **Real-time interactions** - Voice input, gesture recognition

## 🐛 Troubleshooting

### Common Issues

**VRM not loading:**
- Check file path is correct
- Ensure VRM file is in `public/` directory
- Check browser console for errors

**Chat not working:**
- Verify providers are configured
- Check console for error messages
- Try mock providers first

**Animations not playing:**
- Check animation names match registry
- Verify FBX files exist (if using)
- Check console for animation logs

**Performance issues:**
- Reduce VRM complexity
- Optimize textures
- Limit simultaneous animations

### Get Help

- 📖 Read the [full documentation](./API.md)
- 🎭 Learn about [animations](./ANIMATIONS.md)
- 🛠️ Check the [development guide](./DEVELOPMENT.md)
- 🐛 Report issues on GitHub

## 🎊 Examples to Try

Once running, test these chat messages:

```
"Hello there!"           → Should wave and greet
"Can you dance?"         → Should trigger dance animation  
"I'm feeling happy!"     → Should show happy animation
"Let me think..."        → Should trigger thinking pose
"Do you agree?"          → Should nod yes
"That's wrong"           → Should shake head no
```

The mock LLM is smart enough to respond contextually and trigger appropriate animations automatically!

---

**🎉 Congratulations!** You now have a fully interactive VRM AI avatar. The mock providers let you develop and test everything without API keys, and you can seamlessly upgrade to real providers when ready for production.