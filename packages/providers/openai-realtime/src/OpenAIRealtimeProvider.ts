/**
 * OpenAI Realtime API Provider for Khavee AI SDK
 * Based on your WebRTC implementation
 */

import { 
  RealtimeProvider, 
  RealtimeConfig, 
  RealtimeTool,
  Conversation, 
  ChatStatus, 
  MouthState,
  PhonemeData 
} from '@khaveeai/core';
import { v4 as uuidv4 } from 'uuid';
import { AudioAnalyzer } from './AudioAnalyzer';
import { ToolExecutor } from './ToolExecutor';

export class OpenAIRealtimeProvider implements RealtimeProvider {
  private config: RealtimeConfig;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioContext: AudioContext | null = null;
  private audioStream: MediaStream | null = null;
  private audioAnalyzer: AudioAnalyzer;
  private toolExecutor: ToolExecutor;
  
  // State
  public isConnected = false;
  public chatStatus: ChatStatus = 'stopped';
  public conversation: Conversation[] = [];
  public currentVolume = 0;
  
  // Audio refs
  private volumeInterval: number | null = null;
  private ephemeralUserMessageId: string | null = null;
  private micEnabled = false;
  private hasHeardFirstGreeting = false;
  
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
  public onMouthStateChange?: (state: MouthState) => void;
  public onPhonemeDetected?: (phoneme: PhonemeData) => void;
  public onToolCall?: (toolName: string, args: any, result: any) => void;

  constructor(config: RealtimeConfig) {
    this.config = {
      model: 'gpt-4o-realtime-preview',
      voice: 'shimmer',
      temperature: 0.8,
      speed: 1.4,
      enableLipSync: true,
      language: 'en',
      ...config
    };
    
    this.audioAnalyzer = new AudioAnalyzer({
      enablePhonemeDetection: this.config.enableLipSync,
      onVolumeChange: (volume) => {
        this.currentVolume = volume;
        this.onVolumeChange?.(volume);
      },
      onMouthStateChange: (state) => {
        this.onMouthStateChange?.(state);
      },
      onPhonemeDetected: (phoneme) => {
        this.onPhonemeDetected?.(phoneme);
      }
    });
    
    this.toolExecutor = new ToolExecutor();
    
    // Register initial tools
    if (this.config.tools) {
      this.config.tools.forEach(tool => this.registerFunction(tool));
    }
  }

  /**
   * Start the realtime session
   */
  async connect(): Promise<void> {
    try {
      this.setChatStatus('starting');
      this.hasHeardFirstGreeting = false;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioStream = stream;
      this.setupAudioVisualization(stream);

      // Mute mic initially (will be enabled after first greeting)
      stream.getAudioTracks().forEach(track => track.enabled = false);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: this.config.turnServers || [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      this.peerConnection = pc;

      // Setup audio playback for assistant speech
      this.setupAudioPlayback(pc);

      // Create data channel for messages
      const dataChannel = pc.createDataChannel('response');
      this.dataChannel = dataChannel;

      dataChannel.onopen = () => {
        this.configureSession();
      };
      dataChannel.onmessage = (event) => {
        this.handleDataChannelMessage(event);
      };

      // Add microphone track
      pc.addTrack(stream.getTracks()[0]);

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send to OpenAI Realtime API
      const response = await fetch('/api/realtime/negotiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error('Failed to negotiate WebRTC session');
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      this.isConnected = true;
      this.onConnect?.();
      
    } catch (error) {
      this.onError?.(error as Error);
      this.disconnect();
    }
  }

  /**
   * Stop the session and cleanup
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }

    this.ephemeralUserMessageId = null;
    this.currentVolume = 0;
    this.conversation = [];
    this.setChatStatus('stopped');
    this.hasHeardFirstGreeting = false;
    
    this.onDisconnect?.();
  }

  /**
   * Send a text message
   */
  async sendMessage(text: string): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Connection not ready');
    }

    const messageId = uuidv4();
    
    // Add to conversation
    const newMessage: Conversation = {
      id: messageId,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      isFinal: true,
      status: 'final',
    };

    this.conversation.push(newMessage);
    this.onConversationUpdate?.(this.conversation);
    this.setChatStatus('thinking');

    // Send through data channel
    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    };

    const response = { type: 'response.create' };

    this.dataChannel.send(JSON.stringify(message));
    this.dataChannel.send(JSON.stringify(response));
  }

  /**
   * Interrupt current speech
   */
  interrupt(): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify({ type: 'response.cancel' }));
    }
  }

  /**
   * Register a function/tool
   */
  registerFunction(tool: RealtimeTool): void {
    this.toolExecutor.register(tool.name, tool.execute);
  }

  /**
   * Configure the OpenAI session
   */
  private configureSession(): void {
    if (!this.dataChannel) return;

    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        tools: this.config.tools?.map(tool => ({
          type: 'function',
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: tool.parameters,
            required: Object.keys(tool.parameters).filter(key => 
              tool.parameters[key].required
            )
          }
        })) || [],
        input_audio_transcription: {
          model: 'gpt-4o-transcribe',
          language: this.config.language || 'en',
        },
        voice: this.config.voice,
        tool_choice: 'auto',
        instructions: this.config.instructions || 'You are a helpful AI assistant.',
        speed: this.config.speed || 1.4,
        temperature: this.config.temperature || 0.8,
        turn_detection: {
          type: 'semantic_vad',
          eagerness: 'high',
        },
        input_audio_noise_reduction: {
          type: 'near_field',
        },
      },
    };

    this.dataChannel.send(JSON.stringify(sessionUpdate));
    this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
    this.setChatStatus('ready');
  }

  /**
   * Handle incoming data channel messages
   */
  private async handleDataChannelMessage(event: MessageEvent): Promise<void> {
    try {
      const msg = JSON.parse(event.data);
      this.onMessage?.(msg);

      switch (msg.type) {
        case 'input_audio_buffer.speech_started':
          this.getOrCreateEphemeralUserId();
          this.updateEphemeralUserMessage({ status: 'speaking' });
          this.setChatStatus('listening');
          break;

        case 'input_audio_buffer.speech_stopped':
          this.updateEphemeralUserMessage({ status: 'speaking' });
          this.setChatStatus('listening');
          break;

        case 'input_audio_buffer.committed':
          this.updateEphemeralUserMessage({
            text: 'Processing speech...',
            status: 'processing',
          });
          this.setChatStatus('thinking');
          break;

        case 'conversation.item.input_audio_transcription':
          const partialText = msg.transcript ?? msg.text ?? 'User is speaking...';
          this.updateEphemeralUserMessage({
            text: partialText,
            status: 'speaking',
            isFinal: false,
          });
          this.setChatStatus('listening');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          this.updateEphemeralUserMessage({
            text: msg.transcript || '',
            isFinal: true,
            status: 'final',
          });
          this.clearEphemeralUserMessage();
          this.setChatStatus('thinking');
          break;

        case 'response.audio_transcript.delta':
          this.setChatStatus(
            this.hasHeardFirstGreeting ? 'speaking' : 'starting'
          );
          this.handleAssistantTranscript(msg.delta);
          break;

        case 'response.audio_transcript.done':
          this.finalizeLastAssistantMessage();
          this.setChatStatus(
            this.hasHeardFirstGreeting ? 'ready' : 'starting'
          );
          break;

        case 'output_audio_buffer.stopped':
          if (!this.hasHeardFirstGreeting) {
            this.enableMic();
            this.hasHeardFirstGreeting = true;
          }
          this.setChatStatus('ready');
          break;

        case 'response.function_call_arguments.done':
          await this.handleToolCall(msg);
          break;

        default:
          console.warn('Unhandled message type:', msg.type);
          break;
      }
    } catch (error) {
      console.error('Error handling data channel message:', error);
      this.onError?.(error as Error);
    }
  }

  /**
   * Handle assistant transcript streaming
   */
  private handleAssistantTranscript(delta: string): void {
    const newMessage: Conversation = {
      id: uuidv4(),
      role: 'assistant',
      text: delta,
      timestamp: new Date().toISOString(),
      isFinal: false,
    };

    const lastMsg = this.conversation[this.conversation.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.isFinal) {
      // Append to existing message
      lastMsg.text += delta;
    } else {
      // Create new message
      this.conversation.push(newMessage);
    }

    this.onConversationUpdate?.(this.conversation);
  }

  /**
   * Finalize the last assistant message
   */
  private finalizeLastAssistantMessage(): void {
    if (this.conversation.length > 0) {
      const lastMsg = this.conversation[this.conversation.length - 1];
      if (lastMsg.role === 'assistant') {
        lastMsg.isFinal = true;
      }
    }
    this.onConversationUpdate?.(this.conversation);
  }

  /**
   * Handle tool/function calls
   */
  private async handleToolCall(msg: any): Promise<void> {
    this.setChatStatus('thinking');
    
    try {
      const args = JSON.parse(msg.arguments);
      const result = await this.toolExecutor.execute(msg.name, args);
      
      this.onToolCall?.(msg.name, args, result);

      // Send result back to OpenAI
      const response = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: msg.call_id,
          output: JSON.stringify(result),
        },
      };

      this.dataChannel?.send(JSON.stringify(response));
      
      const responseCreate = {
        type: 'response.create',
        response: {
          modalities: ['text', 'audio'],
          instructions: result.message,
        },
      };

      this.dataChannel?.send(JSON.stringify(responseCreate));
      
    } catch (error) {
      console.error('Tool execution error:', error);
      this.onError?.(error as Error);
    }
  }

  /**
   * Set chat status and notify listeners
   */
  private setChatStatus(status: ChatStatus): void {
    if (this.chatStatus !== status) {
      this.chatStatus = status;
      this.onChatStatusChange?.(status);
    }
  }

  /**
   * Setup audio playback for assistant speech
   */
  private setupAudioPlayback(pc: RTCPeerConnection): void {
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;

    pc.ontrack = (event) => {
      audioElement.srcObject = event.streams[0];
      
      // Setup audio analysis for lip sync
      this.audioAnalyzer.setupInboundAudio(event.streams[0], audioElement);

      // Start volume monitoring
      this.volumeInterval = window.setInterval(() => {
        const volume = this.audioAnalyzer.getVolume();
        this.currentVolume = volume;
        this.onVolumeChange?.(volume);
      }, 100);
    };
  }

  /**
   * Setup audio visualization for user microphone
   */
  private setupAudioVisualization(stream: MediaStream): void {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);

    this.audioContext = audioContext;
    
    // Setup microphone analysis
    this.audioAnalyzer.setupOutboundAudio(analyzer);
  }

  /**
   * Enable microphone after first greeting
   */
  private enableMic(): void {
    if (this.audioStream && !this.micEnabled) {
      this.audioStream.getAudioTracks().forEach(track => track.enabled = true);
      this.micEnabled = true;
      console.log('Microphone enabled');
    }
  }

  /**
   * Ephemeral user message management
   */
  private getOrCreateEphemeralUserId(): string {
    let ephemeralId = this.ephemeralUserMessageId;
    if (!ephemeralId) {
      ephemeralId = uuidv4();
      this.ephemeralUserMessageId = ephemeralId;

      const newMessage: Conversation = {
        id: ephemeralId,
        role: 'user',
        text: '',
        timestamp: new Date().toISOString(),
        isFinal: false,
        status: 'speaking',
      };

      this.conversation.push(newMessage);
      this.onConversationUpdate?.(this.conversation);
    }
    return ephemeralId;
  }

  private updateEphemeralUserMessage(partial: Partial<Conversation>): void {
    const ephemeralId = this.ephemeralUserMessageId;
    if (!ephemeralId) return;

    this.conversation = this.conversation.map(msg => {
      if (msg.id === ephemeralId) {
        return { ...msg, ...partial };
      }
      return msg;
    });

    this.onConversationUpdate?.(this.conversation);
  }

  private clearEphemeralUserMessage(): void {
    this.ephemeralUserMessageId = null;
  }
}
