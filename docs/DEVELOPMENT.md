# 🔧 Development Guide - @khaveeai/react

## 🚀 Getting Started for Development

### Prerequisites

- Node.js 18+ and pnpm
- Basic knowledge of React, Three.js, and TypeScript
- VRM model files for testing

### Development Setup

1. **Clone and Install**
```bash
git clone <your-repo>
cd vrm-sdk
pnpm install
```

2. **Build Packages**
```bash
pnpm build:packages
```

3. **Development Mode**
```bash
pnpm dev:packages  # Watch mode for all packages
```

## 🎭 Mock Providers for Development

The SDK includes comprehensive mock providers for development without API keys:

### Quick Mock Setup

```tsx
// For pure development
import { MockLLM, MockTTS } from "@khaveeai/providers-mock";

<KhaveeProvider config={{
  llm: new MockLLM(),
  tts: new MockTTS(),
  tools: [toolAnimate],
  animationRegistry: ANIM_REGISTRY,
}}>
  {children}
</KhaveeProvider>
```

### Smart Fallback Setup

```tsx
// Automatically falls back to mock if no API keys
import { LLMOpenAI } from "@khaveeai/providers-openai";
import { TTSAzure } from "@khaveeai/providers-azure";
import { MockLLM, MockTTS } from "@khaveeai/providers-mock";

const hasOpenAI = !!process.env.NEXT_PUBLIC_OPENAI_KEY;
const hasAzure = !!process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;

<KhaveeProvider config={{
  llm: hasOpenAI 
    ? new LLMOpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY! })
    : new MockLLM(),
  tts: hasAzure
    ? new TTSAzure({ 
        key: process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
        region: process.env.NEXT_PUBLIC_AZURE_REGION! 
      })
    : new MockTTS(),
  // ...
}}>
```

### Mixed Real/Mock Setup

```tsx
// Use real LLM but mock TTS
<KhaveeProvider config={{
  llm: new LLMOpenAI({ apiKey: "real-key" }),
  tts: new MockTTS(), // Mock TTS for silent development
  // ...
}}>
```

## 🎯 Mock Behavior

### MockLLM Features

- **Context-aware responses** based on user input
- **Automatic animation triggers** via `*trigger_animation: name*` syntax
- **Realistic streaming** with character-by-character delays
- **Conversation patterns** for common scenarios

Example conversations:
```
User: "Hello!" → Avatar: *waves* "Hello there! Nice to meet you!"
User: "Can you dance?" → Avatar: *dances* "I'd love to dance!"
User: "I'm feeling sad" → Avatar: *sad expression* "I understand..."
```

### MockTTS Features

- **Simulated speech timing** based on text length (150 WPM)
- **Mock viseme generation** for lip-sync development
- **Console logging** for debugging speech events
- **Realistic delays** to simulate real TTS latency

## 🛠️ Debugging Tools

### Console Logging

Mock providers include extensive console logging:

```javascript
// MockLLM logs
[Mock LLM] User said: "Hello!"
[Mock LLM] Responding with context-aware greeting...

// MockTTS logs  
🔊 [Mock TTS] Speaking with ja-JP-NanamiNeural: "Hello there!"
👄 [Mock Visemes] Simulating lip-sync patterns...
⏱️ [Mock TTS] Speech duration: 2000ms
✅ [Mock TTS] Speech completed
```

### Animation Debugging

```tsx
// Log animation triggers
const { animate } = useAnimation();

const debugAnimate = (name: string) => {
  console.log(`🎭 Triggering animation: ${name}`);
  animate(name);
};
```

### Provider Status

```tsx
// Check if using mock providers
const { config } = useKhavee();
const isUsingMockLLM = config.llm instanceof MockLLM;
const isUsingMockTTS = config.tts instanceof MockTTS;

console.log(`LLM: ${isUsingMockLLM ? 'Mock' : 'Real'}`);
console.log(`TTS: ${isUsingMockTTS ? 'Mock' : 'Real'}`);
```

## 🎨 Animation Development

### Adding New Animations

1. **Add to Registry**
```typescript
// animationRegistry.ts
export const ANIM_REGISTRY: AnimationRegistry = {
  // ... existing animations
  custom_wave: {
    name: "custom_wave",
    description: "Custom waving animation for greetings",
    tags: ["greeting", "custom", "wave"],
    fbxPath: "/models/animations/Custom Wave.fbx"
  }
};
```

2. **Test with Mock**
```tsx
const { animate } = useAnimation();

// Test animation
animate("custom_wave");
```

3. **LLM Integration**
The animation becomes available to the LLM automatically based on `description` and `tags`.

### Animation Debug Panel

Create a debug panel for testing animations:

```tsx
// components/AnimationDebugPanel.tsx
import { useAnimation } from "@khaveeai/react";
import { ANIM_REGISTRY } from "@/animationRegistry";

export default function AnimationDebugPanel() {
  const { animate, currentAnimation } = useAnimation();

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
      <h3 className="font-bold mb-2">Animation Debug</h3>
      <p className="text-sm text-gray-600 mb-3">
        Current: {currentAnimation || "None"}
      </p>
      
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {Object.entries(ANIM_REGISTRY).map(([name, info]) => (
          <button
            key={name}
            onClick={() => animate(name)}
            className="w-full text-left text-xs p-2 rounded bg-gray-100 hover:bg-blue-100"
            title={info.description}
          >
            <div className="font-medium">{name}</div>
            <div className="text-gray-500 truncate">
              {info.tags.join(', ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing Strategies

### Unit Testing Hooks

```tsx
// __tests__/hooks.test.tsx
import { renderHook } from '@testing-library/react';
import { useAnimation } from '@khaveeai/react';

test('animate function triggers animation', () => {
  const { result } = renderHook(() => useAnimation());
  
  act(() => {
    result.current.animate('wave_small');
  });
  
  expect(result.current.currentAnimation).toBe('wave_small');
});
```

### Integration Testing

```tsx
// __tests__/integration.test.tsx
import { render } from '@testing-library/react';
import { KhaveeProvider } from '@khaveeai/react';
import { MockLLM, MockTTS } from '@khaveeai/providers-mock';

test('chat integration with mock providers', async () => {
  const mockConfig = {
    llm: new MockLLM(),
    tts: new MockTTS(),
    tools: [],
    animationRegistry: {}
  };

  render(
    <KhaveeProvider config={mockConfig}>
      <ChatComponent />
    </KhaveeProvider>
  );

  // Test chat functionality...
});
```

## 📊 Performance Monitoring

### VRM Performance

```tsx
// Monitor VRM performance
const { vrm } = useVRM(); // Custom hook to access VRM instance

useEffect(() => {
  if (!vrm) return;
  
  const startTime = performance.now();
  
  vrm.update(0.016); // 60fps
  
  const updateTime = performance.now() - startTime;
  if (updateTime > 16) { // Slower than 60fps
    console.warn(`VRM update took ${updateTime}ms`);
  }
}, [vrm]);
```

### Animation Performance

```tsx
// Track animation state changes
const { currentAnimation } = useAnimation();

useEffect(() => {
  console.log(`Animation changed to: ${currentAnimation}`);
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    console.log(`Animation "${currentAnimation}" lasted ${duration}ms`);
  };
}, [currentAnimation]);
```

## 🚀 Production Deployment

### Environment Variables

```env
# .env.local (development)
NEXT_PUBLIC_OPENAI_KEY=sk-...
NEXT_PUBLIC_AZURE_SPEECH_KEY=...
NEXT_PUBLIC_AZURE_REGION=eastus

# .env.production
NEXT_PUBLIC_OPENAI_KEY=${OPENAI_KEY}
NEXT_PUBLIC_AZURE_SPEECH_KEY=${AZURE_SPEECH_KEY}
NEXT_PUBLIC_AZURE_REGION=${AZURE_REGION}
```

### Build Optimization

```json
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize Three.js bundle
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(gltf|glb|vrm)$/,
      use: ['file-loader']
    });
    return config;
  },
  
  // Optimize images
  images: {
    domains: ['your-cdn-domain.com']
  }
};

module.exports = nextConfig;
```

### Bundle Analysis

```bash
# Analyze bundle size
npx @next/bundle-analyzer
```

## 🔍 Troubleshooting

### Common Issues

1. **VRM not loading**
   - Check file path and CORS headers
   - Verify VRM file is valid
   - Check browser console for errors

2. **Animations not playing**
   - Verify animation exists in registry
   - Check FBX file paths
   - Ensure VRM is fully loaded

3. **Mock providers not working**
   - Check provider configuration
   - Verify import paths
   - Check console for initialization errors

4. **Performance issues**
   - Use VRM optimization utilities
   - Limit animation complexity
   - Monitor bundle size

### Debug Commands

```bash
# Check package versions
pnpm list @khaveeai/*

# Rebuild packages
pnpm clean && pnpm build:packages

# Run with verbose logging
DEBUG=khaveeai:* pnpm dev
```