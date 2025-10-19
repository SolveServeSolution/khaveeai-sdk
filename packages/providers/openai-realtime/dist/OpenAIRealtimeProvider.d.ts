/**
 * OpenAI Realtime API Provider for Khavee AI SDK
 * Based on your WebRTC implementation
 */
import { RealtimeProvider, RealtimeConfig, RealtimeTool, Conversation, ChatStatus, MouthState, PhonemeData } from '@khaveeai/core';
export declare class OpenAIRealtimeProvider implements RealtimeProvider {
    private config;
    private peerConnection;
    private dataChannel;
    private audioContext;
    private audioStream;
    private audioAnalyzer;
    private toolExecutor;
    isConnected: boolean;
    chatStatus: ChatStatus;
    conversation: Conversation[];
    currentVolume: number;
    private volumeInterval;
    private ephemeralUserMessageId;
    private micEnabled;
    private hasHeardFirstGreeting;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
    onMessage?: (message: any) => void;
    onConversationUpdate?: (conversation: Conversation[]) => void;
    onChatStatusChange?: (status: ChatStatus) => void;
    onAudioStart?: () => void;
    onAudioEnd?: () => void;
    onVolumeChange?: (volume: number) => void;
    onMouthStateChange?: (state: MouthState) => void;
    onPhonemeDetected?: (phoneme: PhonemeData) => void;
    onToolCall?: (toolName: string, args: any, result: any) => void;
    constructor(config: RealtimeConfig);
    /**
     * Start the realtime session
     */
    connect(): Promise<void>;
    /**
     * Stop the session and cleanup
     */
    disconnect(): Promise<void>;
    /**
     * Send a text message
     */
    sendMessage(text: string): Promise<void>;
    /**
     * Interrupt current speech
     */
    interrupt(): void;
    /**
     * Register a function/tool
     */
    registerFunction(tool: RealtimeTool): void;
    /**
     * Configure the OpenAI session
     */
    private configureSession;
    /**
     * Handle incoming data channel messages
     */
    private handleDataChannelMessage;
    /**
     * Handle assistant transcript streaming
     */
    private handleAssistantTranscript;
    /**
     * Finalize the last assistant message
     */
    private finalizeLastAssistantMessage;
    /**
     * Handle tool/function calls
     */
    private handleToolCall;
    /**
     * Set chat status and notify listeners
     */
    private setChatStatus;
    /**
     * Setup audio playback for assistant speech
     */
    private setupAudioPlayback;
    /**
     * Setup audio visualization for user microphone
     */
    private setupAudioVisualization;
    /**
     * Enable microphone after first greeting
     */
    private enableMic;
    /**
     * Ephemeral user message management
     */
    private getOrCreateEphemeralUserId;
    private updateEphemeralUserMessage;
    private clearEphemeralUserMessage;
}
