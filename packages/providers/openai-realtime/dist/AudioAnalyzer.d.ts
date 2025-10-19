/**
 * Audio analysis for volume and phoneme detection
 */
import { MouthState, PhonemeData } from '@khaveeai/core';
export interface AudioAnalyzerConfig {
    enablePhonemeDetection?: boolean;
    onVolumeChange?: (volume: number) => void;
    onMouthStateChange?: (state: MouthState) => void;
    onPhonemeDetected?: (phoneme: PhonemeData) => void;
}
export declare class AudioAnalyzer {
    private config;
    private analyser;
    private audioContext;
    constructor(config: AudioAnalyzerConfig);
    /**
     * Setup analysis for inbound audio (assistant speech)
     */
    setupInboundAudio(stream: MediaStream, audioElement: HTMLAudioElement): void;
    /**
     * Setup analysis for outbound audio (user microphone)
     */
    setupOutboundAudio(analyser: AnalyserNode): void;
    /**
     * Get current volume level (0-1)
     */
    getVolume(): number;
    /**
     * Start real-time phoneme detection for lip sync
     */
    private startPhonemeDetection;
    /**
     * Classify phoneme from frequency data
     * Simplified implementation - detects Japanese vowels (aa, i, u, e, o)
     */
    private classifyPhoneme;
    /**
     * Convert phoneme to VRM mouth state
     */
    private phonemeToMouthState;
    /**
     * Find frequency peaks for formant detection
     */
    private findPeaks;
}
