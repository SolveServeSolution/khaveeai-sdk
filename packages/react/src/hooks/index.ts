"use client";
import { useState, useCallback } from 'react';
import { useKhavee } from '../KhaveeProvider';

// Hook for LLM integration
export function useLLM() {
  const { config } = useKhavee();
  
  const streamChat = useCallback(async function* ({ messages }: { messages: { role: string; content: string }[] }) {
    if (!config.llm) {
      throw new Error('LLM provider not configured');
    }
    
    yield* config.llm.streamChat({ messages });
  }, [config.llm]);

  return { streamChat };
}

// Hook for TTS/Voice
export function useVoice() {
  const { config } = useKhavee();
  const [speaking, setSpeaking] = useState(false);
  
  const speak = useCallback(async ({ text, voice }: { text: string; voice?: string }) => {
    if (!config.tts) {
      throw new Error('TTS provider not configured');
    }
    
    setSpeaking(true);
    try {
      await config.tts.speak({ text, voice });
    } finally {
      setSpeaking(false);
    }
  }, [config.tts]);

  return { speak, speaking };
}

// Hook for animation control
export function useAnimation() {
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [visemes, setVisemes] = useState<Record<string, number>>({});
  const [expressions, setExpressions] = useState<Record<string, number>>({});
  
  const animate = useCallback((animationName: string) => {
    setCurrentAnimation(animationName);
  }, []);
  
  const pulse = useCallback((expressionName: string, intensity = 0.5, duration = 1000) => {
    setExpressions(prev => ({ ...prev, [expressionName]: intensity }));
    
    setTimeout(() => {
      setExpressions(prev => ({ ...prev, [expressionName]: 0 }));
    }, duration);
  }, []);
  
  const setViseme = useCallback((viseme: string, value: number) => {
    setVisemes(prev => ({ ...prev, [viseme]: value }));
  }, []);
  
  const setExpression = useCallback((expression: string, value: number) => {
    setExpressions(prev => ({ ...prev, [expression]: value }));
  }, []);

  return { 
    currentAnimation, 
    visemes, 
    expressions, 
    animate, 
    pulse, 
    setViseme, 
    setExpression 
  };
}