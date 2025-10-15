"use client";
import { useContext, useState, useCallback } from 'react';
import { useKhavee } from './KhaveeProvider';

/**
 * useLLM - Access the configured Large Language Model provider
 * 
 * Provides access to the LLM for streaming chat completions. Requires KhaveeProvider
 * to be configured with an LLM provider.
 * 
 * @returns Object containing:
 *   - streamChat: Function to stream chat completions
 * 
 * @throws Error if LLM provider is not configured in KhaveeProvider
 * 
 * @example
 * ```tsx
 * import { useLLM } from '@khaveeai/react';
 * 
 * function ChatInterface() {
 *   const { streamChat } = useLLM();
 *   const [response, setResponse] = useState('');
 *   
 *   const handleChat = async () => {
 *     const messages = [
 *       { role: 'user', content: 'Hello!' }
 *     ];
 *     
 *     for await (const chunk of streamChat({ messages })) {
 *       if (chunk.type === 'text') {
 *         setResponse(prev => prev + chunk.delta);
 *       }
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleChat}>Chat</button>
 *       <p>{response}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // With conversation history
 * ```tsx
 * const { streamChat } = useLLM();
 * 
 * const messages = [
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: 'What is React?' },
 *   { role: 'assistant', content: 'React is a JavaScript library...' },
 *   { role: 'user', content: 'Tell me more about hooks.' },
 * ];
 * 
 * for await (const chunk of streamChat({ messages })) {
 *   console.log(chunk.delta);
 * }
 * ```
 */
export function useLLM() {
  const { config } = useKhavee();

  /**
   * streamChat - Stream chat completions from the LLM
   * 
   * @param messages - Array of chat messages with role and content
   * @returns AsyncIterable of chunks with type and delta
   */
  const streamChat = useCallback(async function* ({ messages }: { messages: { role: string; content: string }[] }) {
    if (!config?.llm) {
      throw new Error('LLM provider not configured');
    }

    yield* config.llm.streamChat({ messages });
  }, [config]);

  return {
    streamChat,
  };
}

/**
 * useVoice - Access text-to-speech functionality
 * 
 * Provides functions to convert text to speech using the configured TTS provider.
 * Includes a speaking state to track when audio is playing. Requires KhaveeProvider
 * to be configured with a TTS provider.
 * 
 * @returns Object containing:
 *   - speak: Function to convert text to speech
 *   - speaking: Boolean indicating if currently speaking
 * 
 * @throws Error if TTS provider is not configured in KhaveeProvider
 * 
 * @example
 * ```tsx
 * import { useVoice } from '@khaveeai/react';
 * 
 * function VoiceControls() {
 *   const { speak, speaking } = useVoice();
 *   
 *   const sayHello = async () => {
 *     await speak({ text: 'Hello, world!' });
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={sayHello} disabled={speaking}>
 *         {speaking ? 'Speaking...' : 'Say Hello'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // With voice selection
 * ```tsx
 * function VoiceSelector() {
 *   const { speak, speaking } = useVoice();
 *   const [voice, setVoice] = useState('default');
 *   
 *   const handleSpeak = async (text: string) => {
 *     await speak({ text, voice });
 *   };
 *   
 *   return (
 *     <div>
 *       <select onChange={(e) => setVoice(e.target.value)}>
 *         <option value="default">Default</option>
 *         <option value="female">Female</option>
 *         <option value="male">Male</option>
 *       </select>
 *       <button 
 *         onClick={() => handleSpeak('Test message')}
 *         disabled={speaking}
 *       >
 *         Speak
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * // Combined with VRM expressions
 * ```tsx
 * function TalkingAvatar() {
 *   const { speak, speaking } = useVoice();
 *   const { setExpression } = useVRMExpressions();
 *   
 *   const talkWithExpression = async (text: string) => {
 *     setExpression('happy', 1);
 *     await speak({ text });
 *     setExpression('happy', 0);
 *   };
 *   
 *   return (
 *     <button 
 *       onClick={() => talkWithExpression('I am happy!')}
 *       disabled={speaking}
 *     >
 *       Talk
 *     </button>
 *   );
 * }
 * ```
 */
export function useVoice() {
  const { config } = useKhavee();
  const [speaking, setSpeaking] = useState(false);

  /**
   * speak - Convert text to speech
   * 
   * @param text - The text to speak
   * @param voice - Optional voice identifier
   * @returns Promise that resolves when speech is complete
   */
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
  }, [config]);

  return {
    speak,
    speaking,
  };
}