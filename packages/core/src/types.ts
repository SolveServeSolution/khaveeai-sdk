// Core types and interfaces

export interface LLMProvider {
  streamChat(params: { messages: { role: string; content: string }[] }): AsyncIterable<{ type: string; delta: string }>;
}

export interface TTSProvider {
  speak(params: { text: string; voice?: string }): Promise<void>;
}

export interface KhaveeConfig {
  llm: LLMProvider;
  tts: TTSProvider;
  tools: any[];
}