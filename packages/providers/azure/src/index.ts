import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { TTSProvider } from '@khaveeai/core';

export interface TTSAzureConfig {
  key: string;
  region: string;
  mock?: boolean; // Enable mock mode for development
}

export class TTSAzure implements TTSProvider {
  private speechConfig?: SpeechSDK.SpeechConfig;
  private mock: boolean;

  constructor(config: TTSAzureConfig) {
    this.mock = config.mock || false;
    
    if (!this.mock) {
      this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(config.key, config.region);
    }
  }

  async speak({ text, voice = 'ja-JP-NanamiNeural' }: { text: string; voice?: string }): Promise<void> {
    if (this.mock) {
      console.log(`[Mock TTS] Speaking with ${voice}: "${text}"`);
      
      // Simulate speech duration based on text length
      const wordsPerMinute = 150;
      const words = text.split(' ').length;
      const durationMs = (words / wordsPerMinute) * 60 * 1000;
      
      // Simulate lip-sync visemes during mock speech
      this.simulateVisemes(text, durationMs);
      
      // Wait for the simulated speech duration
      await new Promise(resolve => setTimeout(resolve, Math.min(durationMs, 5000))); // Cap at 5 seconds
      
      console.log('[Mock TTS] Speech completed');
      return;
    }

    if (!this.speechConfig) {
      throw new Error('Azure Speech SDK not initialized. Set mock: false or provide valid credentials.');
    }

    return new Promise((resolve, reject) => {
      this.speechConfig!.speechSynthesisVoiceName = voice;
      
      const synthesizer = new SpeechSDK.SpeechSynthesizer(
        this.speechConfig!, 
        SpeechSDK.AudioConfig.fromDefaultSpeakerOutput()
      );

      synthesizer.speakTextAsync(
        text,
        (result: any) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            resolve();
          } else {
            reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
          }
          synthesizer.close();
        },
        (error: any) => {
          reject(error);
          synthesizer.close();
        }
      );
    });
  }

  private simulateVisemes(text: string, durationMs: number) {
    // Mock viseme simulation for development
    const visemeMap: Record<string, string[]> = {
      'a': ['aa'], 'e': ['ee'], 'i': ['ih'], 'o': ['oh'], 'u': ['ou'],
      'b': ['PP'], 'm': ['PP'], 'p': ['PP'],
      'f': ['FF'], 'v': ['FF'],
      't': ['TH'], 'd': ['TH'], 'n': ['TH'],
      's': ['SS'], 'z': ['SS']
    };
    
    console.log('[Mock Visemes] Simulating lip-sync for:', text.substring(0, 50) + '...');
    
    // This would typically emit viseme events that the VRM avatar would listen to
    // For now, just log the simulation
    setTimeout(() => {
      console.log('[Mock Visemes] Lip-sync simulation completed');
    }, durationMs);
  }
}