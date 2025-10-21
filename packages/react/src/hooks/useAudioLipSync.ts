"use client";
import type { MouthState, PhonemeData } from "@khaveeai/core";
import { useCallback, useState } from "react";
import { useVRMExpressions } from "../VRMAvatar";

/**
 * Hook for lip-sync analysis from audio files
 * Analyzes pre-recorded audio for phoneme detection and mouth states
 */
export function useAudioLipSync() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mouthState, setMouthState] = useState<MouthState>({
    aa: 0,
    ih: 0,
    ou: 0,
    ee: 0,
    oh: 0,
  });
  const [currentPhoneme, setCurrentPhoneme] = useState<PhonemeData | null>(
    null
  );
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );

  const { setMultipleExpressions } = useVRMExpressions();

  /**
   * Analyze audio file and sync lip movements
   */
  const analyzeLipSync = useCallback(
    async (
      audioUrl: string,
      options?: {
        sensitivity?: number; // 0.1 to 1.0
        smoothing?: number; // 0.1 to 1.0
        intensityMultiplier?: number; // 1.0 to 5.0 - boost mouth movement intensity
        minIntensity?: number; // 0.0 to 1.0 - minimum intensity threshold
        onPhonemeChange?: (phoneme: PhonemeData) => void;
      }
    ) => {
      setIsAnalyzing(true);

      try {
        const audio = new Audio(audioUrl);
        setAudioElement(audio);

        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = options?.smoothing || 0.6; // Reduced for more responsive
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Start MFCC-based analysis with higher sensitivity
        const analyzer = new AudioFileAnalyzer(analyser, audioContext, {
          sensitivity: options?.sensitivity || 0, // Increased default sensitivity
          intensityMultiplier: options?.intensityMultiplier || 4.0, // New intensity boost
          minIntensity: options?.minIntensity || 0.3, // Minimum intensity threshold
          audioSource: source, // Pass the audio source for Meyda
          onPhonemeDetected: (phoneme: PhonemeData) => {
            setCurrentPhoneme(phoneme);
            options?.onPhonemeChange?.(phoneme);

            // Convert phoneme to mouth state and apply to VRM with intensity boost
            const newMouthState = phonemeToMouthState(
              phoneme,
              options?.intensityMultiplier || 2.5
            );
            // Apply to VRM expressions - try both common VRM expression names
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

        // Play audio and start analysis
        await audio.play();
        analyzer.start();

        // Stop analysis when audio ends
        audio.onended = () => {
          analyzer.stop();
          setIsAnalyzing(false);
          setCurrentPhoneme(null);
          setMultipleExpressions({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });
        };
      } catch (error) {
        console.error("Audio lip-sync analysis failed:", error);
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * Stop current lip-sync analysis
   */
  const stopLipSync = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setIsAnalyzing(false);
    setCurrentPhoneme(null);
    setMouthState({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });
  }, [audioElement]);

  return {
    analyzeLipSync,
    stopLipSync,
    isAnalyzing,
    mouthState,
    currentPhoneme,
    audioElement,
  };
}

// MFCC-based phoneme templates for VRM lip-sync
const phonemeTemplates: Record<string, number[][]> = {
  aa: [[13.2, 11.5, 9.3, 7.1, 5.8, 4.2, 2.9, 1.5, 0.7, -0.3, -1.0, -1.7, -2.5]],
  ih: [
    [14.1, 12.0, 10.0, 8.1, 6.3, 4.5, 3.2, 2.0, 0.9, -0.1, -1.2, -2.0, -3.0],
  ],
  ou: [
    [10.2, 8.1, 6.3, 4.5, 3.1, 1.8, 0.5, -0.3, -1.0, -1.6, -2.2, -2.9, -3.5],
  ],
  ee: [
    [12.8, 10.7, 8.5, 6.0, 4.3, 2.2, 1.0, 0.2, -0.5, -1.2, -1.9, -2.1, -2.8],
  ],
  oh: [[11.0, 9.2, 7.1, 5.3, 3.9, 2.5, 1.2, 0.3, -0.6, -1.4, -2.0, -2.6, -3.3]],
  sil: [[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]],
};

// Dynamic Time Warping algorithm for comparing MFCC sequences
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

/**
 * MFCC-based audio analyzer for lip-sync from file
 */
class AudioFileAnalyzer {
  private analyser: AnalyserNode;
  private audioContext: AudioContext;
  private isRunning = false;
  private config: {
    sensitivity: number;
    intensityMultiplier?: number;
    minIntensity?: number;
    audioSource?: AudioNode;
    onPhonemeDetected: (phoneme: PhonemeData) => void;
  };
  private meydaAnalyzer: any = null;
  private lastPhoneme = "sil";
  private isProcessing = false;

  constructor(
    analyser: AnalyserNode,
    audioContext: AudioContext,
    config: AudioFileAnalyzer["config"]
  ) {
    this.analyser = analyser;
    this.audioContext = audioContext;
    this.config = config;
  }

  start() {
    this.isRunning = true;
    this.setupMeydaAnalyzer();
  }

  stop() {
    this.isRunning = false;
    if (this.meydaAnalyzer) {
      this.meydaAnalyzer.stop();
    }
  }

  private setupMeydaAnalyzer() {
    try {
      // Import Meyda dynamically to avoid SSR issues
      import("meyda")
        .then((Meyda) => {
          if (!this.isRunning) return;

          // Use provided audio source or create a gain node as fallback
          const source =
            this.config.audioSource || this.audioContext.createGain();

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
          console.log("🎵 MFCC-based phoneme detection started");
        })
        .catch((error) => {
          // Fallback to basic frequency analysis if Meyda is not available
          console.warn(
            "Meyda not available, using basic frequency analysis:",
            error
          );
          this.analyze();
        });
    } catch (error) {
      // Fallback to basic frequency analysis
      console.warn(
        "Failed to setup MFCC analysis, using basic frequency analysis:",
        error
      );
      this.analyze();
    }
  }

  private analyzeWithMFCC(features: any) {
    if (!features?.mfcc || this.isProcessing) return;

    this.isProcessing = true;

    const liveMFCC = features.mfcc;
    let bestMatch: PhonemeData["phoneme"] = "sil";
    let lowestDistance = Infinity;

    // Compare with phoneme templates using DTW
    for (const [phoneme, templateList] of Object.entries(phonemeTemplates)) {
      for (const templateMFCC of templateList) {
        const minLen = Math.min(templateMFCC.length, liveMFCC.length);
        const distance = computeDTW(
          liveMFCC.slice(0, minLen),
          templateMFCC.slice(0, minLen)
        );
        if (distance < lowestDistance) {
          lowestDistance = distance;
          bestMatch = phoneme as PhonemeData["phoneme"];
        }
      }
    }

    // Apply sensitivity threshold
    const threshold = (1.0 - this.config.sensitivity) * 100; // Convert sensitivity to distance threshold
    if (lowestDistance < threshold && bestMatch !== this.lastPhoneme) {
      let intensity = Math.max(0, Math.min(1, 1 - lowestDistance / 100));

      // Apply intensity multiplier and minimum threshold
      intensity =
        intensity *
        this.config.sensitivity *
        (this.config.intensityMultiplier || 1.0);
      intensity = Math.max(intensity, this.config.minIntensity || 0);
      intensity = Math.min(intensity, 1.0); // Cap at 1.0

      const phonemeData: PhonemeData = {
        phoneme: bestMatch,
        intensity: intensity,
        timestamp: Date.now(),
        duration: 50,
      };

      this.config.onPhonemeDetected(phonemeData);
      this.lastPhoneme = bestMatch;
    }

    // Add small delay to prevent overwhelming the system
    setTimeout(() => {
      this.isProcessing = false;
    }, 50);
  }

  // Fallback method using basic frequency analysis
  private analyze() {
    if (!this.isRunning) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(dataArray);

    // Detect phoneme from frequency data
    const phoneme = this.detectPhoneme(dataArray);

    if (phoneme.phoneme !== "sil") {
      this.config.onPhonemeDetected(phoneme);
    }

    // Continue analysis
    requestAnimationFrame(() => this.analyze());
  }

  private detectPhoneme(frequencyData: Float32Array): PhonemeData {
    const peaks = this.findFormantPeaks(frequencyData);

    if (peaks.length < 2) {
      return {
        phoneme: "sil",
        intensity: 0,
        timestamp: Date.now(),
        duration: 50,
      };
    }

    const f1 = peaks[0];
    const f2 = peaks[1];
    let intensity =
      this.calculateIntensity(frequencyData) * this.config.sensitivity;

    // Apply intensity multiplier and minimum threshold for fallback analysis
    intensity = intensity * (this.config.intensityMultiplier || 1.0);
    intensity = Math.max(intensity, this.config.minIntensity || 0);
    intensity = Math.min(intensity, 1.0);

    // Japanese vowel classification based on formant frequencies
    let phoneme: PhonemeData["phoneme"] = "sil";

    if (f1 > 600 && f2 > 1100 && f2 < 1600) {
      phoneme = "aa"; // あ - Open mouth
    } else if (f1 < 400 && f2 > 2000) {
      phoneme = "ih"; // い - Smile
    } else if (f1 < 400 && f2 < 1000) {
      phoneme = "ou"; // う - Pucker
    } else if (f1 > 350 && f1 < 600 && f2 > 1700) {
      phoneme = "ee"; // え - Half open
    } else if (f1 > 350 && f1 < 600 && f2 < 1300) {
      phoneme = "oh"; // お - Round
    }

    return {
      phoneme,
      intensity: intensity,
      timestamp: Date.now(),
      duration: 50,
    };
  }

  private findFormantPeaks(data: Float32Array): number[] {
    const peaks: { freq: number; magnitude: number }[] = [];
    const sampleRate = 44100; // Assume standard sample rate
    const freqPerBin = sampleRate / (data.length * 2);

    // Find peaks in frequency spectrum
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > -40) {
        const freq = i * freqPerBin;
        if (freq > 80 && freq < 3500) {
          // Focus on speech range
          peaks.push({ freq, magnitude: data[i] });
        }
      }
    }

    return peaks
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 4)
      .map((p) => p.freq);
  }

  private calculateIntensity(data: Float32Array): number {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < data.length; i++) {
      if (data[i] > -60) {
        // Filter out noise
        sum += Math.pow(10, data[i] / 20); // Convert dB to linear
        count++;
      }
    }

    return count > 0 ? Math.sqrt(sum / count) : 0;
  }
}

/**
 * Convert phoneme data to VRM mouth state with optional intensity boost
 */
function phonemeToMouthState(
  phoneme: PhonemeData,
  intensityMultiplier: number = 1.0
): MouthState {
  const state: MouthState = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

  if (phoneme.phoneme !== "sil" && phoneme.intensity > 0.05) {
    // Lowered threshold
    // Apply intensity multiplier and cap at 1.0
    const boostedIntensity = Math.min(
      phoneme.intensity * intensityMultiplier,
      1.0
    );
    state[phoneme.phoneme] = boostedIntensity;
  }

  return state;
}
