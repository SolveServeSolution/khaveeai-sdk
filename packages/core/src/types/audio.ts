/**
 * Audio analysis data for mouth/viseme animation
 */
export interface AudioData {
  volume: number;
  frequencies: Float32Array;
  timestamp: number;
}

/**
 * Mouth/viseme state for VRM lip sync
 */
export interface MouthState {
  aa: number;  // Open mouth (あ)
  ih: number;  // Smile mouth (い)
  ou: number;  // Pucker mouth (う)
  ee: number;  // Half open (え)
  oh: number;  // Round mouth (お)
}

/**
 * Phoneme data for lip sync (Japanese vowels)
 */
export interface PhonemeData {
  phoneme: 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | 'sil';
  intensity: number; // 0-1
  timestamp: number;
  duration?: number;
}

/**
 * Audio stream configuration
 */
export interface AudioConfig {
  sampleRate?: number;
  bufferSize?: number;
  enableVolumeDetection?: boolean;
  enablePhonemeDetection?: boolean;
}