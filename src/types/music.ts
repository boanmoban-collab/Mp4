export interface LyricLine {
  id: string;
  text: string;
  startTime: number; // in seconds
  duration: number;  // in seconds
  noteHint?: string; // Musical cue
}

export type RhythmPattern = 'malfuf' | 'maqsum' | 'saidi' | 'baladi' | 'dance_pop';

export interface VisualTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  spotlightColor: string;
  glowColor: string;
  bgFilter: string;
}

export type VocalMode = 'synth_reciter' | 'mic_record' | 'instrumental';
