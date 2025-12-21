/**
 * Amazon Nova Speech-to-Speech Provider for Khavee AI SDK
 * Real-time voice interaction powered by Amazon Nova Sonic
 */

import {
  RealtimeProvider,
  RealtimeConfig,
  RealtimeTool,
  Conversation,
  ChatStatus,
} from '@khaveeai/core';
import { v4 as uuidv4 } from 'uuid';
import { NovaEventBuilder, NovaAudioConfig, NovaChatHistory } from './NovaEventBuilder';
import { NovaAudioPlayer } from './NovaAudioPlayer';
import { NovaToolExecutor } from './NovaToolExecutor';
import { base64ToFloat32Array, float32ArrayToBase64, resampleAudio } from './audioHelpers';

export interface NovaVoice {
  id: 'matthew' | 'joanna' | 'ruth' | 'gregory' | 'kendra' | 'stephen' | 'tiffany';
  name: string;
  language: string;
  gender: 'male' | 'female';
}

export const NOVA_VOICES: NovaVoice[] = [
  { id: 'matthew', name: 'Matthew', language: 'en-US', gender: 'male' },
  { id: 'joanna', name: 'Joanna', language: 'en-US', gender: 'female' },
  { id: 'ruth', name: 'Ruth', language: 'en-US', gender: 'female' },
  { id: 'gregory', name: 'Gregory', language: 'en-US', gender: 'male' },
  { id: 'kendra', name: 'Kendra', language: 'en-US', gender: 'female' },
  { id: 'stephen', name: 'Stephen', language: 'en-US', gender: 'male' },
  { id: 'tiffany', name: 'Tiffany', language: 'en-US', gender: 'female' },
];

export interface NovaConfig {
  // Connection mode: 'websocket' (requires server) or 'direct' (uses AWS SDK)
  mode?: 'websocket' | 'direct';
  
  // For 'websocket' mode: WebSocket server URL
  websocketUrl?: string;
  
  // For 'direct' mode: AWS credentials
  aws?: {
    region: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    };
    // Or use credential provider (for Node.js)
    credentialProvider?: () => Promise<{
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    }>;
  };
  
  // Common settings
  voice?: NovaVoice['id'];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  turnSensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
  audioInput?: {
    sampleRate?: number;
    sampleSize?: number;
    channels?: number;
  };
  audioOutput?: {
    sampleRate?: number;
    sampleSize?: number;
    channels?: number;
  };
  enableChatHistory?: boolean;
  initialChatHistory?: NovaChatHistory[];
  tools?: RealtimeTool[];
}

export class NovaProvider implements RealtimeProvider {
  private config: NovaConfig;
  private socket: WebSocket | null = null;
  private audioPlayer: NovaAudioPlayer;
  private toolExecutor: NovaToolExecutor;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;

  // Session IDs
  private promptName: string | null = null;
  private textContentName: string | null = null;
  private audioContentName: string | null = null;

  // State
  public isConnected = false;
  public chatStatus: ChatStatus = 'stopped';
  public conversation: Conversation[] = [];
  public currentVolume = 0;

  // Internal state
  private chatMessages: Map<string, any> = new Map();
  private micEnabled = false;

  // Event handlers
  public onConnect?: () => void;
  public onDisconnect?: () => void;
  public onError?: (error: Error) => void;
  public onMessage?: (message: any) => void;
  public onConversationUpdate?: (conversation: Conversation[]) => void;
  public onChatStatusChange?: (status: ChatStatus) => void;
  public onAudioStart?: () => void;
  public onAudioEnd?: () => void;
  public onVolumeChange?: (volume: number) => void;
  public onToolCall?: (toolName: string, args: any, result: any) => void;
  public onAudioData?: (analyser: AnalyserNode, audioContext: AudioContext) => void;

  constructor(config: NovaConfig) {
    // Validate configuration
    if (!config.mode) {
      config.mode = config.websocketUrl ? 'websocket' : 'direct';
    }
    
    if (config.mode === 'websocket' && !config.websocketUrl) {
      throw new Error('websocketUrl is required when mode is "websocket"');
    }
    
    if (config.mode === 'direct' && !config.aws) {
      throw new Error('aws configuration is required when mode is "direct"');
    }
    
    this.config = {
      mode: 'websocket',
      voice: 'matthew',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.95,
      turnSensitivity: 'MEDIUM',
      enableChatHistory: false,
      ...config,
    };

    this.audioPlayer = new NovaAudioPlayer();
    this.toolExecutor = new NovaToolExecutor();

    // Register initial tools
    if (this.config.tools) {
      this.config.tools.forEach((tool) => this.registerFunction(tool));
    }
  }

  /**
   * Connect to the Nova WebSocket server and start the session
   */
  async connect(): Promise<void> {
    try {
      this.setChatStatus('starting');

      // Initialize audio player
      await this.audioPlayer.start();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioStream = stream;

      // Create WebSocket connection
      await this.connectWebSocket();

      // Start microphone
      this.startMicrophone();

      this.isConnected = true;
      this.setChatStatus('ready');
      
      if (this.onConnect) {
        this.onConnect();
      }
    } catch (error) {
      this.setChatStatus('stopped');
      const err = error instanceof Error ? error : new Error('Failed to connect');
      if (this.onError) {
        this.onError(err);
      }
      throw err;
    }
  }

  /**
   * Disconnect from the Nova server
   */
  async disconnect(): Promise<void> {
    try {
      this.setChatStatus('stopped');

      // Stop microphone
      this.stopMicrophone();

      // Send session end
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.sendEvent(NovaEventBuilder.sessionEnd());
      }

      // Close WebSocket
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      // Stop audio player
      this.audioPlayer.stop();

      this.isConnected = false;
      this.setChatStatus('stopped');

      if (this.onDisconnect) {
        this.onDisconnect();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to disconnect');
      if (this.onError) {
        this.onError(err);
      }
      throw err;
    }
  }

  /**
   * Send a text message
   */
  async sendMessage(text: string): Promise<void> {
    if (!this.isConnected || !this.promptName) {
      throw new Error('Not connected. Call connect() first.');
    }

    const contentName = uuidv4();
    
    this.sendEvent(
      NovaEventBuilder.contentStartText(this.promptName, contentName, 'USER', false)
    );
    this.sendEvent(NovaEventBuilder.textInput(this.promptName, contentName, text, 'USER'));
    this.sendEvent(NovaEventBuilder.contentEnd(this.promptName, contentName));
  }

  /**
   * Interrupt the current AI response
   */
  interrupt(): void {
    this.audioPlayer.bargeIn();
  }

  /**
   * Register a function/tool
   */
  registerFunction(tool: RealtimeTool): void {
    this.toolExecutor.registerTool(tool);
  }

  /**
   * Toggle microphone on/off
   */
  toggleMicrophone(): boolean {
    if (this.micEnabled) {
      this.disableMicrophone();
    } else {
      this.enableMicrophone();
    }
    return this.micEnabled;
  }

  /**
   * Enable microphone
   */
  enableMicrophone(): void {
    if (this.audioStream) {
      this.audioStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      this.micEnabled = true;
    }
  }

  /**
   * Disable microphone
   */
  disableMicrophone(): void {
    if (this.audioStream) {
      this.audioStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      this.micEnabled = false;
    }
  }

  /**
   * Check if microphone is enabled
   */
  isMicrophoneEnabled(): boolean {
    return this.micEnabled;
  }

  /**
   * Get audio analyser for visualizations
   */
  getAudioAnalyser(): { analyser: AnalyserNode; audioContext: AudioContext } | null {
    return this.audioPlayer.getAnalyser();
  }

  /**
   * Connect to WebSocket and initialize session
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.promptName = uuidv4();
      this.textContentName = uuidv4();
      this.audioContentName = uuidv4();

      if (this.config.mode === 'direct') {
        // Direct AWS SDK mode - not using WebSocket
        reject(new Error('Direct AWS mode not yet implemented. Use websocket mode for now.'));
        return;
      }

      if (!this.config.websocketUrl) {
        reject(new Error('websocketUrl is required for websocket mode'));
        return;
      }

      this.socket = new WebSocket(this.config.websocketUrl);

      this.socket.onopen = () => {
        console.log('Nova WebSocket connected');

        // Start session
        this.sendEvent(
          NovaEventBuilder.sessionStart(
            {
              maxTokens: this.config.maxTokens,
              topP: this.config.topP,
              temperature: this.config.temperature,
            },
            this.config.turnSensitivity
          )
        );

        // Configure audio output
        const audioConfig: NovaAudioConfig = {
          ...NovaEventBuilder.DEFAULT_AUDIO_OUTPUT_CONFIG,
          voiceId: this.config.voice || 'matthew',
          sampleRateHertz: this.config.audioOutput?.sampleRate || 24000,
          sampleSizeBits: this.config.audioOutput?.sampleSize || 16,
          channelCount: this.config.audioOutput?.channels || 1,
        };

        const toolConfig = this.toolExecutor.getNovaToolConfig();

        this.sendEvent(
          NovaEventBuilder.promptStart(this.promptName!, audioConfig, toolConfig)
        );

        // Send system prompt
        this.sendEvent(
          NovaEventBuilder.contentStartText(this.promptName!, this.textContentName!)
        );
        this.sendEvent(
          NovaEventBuilder.textInput(
            this.promptName!,
            this.textContentName!,
            this.config.systemPrompt || 'You are a helpful assistant.'
          )
        );
        this.sendEvent(
          NovaEventBuilder.contentEnd(this.promptName!, this.textContentName!)
        );

        // Send chat history if enabled
        if (this.config.enableChatHistory && this.config.initialChatHistory) {
          for (const chat of this.config.initialChatHistory) {
            const chatContentName = uuidv4();
            this.sendEvent(
              NovaEventBuilder.contentStartText(
                this.promptName!,
                chatContentName,
                chat.role,
                false
              )
            );
            this.sendEvent(
              NovaEventBuilder.textInput(
                this.promptName!,
                chatContentName,
                chat.content,
                chat.role
              )
            );
            this.sendEvent(
              NovaEventBuilder.contentEnd(this.promptName!, chatContentName)
            );
          }
        }

        // Start audio content
        this.sendEvent(
          NovaEventBuilder.contentStartAudio(this.promptName!, this.audioContentName!)
        );

        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        const err = new Error('WebSocket connection error');
        if (this.onError) {
          this.onError(err);
        }
        reject(err);
      };

      this.socket.onclose = () => {
        console.log('WebSocket closed');
        this.isConnected = false;
        if (this.onDisconnect) {
          this.onDisconnect();
        }
      };
    });
  }

  /**
   * Start microphone recording
   */
  private startMicrophone(): void {
    if (!this.audioStream) return;

    const inputSampleRate = this.config.audioInput?.sampleRate || 16000;

    this.mediaRecorder = new MediaRecorder(this.audioStream, {
      mimeType: 'audio/webm',
    });

    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && this.socket?.readyState === WebSocket.OPEN) {
        try {
          const arrayBuffer = await event.data.arrayBuffer();
          const audioContext = new AudioContext({ sampleRate: 48000 });
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const channelData = audioBuffer.getChannelData(0);
          let samples: Float32Array;
          
          // Resample if needed
          if (audioBuffer.sampleRate !== inputSampleRate) {
            samples = resampleAudio(channelData, audioBuffer.sampleRate, inputSampleRate);
          } else {
            samples = new Float32Array(channelData);
          }

          const base64Audio = float32ArrayToBase64(samples);
          
          this.sendEvent(
            NovaEventBuilder.audioInput(
              this.promptName!,
              this.audioContentName!,
              base64Audio
            )
          );
        } catch (error) {
          console.error('Error processing audio:', error);
        }
      }
    };

    this.mediaRecorder.start(100); // Send chunks every 100ms
    this.micEnabled = true;
  }

  /**
   * Stop microphone recording
   */
  private stopMicrophone(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    this.micEnabled = false;
  }

  /**
   * Send an event to the WebSocket
   */
  private sendEvent(event: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleIncomingMessage(message: any): Promise<void> {
    const eventType = Object.keys(message?.event || {})[0];
    if (!eventType) return;

    const eventData = message.event[eventType];
    const role = eventData.role;
    const content = eventData.content;
    const contentId = eventData.contentId;
    const contentType = eventData.type;
    const stopReason = eventData.stopReason;

    if (this.onMessage) {
      this.onMessage(message);
    }

    switch (eventType) {
      case 'textOutput':
        this.handleTextOutput(contentId, content, role, message);
        break;

      case 'audioOutput':
        this.handleAudioOutput(content);
        break;

      case 'contentStart':
        this.handleContentStart(contentId, contentType, role, eventData);
        break;

      case 'contentEnd':
        this.handleContentEnd(contentId, contentType, stopReason);
        break;

      case 'toolUse':
        await this.handleToolUse(eventData);
        break;

      default:
        break;
    }

    // Trigger audio data callback for visualizations
    const analyserData = this.audioPlayer.getAnalyser();
    if (analyserData && this.onAudioData) {
      this.onAudioData(analyserData.analyser, analyserData.audioContext);
    }
  }

  /**
   * Handle text output events
   */
  private handleTextOutput(
    contentId: string,
    content: string,
    role: string,
    message: any
  ): void {
    // Check for interruption signal
    if (role === 'ASSISTANT' && content.startsWith('{')) {
      try {
        const evt = JSON.parse(content);
        if (evt.interrupted === true) {
          this.interrupt();
        }
      } catch (e) {
        // Not JSON, continue
      }
    }

    // Update or create message
    const existingMsg = this.chatMessages.get(contentId);
    if (existingMsg) {
      existingMsg.content = content;
      existingMsg.role = role;
    }

    this.updateConversation();
  }

  /**
   * Handle audio output events
   */
  private handleAudioOutput(base64Audio: string): void {
    try {
      const audioData = base64ToFloat32Array(base64Audio);
      this.audioPlayer.playAudio(audioData);
      
      if (this.onAudioStart) {
        this.onAudioStart();
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }

  /**
   * Handle content start events
   */
  private handleContentStart(
    contentId: string,
    contentType: string,
    role: string,
    eventData: any
  ): void {
    if (contentType === 'TEXT') {
      this.chatMessages.set(contentId, {
        id: contentId,
        role: role?.toLowerCase() || 'assistant',
        content: '',
        timestamp: Date.now(),
      });
      this.updateConversation();
    }
  }

  /**
   * Handle content end events
   */
  private handleContentEnd(
    contentId: string,
    contentType: string,
    stopReason: string
  ): void {
    if (contentType === 'TEXT') {
      const msg = this.chatMessages.get(contentId);
      if (msg) {
        msg.stopReason = stopReason;
      }
      this.updateConversation();

      if (this.onAudioEnd) {
        this.onAudioEnd();
      }
    }
  }

  /**
   * Handle tool use events
   */
  private async handleToolUse(eventData: any): Promise<void> {
    const toolUseId = eventData.toolUseId;
    const toolName = eventData.name;
    const toolInput = eventData.input ? JSON.parse(eventData.input) : {};

    // Execute the tool
    const result = await this.toolExecutor.executeTool(toolName, toolInput);

    if (this.onToolCall) {
      this.onToolCall(toolName, toolInput, result);
    }

    // Send tool result back
    const toolContentName = uuidv4();
    this.sendEvent(
      NovaEventBuilder.contentStartTool(this.promptName!, toolContentName, toolUseId)
    );
    this.sendEvent(
      NovaEventBuilder.textInputTool(
        this.promptName!,
        toolContentName,
        JSON.stringify(result)
      )
    );
    this.sendEvent(NovaEventBuilder.contentEnd(this.promptName!, toolContentName));
  }

  /**
   * Update conversation from chat messages
   */
  private updateConversation(): void {
    this.conversation = Array.from(this.chatMessages.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        text: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
        isFinal: !!msg.stopReason,
        status: msg.stopReason ? ('final' as any) : ('processing' as any),
      }));

    if (this.onConversationUpdate) {
      this.onConversationUpdate(this.conversation);
    }
  }

  /**
   * Set chat status and trigger callback
   */
  private setChatStatus(status: ChatStatus): void {
    this.chatStatus = status;
    if (this.onChatStatusChange) {
      this.onChatStatusChange(status);
    }
  }
}
