/**
 * Enhanced Arabic Musical & Rhythm Engine
 * Features rich oriental melodic synthesis (Oud / Nay / Oriental Violin simulation),
 * harmonic bass drone, authentic multi-layered percussion (Darbuka Dum & Tak, Riq, Audience Claps),
 * synchronized vocal speech recitation, and direct audio stream capture for MP4 video export.
 */

import { RhythmPattern, LyricLine, VocalMode } from '../types/music';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private melodyGain: GainNode | null = null;
  private drumGain: GainNode | null = null;
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
  private activeLyricIndex: number = -1;

  public onTimeUpdate?: (time: number, lyricIndex: number, beat: number) => void;
  public onBeatTrigger?: (type: 'dum' | 'tak' | 'clap' | 'riq') => void;

  public init() {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;

    this.melodyGain = this.ctx.createGain();
    this.melodyGain.gain.value = 0.75;
    this.melodyGain.connect(this.masterGain);

    this.drumGain = this.ctx.createGain();
    this.drumGain.gain.value = 0.85;
    this.drumGain.connect(this.masterGain);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

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

      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.16;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.35;

      this.micSource.connect(this.micGain);
      this.micGain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);

      this.micGain.connect(this.masterGain);
      delay.connect(this.masterGain);

      return true;
    } catch (e) {
      console.warn('Microphone access warning:', e);
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
    if (!this.ctx || !this.drumGain) return;

    // Resonant low-frequency drum hit
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(80, time);
    subOsc.frequency.exponentialRampToValueAtTime(38, time + 0.22);

    gain.gain.setValueAtTime(1.15 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + 0.39);
    subOsc.stop(time + 0.39);

    if (this.onBeatTrigger) this.onBeatTrigger('dum');
  }

  private playTak(time: number, velocity: number = 0.85) {
    if (!this.ctx || !this.drumGain) return;

    // High crisp metal/ceramic snap
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.06);

    oscGain.gain.setValueAtTime(0.8 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.drumGain);
    osc.start(time);
    osc.stop(time + 0.09);

    this.playNoiseBurst(time, 0.045, 2200, 0.6 * velocity);

    if (this.onBeatTrigger) this.onBeatTrigger('tak');
  }

  private playSak(time: number, velocity: number = 0.6) {
    if (!this.ctx || !this.drumGain) return;
    this.playNoiseBurst(time, 0.035, 3400, 0.45 * velocity);
    if (this.onBeatTrigger) this.onBeatTrigger('tak');
  }

  private playClap(time: number, velocity: number = 0.75) {
    if (!this.ctx || !this.drumGain) return;
    // Layered clapping bursts simulating hall audience
    this.playNoiseBurst(time, 0.02, 1100, 0.35 * velocity);
    this.playNoiseBurst(time + 0.012, 0.025, 1250, 0.45 * velocity);
    this.playNoiseBurst(time + 0.028, 0.08, 1050, 0.65 * velocity);

    if (this.onBeatTrigger) this.onBeatTrigger('clap');
  }

  private playRiq(time: number, velocity: number = 0.5) {
    if (!this.ctx || !this.drumGain) return;
    this.playNoiseBurst(time, 0.09, 6500, 0.35 * velocity);
    if (this.onBeatTrigger) this.onBeatTrigger('riq');
  }

  private playNoiseBurst(time: number, duration: number, cutoff: number, level: number) {
    if (!this.ctx || !this.drumGain) return;
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
    filter.Q.value = 2.4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    whiteNoise.start(time);
  }

  /* Rich Polyphonic Oriental Melodic Synthesis (Oud / Violin / Nay) */
  private playOrientalMelody(freq: number, time: number, duration: number, isAccent: boolean = false) {
    if (!this.ctx || !this.melodyGain) return;

    // Dual oscillator with subtle chorus & vibrato
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    // Lead timbre (sawtooth + triangle with warm lowpass)
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    // Slight microtonal detune for organic acoustic warmth
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.003, time);

    // Warm filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isAccent ? 2200 : 1600, time);
    filter.frequency.exponentialRampToValueAtTime(650, time + duration);

    // Soft attack, expressive decay
    noteGain.gain.setValueAtTime(0.001, time);
    noteGain.gain.linearRampToValueAtTime(isAccent ? 0.45 : 0.32, time + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.melodyGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  // Harmonic Drone Bass note for Arabic Maqam anchor
  private playDroneBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.melodyGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.5, time); // Sub-octave

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.melodyGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Melodic Arabic Scales: Bayati & Hijaz phrases (in Hz)
  private melodyPhrase = [
    // Phrase A: Intro theme
    293.66, 329.63, 349.23, 392.0, 440.0, 392.0, 349.23, 293.66,
    // Phrase B: Climactic rise
    392.0, 440.0, 493.88, 523.25, 587.33, 523.25, 466.16, 440.0,
    // Phrase C: Playful resolving riff
    440.0, 392.0, 349.23, 329.63, 311.13, 293.66, 349.23, 293.66,
  ];

  /* 16-Step Arabic Drum Patterns */
  private getStepBeat(pattern: RhythmPattern, step: number): ('dum' | 'tak' | 'sak' | 'clap' | 'riq' | null)[] {
    const hits: ('dum' | 'tak' | 'sak' | 'clap' | 'riq' | null)[] = [];

    switch (pattern) {
      case 'malfuf':
        if (step % 8 === 0) hits.push('dum');
        if (step % 8 === 3) hits.push('tak');
        if (step % 8 === 6) hits.push('tak');
        if (step % 4 === 2) hits.push('riq');
        if (step % 8 === 7) hits.push('clap');
        break;

      case 'maqsum':
        if (step === 0 || step === 10) hits.push('dum');
        if (step === 2 || step === 5 || step === 12) hits.push('tak');
        if (step === 7 || step === 14) hits.push('riq');
        if (step === 4 || step === 12) hits.push('clap');
        break;

      case 'saidi':
        if (step === 0 || step === 6 || step === 8) hits.push('dum');
        if (step === 2 || step === 12) hits.push('tak');
        if (step === 4 || step === 10 || step === 14) hits.push('riq');
        if (step === 4 || step === 12) hits.push('clap');
        break;

      case 'baladi':
        if (step === 0 || step === 2 || step === 8) hits.push('dum');
        if (step === 5 || step === 12) hits.push('tak');
        if (step === 7 || step === 14) hits.push('riq');
        if (step === 4 || step === 12) hits.push('clap');
        break;

      case 'dance_pop':
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
    this.step = Math.floor((fromTime / (60 / this.currentBpm / 4))) % 16;
    this.activeLyricIndex = -1;

    this.scheduleLoop(lyrics);
  }

  private scheduleLoop(lyrics: LyricLine[]) {
    if (!this.isRunning || !this.ctx) return;

    const stepInterval = 60 / this.currentBpm / 4;
    const now = this.ctx.currentTime;
    const elapsed = now - this.startTime;

    // Check active lyric line
    let activeIdx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      const l = lyrics[i];
      if (elapsed >= l.startTime && elapsed < l.startTime + l.duration) {
        activeIdx = i;
        break;
      }
    }

    if (activeIdx !== -1 && activeIdx !== this.activeLyricIndex) {
      this.activeLyricIndex = activeIdx;
      if (this.vocalMode === 'synth_reciter' && 'speechSynthesis' in window) {
        this.speakLyric(lyrics[activeIdx].text);
      }
    }

    // Play drum hits
    const hits = this.getStepBeat(this.rhythm, this.step);
    hits.forEach((hit) => {
      if (hit === 'dum') this.playDum(now, 1.0);
      else if (hit === 'tak') this.playTak(now, 0.85);
      else if (hit === 'sak') this.playSak(now, 0.6);
      else if (hit === 'clap') this.playClap(now, 0.7);
      else if (hit === 'riq') this.playRiq(now, 0.45);
    });

    // Play Oriental Melody notes on 16th/8th steps
    if (this.step % 2 === 0) {
      const noteIdx = (Math.floor(this.step / 2) + Math.floor(elapsed * 2)) % this.melodyPhrase.length;
      const freq = this.melodyPhrase[noteIdx];
      const isAccent = this.step === 0 || this.step === 8;
      this.playOrientalMelody(freq, now, stepInterval * 2.2, isAccent);

      // Play bass drone at bar start
      if (this.step === 0) {
        this.playDroneBass(293.66, now, stepInterval * 8);
      }
    }

    if (this.onTimeUpdate) {
      this.onTimeUpdate(elapsed, this.activeLyricIndex, this.step);
    }

    this.step = (this.step + 1) % 16;

    this.timerId = window.setTimeout(() => {
      this.scheduleLoop(lyrics);
    }, stepInterval * 1000);
  }

  private speakLyric(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find((v) => v.lang.startsWith('ar') || v.name.includes('Arabic'));
    if (arVoice) {
      utter.voice = arVoice;
    }
    utter.rate = 1.08;
    utter.pitch = 1.15;
    window.speechSynthesis.speak(utter);
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
