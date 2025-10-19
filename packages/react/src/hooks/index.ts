"use client";
import { useState, useCallback, useEffect } from 'react';
import { useKhavee } from '../KhaveeProvider';
import type { 
  RealtimeProvider, 
  RealtimeTool, 
  Conversation, 
  ChatStatus,
  MouthState,
  PhonemeData 
} from '@khaveeai/core';

// Hook for LLM integration
export function useLLM() {
  const { config } = useKhavee();
  
  const streamChat = useCallback(async function* ({ messages }: { messages: { role: string; content: string }[] }) {
    if (!config?.llm) {
      throw new Error('LLM provider not configured');
    }
    
    yield* config.llm.streamChat({ messages });
  }, [config?.llm]);

  return { streamChat };
}

// Hook for TTS/Voice
export function useVoice() {
  const { config } = useKhavee();
  const [speaking, setSpeaking] = useState(false);
  
  const speak = useCallback(async ({ text, voice }: { text: string; voice?: string }) => {
    if (!config?.tts) {
      throw new Error('TTS provider not configured');
    }
    
    setSpeaking(true);
    try {
      await config.tts.speak({ text, voice });
    } finally {
      setSpeaking(false);
    }
  }, [config?.tts]);

  return { speak, speaking };
}

/**
 * Hook for real-time chat with OpenAI Realtime API
 * Based on your WebRTC implementation
 */
export function useRealtime() {
  const { realtimeProvider } = useKhavee();
  
  // State from provider
  const [isConnected, setIsConnected] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatus>('stopped');
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  
  if (!realtimeProvider) {
    throw new Error('useRealtime must be used within KhaveeProvider with realtime config');
  }

  // Setup event listeners
  useEffect(() => {
    const provider = realtimeProvider;

    provider.onConnect = () => setIsConnected(true);
    provider.onDisconnect = () => setIsConnected(false);
    provider.onConversationUpdate = (conv) => setConversation(conv);
    provider.onChatStatusChange = (status) => {
      setChatStatus(status);
      setIsThinking(status === 'thinking');
    };
    provider.onVolumeChange = (volume) => setCurrentVolume(volume);
    
    // Sync with provider state
    setIsConnected(provider.isConnected);
    setChatStatus(provider.chatStatus);
    setConversation(provider.conversation);
    setCurrentVolume(provider.currentVolume);

    return () => {
      // Cleanup listeners
      provider.onConnect = undefined;
      provider.onDisconnect = undefined;
      provider.onConversationUpdate = undefined;
      provider.onChatStatusChange = undefined;
      provider.onVolumeChange = undefined;
    };
  }, [realtimeProvider]);

  // Actions
  const connect = useCallback(async () => {
    await realtimeProvider.connect();
  }, [realtimeProvider]);

  const disconnect = useCallback(async () => {
    await realtimeProvider.disconnect();
  }, [realtimeProvider]);

  const sendMessage = useCallback(async (text: string) => {
    await realtimeProvider.sendMessage(text);
  }, [realtimeProvider]);

  const interrupt = useCallback(() => {
    realtimeProvider.interrupt();
  }, [realtimeProvider]);

  const registerFunction = useCallback((tool: RealtimeTool) => {
    realtimeProvider.registerFunction(tool);
  }, [realtimeProvider]);

  return {
    // State
    isConnected,
    chatStatus,
    conversation,
    currentVolume,
    isThinking,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    interrupt,
    registerFunction,
  };
}

/**
 * Hook for VRM lip sync with realtime audio
 */
export function useLipSync() {
  const { realtimeProvider } = useKhavee();
  const [mouthState, setMouthState] = useState<MouthState>({
    aa: 0, i: 0, u: 0, e: 0, o: 0
  });
  const [currentPhoneme, setCurrentPhoneme] = useState<PhonemeData | null>(null);

  useEffect(() => {
    if (!realtimeProvider) return;

    realtimeProvider.onMouthStateChange = (state) => {
      setMouthState(state);
    };

    realtimeProvider.onPhonemeDetected = (phoneme) => {
      setCurrentPhoneme(phoneme);
    };

    return () => {
      realtimeProvider.onMouthStateChange = undefined;
      realtimeProvider.onPhonemeDetected = undefined;
    };
  }, [realtimeProvider]);

  return {
    mouthState,
    currentPhoneme,
  };
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