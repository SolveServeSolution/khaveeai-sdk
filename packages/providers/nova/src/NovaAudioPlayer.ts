/**
 * Audio Player for Amazon Nova Speech Output
 * Based on Amazon Workshop AudioWorklet implementation
 */

export class NovaAudioPlayer {
  private initialized = false;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;

  constructor() {}

  /**
   * Initialize the audio player
   */
  async start(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;

      // Create inline worklet processor
      const workletCode = `
class AudioPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentPosition = 0;

    this.port.onmessage = (event) => {
      if (event.data.type === 'audio') {
        this.audioQueue.push(event.data.audioData);
        if (!this.isPlaying) {
          this.isPlaying = true;
        }
      } else if (event.data.type === 'barge-in') {
        this.audioQueue = [];
        this.currentPosition = 0;
        this.isPlaying = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];

    if (!this.isPlaying || this.audioQueue.length === 0) {
      return true;
    }

    const currentChunk = this.audioQueue[0];
    let samplesWritten = 0;

    while (samplesWritten < channel.length && this.audioQueue.length > 0) {
      const chunk = this.audioQueue[0];
      const remainingSamples = chunk.length - this.currentPosition;
      const samplesToWrite = Math.min(
        remainingSamples,
        channel.length - samplesWritten
      );

      for (let i = 0; i < samplesToWrite; i++) {
        channel[samplesWritten + i] = chunk[this.currentPosition + i];
      }

      samplesWritten += samplesToWrite;
      this.currentPosition += samplesToWrite;

      if (this.currentPosition >= chunk.length) {
        this.audioQueue.shift();
        this.currentPosition = 0;
      }
    }

    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
    }

    return true;
  }
}

registerProcessor('audio-player-processor', AudioPlayerProcessor);
      `;

      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);

      await this.audioContext.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        'audio-player-processor'
      );
      this.workletNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.workletNode.onprocessorerror = (err) => {
        console.error('AudioWorklet processing error:', err);
      };

      this.initialized = true;

      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize audio player:', error);
      this.stop();
      throw error;
    }
  }

  /**
   * Interrupt current audio playback (barge-in)
   */
  bargeIn(): void {
    if (!this.initialized || !this.workletNode) return;
    this.workletNode.port.postMessage({
      type: 'barge-in',
    });
  }

  /**
   * Stop and cleanup the audio player
   */
  stop(): void {
    if (!this.initialized) return;

    if (this.audioContext) {
      this.audioContext.close();
    }

    if (this.analyser) {
      this.analyser.disconnect();
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
    }

    this.initialized = false;
    this.audioContext = null;
    this.analyser = null;
    this.workletNode = null;
  }

  /**
   * Play audio samples
   */
  playAudio(samples: Float32Array): void {
    if (!this.initialized || !this.workletNode) {
      console.error(
        'The audio player is not initialized. Call start() before attempting to play audio.'
      );
      return;
    }

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch((err) => {
        console.error('Failed to resume audio context:', err);
      });
    }

    if (!samples || samples.length === 0) {
      console.warn('Received empty audio data');
      return;
    }

    this.workletNode.port.postMessage({
      type: 'audio',
      audioData: samples,
    });
  }

  /**
   * Get audio analyser for visualizations
   */
  getAnalyser(): { analyser: AnalyserNode; audioContext: AudioContext } | null {
    if (!this.initialized || !this.analyser || !this.audioContext) {
      return null;
    }
    return { analyser: this.analyser, audioContext: this.audioContext };
  }
}
