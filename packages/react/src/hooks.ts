"use client";
import { useContext, useState, useCallback, useEffect } from 'react';
import { useKhavee } from './KhaveeProvider';

// Mock animation state
let mockAnimationState = {
  currentAnimation: null as string | null,
  visemes: {} as Record<string, number>,
  expressions: {} as Record<string, number>,
};

export function useLLM() {
  const { config } = useKhavee();

  const streamChat = useCallback(async function* ({ messages }: { messages: { role: string; content: string }[] }) {
    if (!config.llm) {
      throw new Error('LLM provider not configured');
    }

    yield* config.llm.streamChat({ messages });
  }, [config.llm]);

  return {
    streamChat,
  };
}

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

  return {
    speak,
    speaking,
  };
}

export function useAnimation() {
  const { config } = useKhavee();
  const [currentAnimation, setCurrentAnimation] = useState<string | null>("idle");
  const [visemes, setVisemes] = useState<Record<string, number>>({});
  const [expressions, setExpressions] = useState<Record<string, number>>({});
  const [animationExpressions, setAnimationExpressions] = useState<Record<string, number>>({});

  // Animation to expression presets (like your working example)
  const animationExpressionPresets: Record<string, Record<string, number>> = {
    wave_small: { happy: 0.3 },
    smile_soft: { happy: 0.6 },
    laugh: { happy: 0.9 },
    sad: { sad: 0.8, happy: 0 },
    surprised: { happy: 0.2 },
    thinking: { happy: 0 },
    nod_yes: { happy: 0.4 },
    shake_no: { happy: 0 },
    swing_dance: { happy: 0.8 },
    thriller_dance: { happy: 0.3 },
    punch: { angry: 0.7, happy: 0 },
    idle: { happy: 0.1 }
  };

  const animate = useCallback((animationName: string) => {
    console.log(`[Animation] Triggering: ${animationName}`);
    
    // Check if animation exists in registry
    if (config.animationRegistry && config.animationRegistry[animationName]) {
      setCurrentAnimation(animationName);
      mockAnimationState.currentAnimation = animationName;
      
      // Apply emotion expressions immediately
      const emotionPreset = animationExpressionPresets[animationName] || {};
      setAnimationExpressions(emotionPreset);
      console.log(`[Animation] Applied emotions:`, emotionPreset);
      
      // Auto-stop after animation duration and return to idle
      const animInfo = config.animationRegistry[animationName];
      const duration = animInfo.duration || 3000;
      
      setTimeout(() => {
        setCurrentAnimation("idle"); // Return to idle instead of null
        mockAnimationState.currentAnimation = "idle";
        setAnimationExpressions(animationExpressionPresets["idle"] || {});
      }, duration);
    } else {
      console.warn(`[Animation] Animation '${animationName}' not found in registry`);
    }
  }, [config.animationRegistry]);

  const pulse = useCallback((expression: string, intensity: number = 0.8, duration: number = 1000) => {
    console.log(`[Animation] Pulsing expression: ${expression} (${intensity})`);
    
    // Animate expression up then down
    setExpressions(prev => ({ ...prev, [expression]: intensity }));
    mockAnimationState.expressions[expression] = intensity;
    
    setTimeout(() => {
      setExpressions(prev => ({ ...prev, [expression]: 0 }));
      mockAnimationState.expressions[expression] = 0;
    }, duration);
  }, []);

  const setViseme = useCallback((viseme: string, value: number) => {
    setVisemes(prev => ({ ...prev, [viseme]: value }));
    mockAnimationState.visemes[viseme] = value;
  }, []);

  const setExpression = useCallback((expression: string, value: number) => {
    setExpressions(prev => ({ ...prev, [expression]: value }));
    mockAnimationState.expressions[expression] = value;
  }, []);

  // Initialize with idle expressions
  useEffect(() => {
    setAnimationExpressions({ happy: 0.1 });
  }, []);

  return {
    currentAnimation,
    visemes,
    expressions,
    animationExpressions, // Add this for VRMAvatar to use
    animationRegistry: config.animationRegistry,
    animate,
    pulse,
    setViseme,
    setExpression,
  };
}