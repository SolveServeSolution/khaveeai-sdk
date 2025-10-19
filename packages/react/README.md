# @khaveeai/react

React components and hooks for VRM AI avatars.

## Installation

```bash
npm install @khaveeai/react @khaveeai/core
# Peer dependencies
npm install react @react-three/fiber @react-three/drei three
```

## Basic Usage

```tsx
import { Canvas } from '@react-three/fiber';
import { KhaveeProvider, VRMAvatar } from '@khaveeai/react';

function App() {
  return (
    <KhaveeProvider>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        
        <VRMAvatar 
          src="/models/character.vrm"
          position={[0, -1, 0]}
        />
      </Canvas>
    </KhaveeProvider>
  );
}
```

## Components

- `<KhaveeProvider>` - Root provider for VRM state
- `<VRMAvatar>` - 3D VRM avatar component

## Hooks

- `useVRMExpressions()` - Control facial expressions
- `useVRMAnimations()` - Control body animations
- `useLLM()` - Stream chat responses
- `useVoice()` - Text-to-speech
- `useVRM()` - Access raw VRM instance
- `useKhavee()` - Access all functionality

## License

MIT © [KhaveeAI](https://github.com/SolveServeSolution/khaveeai-sdk)