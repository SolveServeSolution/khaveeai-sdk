// Core types and interfaces
import * as THREE from 'three';

export interface AnimationClipInfo {
  name: string;
  description: string;
  tags: string[];
  duration?: number;
  fbxPath?: string;
  clip?: THREE.AnimationClip;
}

export interface VRMConfig {
  modelPath: string;
  animationRegistry: AnimationRegistry;
}

export interface LLMProvider {
  streamChat(params: { messages: { role: string; content: string }[] }): AsyncIterable<{ type: string; delta: string }>;
}

export interface TTSProvider {
  speak(params: { text: string; voice?: string }): Promise<void>;
}

export interface AnimationRegistry {
  [key: string]: AnimationClipInfo;
}

export interface KhaveeConfig {
  llm: LLMProvider;
  tts: TTSProvider;
  tools: any[];
  animationRegistry: AnimationRegistry;
}

// Re-export Three.js types that users might need
export type { AnimationClip } from 'three';