"use client";
import type {
    ChatStatus,
    Conversation,
    RealtimeTool,
    PhonemeData,
    MouthState
} from "@khaveeai/core";
import { useCallback, useEffect, useState } from "react";
import { useKhavee } from "../KhaveeProvider";
import { useVRMExpressions } from "../VRMAvatar";

/**
 * Hook for real-time chat with OpenAI Realtime API
 * Based on your WebRTC implementation
 */
export function useRealtime() {
  const { realtimeProvider } = useKhavee();
  const { setMultipleExpressions } = useVRMExpressions();

  // State from provider
  const [isConnected, setIsConnected] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatus>("stopped");
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  
  // Lip sync state
  const [currentPhoneme, setCurrentPhoneme] = useState<PhonemeData | null>(null);
  const [lipSyncAnalyzer, setLipSyncAnalyzer] = useState<RealtimeAudioAnalyzer | null>(null);

  if (!realtimeProvider) {
    throw new Error(
      "useRealtime must be used within KhaveeProvider with realtime config"
    );
  }

  // Setup event listeners and automatic lip sync
  useEffect(() => {
    const provider = realtimeProvider;

    provider.onConnect = () => setIsConnected(true);
    provider.onDisconnect = () => {
      setIsConnected(false);
      // Stop lip sync when disconnected
      if (lipSyncAnalyzer) {
        lipSyncAnalyzer.stop();
        setLipSyncAnalyzer(null);
      }
      setCurrentPhoneme(null);
      setMultipleExpressions({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });
    };
    
    provider.onConversationUpdate = (conv) => setConversation(conv);
    
    provider.onChatStatusChange = (status) => {
      setChatStatus(status);
      setIsThinking(status === "thinking");
      
      console.log("Chat status changed to:", status); // Debug log
      
      // Auto-start lip sync when AI starts speaking
      if (status === "speaking") {
        if (!lipSyncAnalyzer) {
          console.log("Starting auto lip sync..."); // Debug log
          startAutoLipSync();
        }
      }
      // Don't auto-stop - let it continue analyzing
      // Only stop when explicitly disconnected or error occurs
    };
    
    provider.onVolumeChange = (volume) => setCurrentVolume(volume);

    // Handle audio data availability for lip sync
    provider.onAudioData = (analyser: AnalyserNode, audioContext: AudioContext) => {
      console.log("Received audio data for lip sync"); // Debug log
      if (lipSyncAnalyzer) {
        lipSyncAnalyzer.updateAudioSource(analyser, audioContext);
      }
    };

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
      provider.onAudioData = undefined;
      
      // Stop lip sync
      if (lipSyncAnalyzer) {
        lipSyncAnalyzer.stop();
      }
    };
  }, [realtimeProvider]); // Remove lipSyncAnalyzer from dependencies to prevent recreation

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

  // Auto lip sync functions
  const startAutoLipSync = useCallback(async () => {
    if (!realtimeProvider) return;
    
    // If analyzer already exists, don't create new one
    if (lipSyncAnalyzer) {
      console.log("Lip sync analyzer already running");
      return;
    }

    try {
      console.log("Creating new lip sync analyzer...");
      const analyzer = new RealtimeAudioAnalyzer({
        sensitivity: 0.2,
        intensityMultiplier: 6.0,
        minIntensity: 0.1,
        realtimeProvider: realtimeProvider,
        onPhonemeDetected: (phoneme: PhonemeData) => {
          setCurrentPhoneme(phoneme);

          // Convert phoneme to mouth state and apply to VRM
          const newMouthState = phonemeToMouthState(phoneme, 6.0);
          const expressionUpdate = {
            aa: newMouthState.aa,
            ih: newMouthState.ih,
            ou: newMouthState.ou,
            ee: newMouthState.ee,
            oh: newMouthState.oh,
          };
          setMultipleExpressions(expressionUpdate);
        },
      });

      setLipSyncAnalyzer(analyzer);
      await analyzer.start();
      console.log("Lip sync analyzer started successfully");
    } catch (error) {
      console.error("Auto lip sync failed:", error);
    }
  }, [realtimeProvider, setMultipleExpressions]);

  const stopAutoLipSync = useCallback(() => {
    console.log("Stopping auto lip sync...");
    if (lipSyncAnalyzer) {
      lipSyncAnalyzer.stop();
      setLipSyncAnalyzer(null);
    }
    setCurrentPhoneme(null);
    setMultipleExpressions({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });
  }, [lipSyncAnalyzer, setMultipleExpressions]);

  return {
    // State
    isConnected,
    chatStatus,
    conversation,
    currentVolume,
    isThinking,
    currentPhoneme, // Add lip sync state

    // Actions
    connect,
    disconnect,
    sendMessage,
    interrupt,
    registerFunction,
    
    // Lip sync controls for debugging
    startAutoLipSync,
    stopAutoLipSync,
  };
}

// MFCC-based phoneme templates for realtime lip sync
const phonemeTemplates: Record<string, number[][]> = {
  aa: [
    [13.2, 11.5, 9.3, 7.1, 5.8, 4.2, 2.9, 1.5, 0.7, -0.3, -1.0, -1.7, -2.5],
    [12.8, 10.9, 8.8, 6.9, 5.5, 4.0, 2.7, 1.3, 0.5, -0.5, -1.2, -1.9, -2.7],
    [13.6, 11.8, 9.6, 7.3, 6.0, 4.4, 3.1, 1.7, 0.9, -0.1, -0.8, -1.5, -2.3],
    [12.4, 10.7, 8.5, 6.5, 5.2, 3.8, 2.5, 1.1, 0.3, -0.7, -1.4, -2.1, -2.9]
  ],
  ee: [
    [14.1, 12.0, 10.0, 8.1, 6.3, 4.5, 3.2, 2.0, 0.9, -0.1, -1.2, -2.0, -3.0],
    [13.7, 11.6, 9.6, 7.8, 6.0, 4.2, 2.9, 1.7, 0.6, -0.4, -1.5, -2.3, -3.3],
    [14.5, 12.4, 10.4, 8.4, 6.6, 4.8, 3.5, 2.3, 1.2, 0.2, -0.9, -1.7, -2.7],
    [13.3, 11.2, 9.2, 7.4, 5.7, 3.9, 2.6, 1.4, 0.3, -0.6, -1.8, -2.6, -3.6]
  ],
  ou: [
    [10.2, 8.1, 6.3, 4.5, 3.1, 1.8, 0.5, -0.3, -1.0, -1.6, -2.2, -2.9, -3.5],
    [9.8, 7.7, 5.9, 4.1, 2.7, 1.4, 0.1, -0.7, -1.4, -2.0, -2.6, -3.3, -3.9],
    [10.6, 8.5, 6.7, 4.9, 3.5, 2.2, 0.9, 0.1, -0.6, -1.2, -1.8, -2.5, -3.1],
    [9.4, 7.3, 5.5, 3.7, 2.3, 1.0, -0.3, -1.1, -1.8, -2.4, -3.0, -3.7, -4.3]
  ],
  ih: [
    [12.8, 10.7, 8.5, 6.0, 4.3, 2.2, 1.0, 0.2, -0.5, -1.2, -1.9, -2.1, -2.8],
    [12.4, 10.3, 8.1, 5.6, 3.9, 1.8, 0.6, -0.2, -0.9, -1.6, -2.3, -2.5, -3.2],
    [13.2, 11.1, 8.9, 6.4, 4.7, 2.6, 1.4, 0.6, -0.1, -0.8, -1.5, -1.7, -2.4],
    [12.0, 9.9, 7.7, 5.2, 3.5, 1.4, 0.2, -0.6, -1.3, -2.0, -2.7, -2.9, -3.6]
  ],
  oh: [
    [11.0, 9.2, 7.1, 5.3, 3.9, 2.5, 1.2, 0.3, -0.6, -1.4, -2.0, -2.6, -3.3],
    [10.6, 8.8, 6.7, 4.9, 3.5, 2.1, 0.8, -0.1, -1.0, -1.8, -2.4, -3.0, -3.7],
    [11.4, 9.6, 7.5, 5.7, 4.3, 2.9, 1.6, 0.7, -0.2, -1.0, -1.6, -2.2, -2.9],
    [10.2, 8.4, 6.3, 4.5, 3.1, 1.7, 0.4, -0.5, -1.4, -2.2, -2.8, -3.4, -4.1]
  ],
  sil: [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
  ],
};

// Dynamic Time Warping algorithm
function computeDTW(seq1: number[], seq2: number[]): number {
  const n = seq1.length;
  const m = seq2.length;
  const dtw: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(Infinity)
  );
  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(seq1[i - 1] - seq2[j - 1]);
      dtw[i][j] =
        cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
    }
  }

  return dtw[n][m];
}

// Realtime audio analyzer class
class RealtimeAudioAnalyzer {
  private config: {
    sensitivity: number;
    intensityMultiplier?: number;
    minIntensity?: number;
    realtimeProvider: any;
    onPhonemeDetected: (phoneme: PhonemeData) => void;
  };
  private isRunning = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private meydaAnalyzer: any = null;
  private lastPhoneme = "sil";
  private lastIntensity = 0;
  private isProcessing = false;
  private fallbackInterval: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: RealtimeAudioAnalyzer["config"]) {
    this.config = config;
  }

  async start() {
    this.isRunning = true;
    this.reconnectAttempts = 0;
    
    console.log("Starting realtime audio analyzer...");
    
    try {
      await this.attemptConnection();
    } catch (error) {
      console.error("Failed to setup realtime audio capture:", error);
      this.isRunning = false;
      throw error;
    }
  }

  private async attemptConnection() {
    try {
      // Try to get audio from provider first
      const providerAudio = this.config.realtimeProvider.getAudioAnalyser?.();
      
      if (providerAudio) {
        console.log("Using provider audio analyser");
        this.analyser = providerAudio.analyser;
        this.audioContext = providerAudio.audioContext;
        this.setupMeydaAnalyzer();
        return;
      }
      
      // Fallback to manual audio capture
      console.log("Provider audio not available, using fallback");
      await this.setupAudioCapture();
      
    } catch (error) {
      console.error("Connection attempt failed:", error);
      
      // If connection fails, try again after delay
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.isRunning) {
        this.reconnectAttempts++;
        console.log(`Retrying connection (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          if (this.isRunning) {
            this.attemptConnection();
          }
        }, 2000);
      } else {
        throw error;
      }
    }
  }

  updateAudioSource(analyser: AnalyserNode, audioContext: AudioContext) {
    console.log("Updating audio source from provider");
    
    // Stop current Meyda analyzer
    if (this.meydaAnalyzer) {
      this.meydaAnalyzer.stop();
      this.meydaAnalyzer = null;
    }

    // Clear fallback interval
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }

    // Update to use provider's audio stream
    this.analyser = analyser;
    this.audioContext = audioContext;
    
    // Restart analysis with new audio source
    if (this.isRunning) {
      this.setupMeydaAnalyzer();
    }
  }

  stop() {
    console.log("Stopping realtime audio analyzer");
    this.isRunning = false;
    
    if (this.meydaAnalyzer) {
      this.meydaAnalyzer.stop();
      this.meydaAnalyzer = null;
    }
    
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
    
    // Don't close audio context if it came from provider
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (error) {
        console.warn("Could not close audio context:", error);
      }
    }
    this.audioContext = null;
    this.analyser = null;
  }

  private async setupAudioCapture() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: true
      });
      
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.6;
      
      source.connect(this.analyser);
      this.setupMeydaAnalyzer();
      return;
    } catch (error) {
      console.warn("Display media not available, using microphone fallback");
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
        
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.6;
        
        source.connect(this.analyser);
        this.setupMeydaAnalyzer();
      } catch (micError) {
        throw new Error("Could not setup any audio capture method for realtime lip sync");
      }
    }
  }

  private setupMeydaAnalyzer() {
    if (!this.analyser || !this.audioContext) {
      console.warn("Cannot setup Meyda analyzer: missing analyser or audioContext");
      return;
    }

    try {
      console.log("Setting up Meyda analyzer...");
      
      import("meyda")
        .then((Meyda) => {
          if (!this.isRunning || !this.analyser || !this.audioContext) {
            console.log("Analyzer stopped before Meyda setup completed");
            return;
          }

          // Create a gain node to connect to Meyda
          const source = this.audioContext.createGain();
          this.analyser.connect(source);

          this.meydaAnalyzer = Meyda.default.createMeydaAnalyzer({
            audioContext: this.audioContext,
            source: source,
            bufferSize: 512,
            featureExtractors: ["mfcc"],
            callback: (features: any) => {
              if (!this.isRunning || this.isProcessing) return;
              this.analyzeWithMFCC(features);
            },
          });

          this.meydaAnalyzer.start();
          console.log("Meyda analyzer started successfully");
          
          // Clear any fallback interval since Meyda is working
          if (this.fallbackInterval) {
            clearInterval(this.fallbackInterval);
            this.fallbackInterval = null;
          }
        })
        .catch((error) => {
          console.warn("Meyda not available, using basic frequency analysis:", error);
          this.startFallbackAnalysis();
        });
    } catch (error) {
      console.warn("Failed to setup MFCC analysis, using basic frequency analysis:", error);
      this.startFallbackAnalysis();
    }
  }

  private startFallbackAnalysis() {
    if (this.fallbackInterval) return; // Already running
    
    console.log("Starting fallback frequency analysis");
    this.fallbackInterval = setInterval(() => {
      if (this.isRunning) {
        this.analyze();
      }
    }, 50) as any; // Run every 50ms
  }

  private analyzeWithMFCC(features: any) {
    if (!features?.mfcc || this.isProcessing) return;

    this.isProcessing = true;

    try {
      const liveMFCC = features.mfcc;
      let bestMatch: PhonemeData["phoneme"] = "sil";
      let lowestDistance = Infinity;
      let secondBestDistance = Infinity;

      for (const [phoneme, templateList] of Object.entries(phonemeTemplates)) {
        for (const templateMFCC of templateList) {
          const minLen = Math.min(templateMFCC.length, liveMFCC.length);
          const distance = computeDTW(
            liveMFCC.slice(0, minLen),
            templateMFCC.slice(0, minLen)
          );
          if (distance < lowestDistance) {
            secondBestDistance = lowestDistance;
            lowestDistance = distance;
            bestMatch = phoneme as PhonemeData["phoneme"];
          } else if (distance < secondBestDistance) {
            secondBestDistance = distance;
          }
        }
      }

      const confidence = secondBestDistance > 0 ? 
        Math.min(1.0, secondBestDistance / Math.max(lowestDistance, 0.1)) : 1.0;

      const baseThreshold = (1.0 - this.config.sensitivity) * 60;
      const dynamicThreshold = baseThreshold * (2.0 - confidence);
      
      if (lowestDistance < dynamicThreshold) {
        let intensity = Math.max(0, Math.min(1, 1 - lowestDistance / 60));

        intensity = intensity * confidence * 1.2;
        intensity = intensity * (this.config.sensitivity + 0.7);
        intensity = intensity * (this.config.intensityMultiplier || 1.0);
        
        intensity = Math.max(intensity, this.config.minIntensity || 0);
        intensity = Math.min(intensity, 1.0);

        const shouldUpdate = bestMatch !== this.lastPhoneme || 
                            Math.abs(intensity - (this.lastIntensity || 0)) > 0.1;

        if (shouldUpdate && intensity > 0.05) {
          const phonemeData: PhonemeData = {
            phoneme: bestMatch,
            intensity: intensity,
            timestamp: Date.now(),
            duration: 50,
          };

          this.config.onPhonemeDetected(phonemeData);
          this.lastPhoneme = bestMatch;
          this.lastIntensity = intensity;
        }
      }
    } catch (error) {
      console.error("Error in MFCC analysis:", error);
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, 30);
  }

  private analyze() {
    if (!this.isRunning || !this.analyser) return;

    try {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      this.analyser.getFloatFrequencyData(dataArray);

      const phoneme = this.detectPhoneme(dataArray);

      if (phoneme.phoneme !== "sil") {
        this.config.onPhonemeDetected(phoneme);
      }
    } catch (error) {
      console.error("Error in frequency analysis:", error);
      
      // If error occurs repeatedly, try to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log("Attempting to reconnect due to analysis error...");
        this.attemptConnection();
      }
    }

    // Don't use requestAnimationFrame in interval-based fallback
    // The interval will handle the timing
  }

  private detectPhoneme(frequencyData: Float32Array): PhonemeData {
    const peaks = this.findFormantPeaks(frequencyData);
    const overallIntensity = this.calculateIntensity(frequencyData);

    if (peaks.length < 2 || overallIntensity < 0.01) {
      return {
        phoneme: "sil",
        intensity: 0,
        timestamp: Date.now(),
        duration: 50,
      };
    }

    const f1 = peaks[0];
    const f2 = peaks[1];
    let intensity = overallIntensity * (this.config.sensitivity + 0.3);

    intensity = intensity * (this.config.intensityMultiplier || 1.0);
    intensity = Math.max(intensity, this.config.minIntensity || 0);
    intensity = Math.min(intensity, 1.0);

    let phoneme: PhonemeData["phoneme"] = "sil";
    let maxConfidence = 0;

    const classifications = [
      { phoneme: "aa", confidence: this.classifyAA(f1, f2) },
      { phoneme: "ih", confidence: this.classifyIH(f1, f2) },
      { phoneme: "ou", confidence: this.classifyOU(f1, f2) },
      { phoneme: "ee", confidence: this.classifyEE(f1, f2) },
      { phoneme: "oh", confidence: this.classifyOH(f1, f2) },
    ];

    for (const cls of classifications) {
      if (cls.confidence > maxConfidence && cls.confidence > 0.3) {
        maxConfidence = cls.confidence;
        phoneme = cls.phoneme as PhonemeData["phoneme"];
      }
    }

    intensity = intensity * (1 + maxConfidence * 0.5);
    intensity = Math.min(intensity, 1.0);

    return {
      phoneme,
      intensity: intensity,
      timestamp: Date.now(),
      duration: 50,
    };
  }

  private classifyAA(f1: number, f2: number): number {
    if (f1 > 450 && f1 < 850 && f2 > 900 && f2 < 1800) {
      const f1Score = 1 - Math.abs(f1 - 650) / 400;
      const f2Score = 1 - Math.abs(f2 - 1350) / 900;
      return Math.max(0, Math.min(1, (f1Score + f2Score) / 2));
    }
    return 0;
  }

  private classifyIH(f1: number, f2: number): number {
    if (f1 > 250 && f1 < 500 && f2 > 1700 && f2 < 2400) {
      const f1Score = 1 - Math.abs(f1 - 375) / 250;
      const f2Score = 1 - Math.abs(f2 - 2050) / 700;
      return Math.max(0, Math.min(1, (f1Score + f2Score) / 2));
    }
    return 0;
  }

  private classifyOU(f1: number, f2: number): number {
    if (f1 > 250 && f1 < 500 && f2 > 600 && f2 < 1200) {
      const f1Score = 1 - Math.abs(f1 - 375) / 250;
      const f2Score = 1 - Math.abs(f2 - 900) / 600;
      return Math.max(0, Math.min(1, (f1Score + f2Score) / 2));
    }
    return 0;
  }

  private classifyEE(f1: number, f2: number): number {
    if (f1 > 350 && f1 < 700 && f2 > 1500 && f2 < 2200) {
      const f1Score = 1 - Math.abs(f1 - 525) / 350;
      const f2Score = 1 - Math.abs(f2 - 1850) / 700;
      return Math.max(0, Math.min(1, (f1Score + f2Score) / 2));
    }
    return 0;
  }

  private classifyOH(f1: number, f2: number): number {
    if (f1 > 350 && f1 < 700 && f2 > 700 && f2 < 1500) {
      const f1Score = 1 - Math.abs(f1 - 525) / 350;
      const f2Score = 1 - Math.abs(f2 - 1100) / 800;
      return Math.max(0, Math.min(1, (f1Score + f2Score) / 2));
    }
    return 0;
  }

  private findFormantPeaks(data: Float32Array): number[] {
    const peaks: { freq: number; magnitude: number }[] = [];
    const sampleRate = 44100;
    const freqPerBin = sampleRate / (data.length * 2);

    for (let i = 2; i < data.length - 2; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && 
          data[i] > data[i - 2] && data[i] > data[i + 2] && 
          data[i] > -50) {
        const freq = i * freqPerBin;
        if (freq > 80 && freq < 4000) {
          const prominence = Math.min(
            data[i] - data[i - 1],
            data[i] - data[i + 1]
          );
          peaks.push({ freq, magnitude: data[i] + prominence });
        }
      }
    }

    return peaks
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 6)
      .map((p) => p.freq)
      .sort((a, b) => a - b);
  }

  private calculateIntensity(data: Float32Array): number {
    let sum = 0;
    let count = 0;
    let peakSum = 0;
    let peakCount = 0;

    for (let i = 0; i < data.length; i++) {
      if (data[i] > -80) {
        const linearValue = Math.pow(10, data[i] / 12);
        sum += linearValue;
        count++;
        
        const freq = (i * 44100) / (data.length * 2);
        if (freq > 200 && freq < 3000 && data[i] > -50) {
          peakSum += linearValue;
          peakCount++;
        }
      }
    }

    const baseIntensity = count > 0 ? Math.sqrt(sum / count) : 0;
    const peakIntensity = peakCount > 0 ? Math.sqrt(peakSum / peakCount) : 0;
    
    const combinedIntensity = (baseIntensity * 0.3 + peakIntensity * 0.7);
    return Math.min(combinedIntensity * 3.0, 1.0);
  }
}

// Convert phoneme data to VRM mouth state
function phonemeToMouthState(
  phoneme: PhonemeData,
  intensityMultiplier: number = 1.0
): MouthState {
  const state: MouthState = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

  if (phoneme.phoneme !== "sil" && phoneme.intensity > 0.01) {
    let boostedIntensity = phoneme.intensity * intensityMultiplier;
    
    const phonemeBoosts = {
      aa: 2.2,
      ih: 1.8,
      ou: 2.0,
      ee: 1.7,
      oh: 1.9,
    };
    
    boostedIntensity *= phonemeBoosts[phoneme.phoneme] || 1.0;
    boostedIntensity *= 1.8;
    boostedIntensity = Math.pow(boostedIntensity, 0.7);
    boostedIntensity = Math.min(boostedIntensity, 1.0);
    
    const minMovement = {
      aa: 0.25,
      ih: 0.15,
      ou: 0.20,
      ee: 0.15,
      oh: 0.18,
    };
    
    const finalIntensity = Math.max(
      boostedIntensity, 
      minMovement[phoneme.phoneme] || 0.12
    );
    
    state[phoneme.phoneme] = finalIntensity;
    
    const blendRatio = 0.15;
    switch (phoneme.phoneme) {
      case "aa":
        state.oh = finalIntensity * blendRatio;
        break;
      case "ih":
        state.ee = finalIntensity * blendRatio;
        break;
      case "ou":
        state.oh = finalIntensity * blendRatio;
        break;
      case "ee":
        state.ih = finalIntensity * blendRatio;
        break;
      case "oh":
        state.aa = finalIntensity * blendRatio;
        break;
    }
  }

  return state;
}