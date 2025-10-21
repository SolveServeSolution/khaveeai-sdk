"use client";
import type {
    ChatStatus,
    Conversation,
    RealtimeTool
} from "@khaveeai/core";
import { useCallback, useEffect, useState } from "react";
import { useKhavee } from "../KhaveeProvider";

/**
 * Hook for real-time chat with OpenAI Realtime API
 * Based on your WebRTC implementation
 */
export function useRealtime() {
  const { realtimeProvider } = useKhavee();

  // State from provider
  const [isConnected, setIsConnected] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatus>("stopped");
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  if (!realtimeProvider) {
    throw new Error(
      "useRealtime must be used within KhaveeProvider with realtime config"
    );
  }

  // Setup event listeners
  useEffect(() => {
    const provider = realtimeProvider;

    provider.onConnect = () => setIsConnected(true);
    provider.onDisconnect = () => setIsConnected(false);
    provider.onConversationUpdate = (conv) => setConversation(conv);
    provider.onChatStatusChange = (status) => {
      setChatStatus(status);
      setIsThinking(status === "thinking");
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

  const sendMessage = useCallback(
    async (text: string) => {
      await realtimeProvider.sendMessage(text);
    },
    [realtimeProvider]
  );

  const interrupt = useCallback(() => {
    realtimeProvider.interrupt();
  }, [realtimeProvider]);

  const registerFunction = useCallback(
    (tool: RealtimeTool) => {
      realtimeProvider.registerFunction(tool);
    },
    [realtimeProvider]
  );

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
