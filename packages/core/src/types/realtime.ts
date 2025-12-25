import { RealtimeMessage, Conversation, ChatStatus } from './conversation';
import { MouthState, PhonemeData } from './audio';

/**
 * Configuration for connecting to an MCP server
 */
export interface MCPServerConfig {
  /**
   * Unique identifier for the server. Used for tool name prefixing.
   */
  id: string;
  /**
   * Streamable HTTP endpoint for the MCP server.
   */
  url: string;
  /**
   * Future-proofing for additional transports. Currently only streamable-http is supported.
   */
  transport?: 'streamable-http';
  /**
   * Optional HTTP headers to send on every transport request (e.g., auth tokens).
   */
  headers?: Record<string, string>;
  /**
   * Client identity used when registering with the MCP server.
   */
  client?: {
    name?: string;
    version?: string;
    /**
     * Capabilities object forwarded directly to the MCP client.
     */
    capabilities?: Record<string, unknown>;
  };
  /**
   * Optional prefix used when exposing server tools inside the realtime provider.
   * Defaults to `${id}__`.
   */
  toolNamePrefix?: string | null;
  /**
   * Extra metadata for application-specific use.
   */
  metadata?: Record<string, string>;
}

/**
 * Tool definition for function calling
 */
export interface RealtimeTool {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      required?: boolean;
      enum?: string[];
      description?: string;
    };
  };
  execute: (args: any) => Promise<{
    success: boolean;
    message: string;
  }>;
}

/**
 * Realtime provider configuration
 */
export interface RealtimeConfig {
  apiKey: string;
  model?: 'gpt-4o-realtime-preview' | 'gpt-4o-mini-realtime-preview';
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'coral' | 'sage';
  instructions?: string;
  temperature?: number;
  tools?: RealtimeTool[];
  mcpServers?: MCPServerConfig[];
  turnServers?: RTCIceServer[];
  speed?: number;
  enableLipSync?: boolean;
  language?: string;
}

/**
 * Events from realtime provider
 */
export interface RealtimeEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (message: RealtimeMessage) => void;
  onConversationUpdate?: (conversation: Conversation[]) => void;
  onChatStatusChange?: (status: ChatStatus) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onVolumeChange?: (volume: number) => void;
  onMouthStateChange?: (state: MouthState) => void;
  onPhonemeDetected?: (phoneme: PhonemeData) => void;
  onToolCall?: (toolName: string, args: any, result: any) => void;
}

/**
 * Main realtime provider interface
 */
export interface RealtimeProvider extends RealtimeEvents {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Messaging
  sendMessage(text: string): Promise<void>;
  interrupt(): void;

  // Function registration
  registerFunction(tool: RealtimeTool): void;

  // State
  isConnected: boolean;
  chatStatus: ChatStatus;
  conversation: Conversation[];
  currentVolume: number;
  onAudioData?: (analyser: AnalyserNode, audioContext: AudioContext) => void;

  // Audio analysis
  getAudioAnalyser(): { analyser: AnalyserNode; audioContext: AudioContext } | null;

  // Microphone control
  toggleMicrophone(): boolean;
  enableMicrophone(): void;
  disableMicrophone(): void;
  isMicrophoneEnabled(): boolean;
}
