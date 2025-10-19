/**
 * Audio analysis for volume and phoneme detection
 */
export class AudioAnalyzer {
    constructor(config) {
        this.analyser = null;
        this.audioContext = null;
        this.config = config;
    }
    /**
     * Setup analysis for inbound audio (assistant speech)
     */
    setupInboundAudio(stream, audioElement) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        this.analyser = analyser;
        this.audioContext = audioContext;
        // Connect to audio element for playback
        audioElement.srcObject = stream;
        if (this.config.enablePhonemeDetection) {
            this.startPhonemeDetection();
        }
    }
    /**
     * Setup analysis for outbound audio (user microphone)
     */
    setupOutboundAudio(analyser) {
        // For microphone visualization
        this.analyser = analyser;
    }
    /**
     * Get current volume level (0-1)
     */
    getVolume() {
        if (!this.analyser)
            return 0;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (const sample of dataArray) {
            const float = (sample - 128) / 128;
            sum += float * float;
        }
        return Math.sqrt(sum / dataArray.length);
    }
    /**
     * Start real-time phoneme detection for lip sync
     */
    startPhonemeDetection() {
        if (!this.analyser)
            return;
        const detectPhonemes = () => {
            if (!this.analyser)
                return;
            const dataArray = new Float32Array(this.analyser.frequencyBinCount);
            this.analyser.getFloatFrequencyData(dataArray);
            // Detect formants and classify phonemes
            const phoneme = this.classifyPhoneme(dataArray);
            const mouthState = this.phonemeToMouthState(phoneme);
            if (phoneme.phoneme !== 'sil') {
                this.config.onPhonemeDetected?.(phoneme);
            }
            this.config.onMouthStateChange?.(mouthState);
            requestAnimationFrame(detectPhonemes);
        };
        detectPhonemes();
    }
    /**
     * Classify phoneme from frequency data
     * Simplified implementation - detects Japanese vowels (aa, i, u, e, o)
     */
    classifyPhoneme(frequencyData) {
        // Find peaks in frequency domain
        const peaks = this.findPeaks(frequencyData);
        if (peaks.length < 2) {
            return {
                phoneme: 'sil',
                intensity: 0,
                timestamp: Date.now()
            };
        }
        const f1 = peaks[0]; // First formant
        const f2 = peaks[1]; // Second formant
        // Classify based on formant frequencies (simplified)
        let phoneme = 'sil';
        let intensity = 0.5;
        // Japanese vowel classification (approximate formant values)
        if (f1 > 650 && f2 > 1100 && f2 < 1600) {
            phoneme = 'aa'; // あ
            intensity = 0.8;
        }
        else if (f1 < 450 && f2 > 1900) {
            phoneme = 'i'; // い
            intensity = 0.7;
        }
        else if (f1 < 450 && f2 < 1100) {
            phoneme = 'u'; // う
            intensity = 0.6;
        }
        else if (f1 > 350 && f1 < 650 && f2 > 1700) {
            phoneme = 'e'; // え
            intensity = 0.7;
        }
        else if (f1 > 350 && f1 < 650 && f2 < 1300) {
            phoneme = 'o'; // お
            intensity = 0.6;
        }
        return {
            phoneme,
            intensity,
            timestamp: Date.now(),
            duration: 50 // ~50ms detection window
        };
    }
    /**
     * Convert phoneme to VRM mouth state
     */
    phonemeToMouthState(phoneme) {
        const state = { aa: 0, i: 0, u: 0, e: 0, o: 0 };
        if (phoneme.phoneme !== 'sil') {
            state[phoneme.phoneme] = phoneme.intensity;
        }
        return state;
    }
    /**
     * Find frequency peaks for formant detection
     */
    findPeaks(data) {
        const peaks = [];
        const sampleRate = this.audioContext?.sampleRate || 44100;
        const freqPerBin = sampleRate / (data.length * 2);
        // Look for peaks in the frequency data
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > -30) {
                const freq = i * freqPerBin;
                if (freq > 100 && freq < 3000) { // Focus on speech range
                    peaks.push({ freq, magnitude: data[i] });
                }
            }
        }
        // Sort by magnitude and return top frequencies
        return peaks
            .sort((a, b) => b.magnitude - a.magnitude)
            .slice(0, 5)
            .map(p => p.freq);
    }
}
