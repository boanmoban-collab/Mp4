/**
 * Audio Synthesis & Rhythm Engine for Arabic Music Video Studio
 * Provides authentic synthetic percussion (Darbuka Dum & Tak, Claps, Riq),
 * Oriental synth lead melody, Web Speech vocals, and audio streaming for video export.
 */

import { RhythmPattern, LyricLine, VocalMode } from '../types/music';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;

  private isRunning: boolean = false;
  private currentBpm: number = 108;
  private rhythm: RhythmPattern = 'maqsum';
  private vocalMode: VocalMode = 'synth_reciter';

  private timerId: number | null = null;
  private step: number = 0;
  private startTime: number = 0;
  private currentTimeOffset: number = 0;
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private activeLyricIndex: number = -1;

  public onTimeUpdate?: (time: number, lyricIndex: number, beat: number) => void;
  public onBeatTrigger?: (type: 'dum' | 'tak' | 'clap' | 'riq') => void;

  constructor() {
    // Initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.streamDest = this.ctx.createMediaStreamDestination();

    // Route: masterGain -> analyser -> audioCtx.destination (speakers) AND streamDest (for video recording)
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.masterGain.connect(this.streamDest);
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getMediaStream(): MediaStream | null {
    return this.streamDest ? this.streamDest.stream : null;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public async enableMicrophone(): Promise<boolean> {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return false;

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micGain = this.ctx.createGain();
      this.micGain.gain.value = 0.9;

      // Add a subtle vocal echo/reverb
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.18;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.3;

      this.micSource.connect(this.micGain);
      this.micGain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);

      this.micGain.connect(this.masterGain);
      delay.connect(this.masterGain);

      return true;
    } catch (e) {
      console.warn('Microphone permission not granted or error:', e);
      return false;
    }
  }

  public disableMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }

  /* Synthetic Percussion Sounds */
  private playDum(time: number, velocity: number = 1.0) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Pitch envelope: starts at 120Hz, drops sharply to 42Hz for punchy resonant oriental bass drum
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

    gain.gain.setValueAtTime(1.1 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.36);

    if (this.onBeatTrigger) this.onBeatTrigger('dum');
  }

  private playTak(time: number, velocity: number = 0.8) {
    if (!this.ctx || !this.masterGain) return;

    // High crisp metal/ceramic snap
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(820, time);
    osc.frequency.exponentialRampToValueAtTime(340, time + 0.05);

    oscGain.gain.setValueAtTime(0.7 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.09);

    // Noise snap
    this.playNoiseBurst(time, 0.04, 1800, 0.5 * velocity);

    if (this.onBeatTrigger) this.onBeatTrigger('tak');
  }

  private playSak(time: number, velocity: number = 0.6) {
    if (!this.ctx || !this.masterGain) return;
    this.playNoiseBurst(time, 0.03, 3000, 0.4 * velocity);
    if (this.onBeatTrigger) this.onBeatTrigger('tak');
  }

  private playClap(time: number, velocity: number = 0.7) {
    if (!this.ctx || !this.masterGain) return;
    // Layered noise bursts mimicking a lively hall clapping
    this.playNoiseBurst(time, 0.02, 1200, 0.3 * velocity);
    this.playNoiseBurst(time + 0.015, 0.02, 1100, 0.4 * velocity);
    this.playNoiseBurst(time + 0.03, 0.07, 1000, 0.6 * velocity);

    if (this.onBeatTrigger) this.onBeatTrigger('clap');
  }

  private playRiq(time: number, velocity: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    this.playNoiseBurst(time, 0.08, 6000, 0.3 * velocity);
    if (this.onBeatTrigger) this.onBeatTrigger('riq');
  }

  private playNoiseBurst(time: number, duration: number, cutoff: number, level: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(time);
  }

  /* Synthetic Oriental Melody Riff (Oud / Nay tone simulation) */
  private playMelodyNote(noteFreq: number, time: number, duration: number, velocity: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Warm reed / plucked string sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(noteFreq, time);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(noteFreq * 0.5, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(450, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.4 * velocity, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + duration);
    subOsc.stop(time + duration);
  }

  // Melodic scale notes (Arabic Bayati/Hijaz scale on D: D, Eb/half-flat, F, G, A, Bb, C, D)
  private melodyNotes = [
    293.66, // D4
    311.13, // Eb4
    349.23, // F4
    392.0,  // G4
    440.0,  // A4
    466.16, // Bb4
    523.25, // C5
    587.33  // D5
  ];

  /* 16-Step Arabic Drum Patterns */
  private getStepBeat(pattern: RhythmPattern, step: number): ('dum' | 'tak' | 'sak' | 'clap' | 'riq' | null)[] {
    // 16 steps = 4 beats (quarter notes = steps 0, 4, 8, 12)
    const hits: ('dum' | 'tak' | 'sak' | 'clap' | 'riq' | null)[] = [];

    switch (pattern) {
      case 'malfuf': // 2/4 rhythm repeated twice in 16 steps: Dum . . Tak . . Tak .
        if (step % 8 === 0) hits.push('dum');
        if (step % 8 === 3) hits.push('tak');
        if (step % 8 === 6) hits.push('tak');
        if (step % 4 === 2) hits.push('riq');
        if (step % 8 === 7) hits.push('clap');
        break;

      case 'maqsum': // 4/4 rhythm: Dum . Tak . . Tak Dum . . Tak . . . .
        if (step === 0 || step === 10) hits.push('dum');
        if (step === 2 || step === 5 || step === 12) hits.push('tak');
        if (step === 7 || step === 14) hits.push('riq');
        if (step === 4 || step === 12) hits.push('clap');
        break;

      case 'saidi': // 4/4 heavy rhythm: Dum . Tak . . Dum Dum . . Tak . . . .
        if (step === 0 || step === 6 || step === 8) hits.push('dum');
        if (step === 2 || step === 12) hits.push('tak');
        if (step === 4 || step === 10 || step === 14) hits.push('riq');
        if (step === 4 || step === 12) hits.push('clap');
        break;

      case 'baladi': // Dum Dum . . Tak . Dum . . Tak . . .
        if (step === 0 || step === 2 || step === 8) hits.push('dum');
        if (step === 5 || step === 12) hits.push('tak');
        if (step === 7 || step === 14) hits.push('riq');
        if (step === 4 || step === 12) hits.push('clap');
        break;

      case 'dance_pop': // Modern high energy beat
        if (step === 0 || step === 8 || step === 10) hits.push('dum');
        if (step === 4 || step === 12) hits.push('clap', 'tak');
        if (step === 2 || step === 6 || step === 14) hits.push('tak');
        if (step % 2 === 0) hits.push('riq');
        break;
    }

    return hits;
  }

  public setBpm(bpm: number) {
    this.currentBpm = Math.max(60, Math.min(180, bpm));
  }

  public getBpm(): number {
    return this.currentBpm;
  }

  public setRhythm(rhythm: RhythmPattern) {
    this.rhythm = rhythm;
  }

  public setVocalMode(mode: VocalMode) {
    this.vocalMode = mode;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  public start(lyrics: LyricLine[], fromTime: number = 0) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isRunning = true;
    this.startTime = this.ctx.currentTime - fromTime;
    this.currentTimeOffset = fromTime;
    this.step = Math.floor((fromTime / (60 / this.currentBpm / 4))) % 16;
    this.activeLyricIndex = -1;

    this.scheduleLoop(lyrics);
  }

  private scheduleLoop(lyrics: LyricLine[]) {
    if (!this.isRunning || !this.ctx) return;

    const stepInterval = (60 / this.currentBpm) / 4; // sixteenth note duration in seconds
    const now = this.ctx.currentTime;
    const elapsed = now - this.startTime;

    // Check currently active lyric line
    let activeIdx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      const l = lyrics[i];
      if (elapsed >= l.startTime && elapsed < l.startTime + l.duration) {
        activeIdx = i;
        break;
      }
    }

    // Trigger vocal recitation if lyric just changed and in synth mode
    if (activeIdx !== -1 && activeIdx !== this.activeLyricIndex) {
      this.activeLyricIndex = activeIdx;
      if (this.vocalMode === 'synth_reciter' && 'speechSynthesis' in window) {
        this.speakLyric(lyrics[activeIdx].text);
      }
    }

    // Play rhythm steps
    const hits = this.getStepBeat(this.rhythm, this.step);
    hits.forEach((hit) => {
      if (hit === 'dum') this.playDum(now, 1.0);
      else if (hit === 'tak') this.playTak(now, 0.8);
      else if (hit === 'sak') this.playSak(now, 0.6);
      else if (hit === 'clap') this.playClap(now, 0.6);
      else if (hit === 'riq') this.playRiq(now, 0.4);
    });

    // Play occasional musical melody notes
    if (this.step % 2 === 0) {
      const noteIdx = (this.step / 2 + Math.floor(elapsed)) % this.melodyNotes.length;
      const freq = this.melodyNotes[noteIdx];
      this.playMelodyNote(freq, now, stepInterval * 1.8, 0.35);
    }

    if (this.onTimeUpdate) {
      this.onTimeUpdate(elapsed, this.activeLyricIndex, this.step);
    }

    this.step = (this.step + 1) % 16;

    // Schedule next tick
    this.timerId = window.setTimeout(() => {
      this.scheduleLoop(lyrics);
    }, stepInterval * 1000);
  }

  private speakLyric(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    // Find Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find((v) => v.lang.startsWith('ar') || v.name.includes('Arabic'));
    if (arVoice) {
      utter.voice = arVoice;
    }
    utter.rate = 1.05;
    utter.pitch = 1.1; // Slightly higher, singing/recital cadence
    window.speechSynthesis.speak(utter);
    this.speechUtterance = utter;
  }

  public pause() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public stop() {
    this.pause();
    this.step = 0;
    this.activeLyricIndex = -1;
    this.startTime = 0;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const audioEngine = new AudioEngine();
