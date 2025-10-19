/**
 * Real-time conversation message
 */
export interface RealtimeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isFinal: boolean;
  status?: 'speaking' | 'processing' | 'final';
  audioUrl?: string;
}

/**
 * Chat status types
 */
export type ChatStatus = 
  | 'ready'       // Ready to chat
  | 'speaking'    // AI is speaking  
  | 'listening'   // Listening to user
  | 'thinking'    // Processing/thinking
  | 'stopped'     // Session stopped
  | 'starting';   // Starting session

/**
 * Conversation state for real-time chat
 */
export interface Conversation {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isFinal: boolean;
  status?: 'speaking' | 'processing' | 'final';
}