import React from 'react';
import { RhythmPattern, VisualTheme, VocalMode } from '../types/music';
import { RHYTHM_OPTIONS, VISUAL_THEMES } from '../constants/initialData';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sliders,
  Sparkles,
  Mic,
  VolumeX,
  Radio,
  Flame,
} from 'lucide-react';

interface StudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  bpm: number;
  rhythm: RhythmPattern;
  vocalMode: VocalMode;
  theme: VisualTheme;
  volume: number;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSeek: (seconds: number) => void;
  onChangeBpm: (bpm: number) => void;
  onChangeRhythm: (rhythm: RhythmPattern) => void;
  onChangeVocalMode: (mode: VocalMode) => void;
  onChangeTheme: (theme: VisualTheme) => void;
  onChangeVolume: (volume: number) => void;
}

export const StudioControls: React.FC<StudioControlsProps> = ({
  isPlaying,
  currentTime,
  totalDuration,
  bpm,
  rhythm,
  vocalMode,
  theme,
  volume,
  onTogglePlay,
  onRestart,
  onSeek,
  onChangeBpm,
  onChangeRhythm,
  onChangeVocalMode,
  onChangeTheme,
  onChangeVolume,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-6">
      {/* 1. Main Transport Controls & Timeline Scrubber */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span className="text-neutral-500 font-sans text-xs">
            {isPlaying ? 'جاري العرض الموسيقي 🎶' : 'جاهز للتشغيل'}
          </span>
          <span>{formatTime(totalDuration)}</span>
        </div>

        {/* Timeline Slider */}
        <input
          type="range"
          min={0}
          max={totalDuration}
          step={0.5}
          value={Math.min(currentTime, totalDuration)}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
        />

        {/* Playback action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>إيقاف مؤقت</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>تشغيل الكليب</span>
                </>
              )}
            </button>

            <button
              onClick={onRestart}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="إعادة الكليب من البداية"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2.5 bg-neutral-950/60 border border-neutral-800/80 px-3.5 py-2 rounded-xl">
            <Volume2 className="w-4 h-4 text-neutral-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="w-20 md:w-28 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Rhythm Pattern Selector */}
      <div className="space-y-2 pt-2 border-t border-neutral-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>نوع الإيقاع الشرقي والدربكة</span>
          </span>
          <span className="text-neutral-500">{RHYTHM_OPTIONS.find((r) => r.id === rhythm)?.desc}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {RHYTHM_OPTIONS.map((opt) => {
            const isSelected = opt.id === rhythm;
            return (
              <button
                key={opt.id}
                onClick={() => onChangeRhythm(opt.id)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : 'bg-neutral-950/50 text-neutral-400 border border-neutral-800/80 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <span>{opt.name}</span>
                <span className="text-[10px] text-neutral-500">{opt.bpm} BPM</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tempo (BPM) Slider */}
      <div className="space-y-2 pt-2 border-t border-neutral-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-200 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>سرعة الإيقاع (التمبو / BPM)</span>
          </span>
          <span className="font-mono text-amber-400 font-bold">{bpm} ضربة/دقيقة</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={70}
            max={150}
            value={bpm}
            onChange={(e) => onChangeBpm(parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex gap-1.5">
            {[90, 108, 124, 136].map((b) => (
              <button
                key={b}
                onClick={() => onChangeBpm(b)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                  bpm === b
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Visual Stage Theme & Lighting */}
      <div className="space-y-2 pt-2 border-t border-neutral-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>نمط إضاءة المسرح والفيديو</span>
          </span>
          <span className="text-neutral-500">{theme.name}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VISUAL_THEMES.map((th) => {
            const isSelected = th.id === theme.id;
            return (
              <button
                key={th.id}
                onClick={() => onChangeTheme(th)}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-neutral-800 border-neutral-600 text-neutral-100 shadow-sm'
                    : 'bg-neutral-950/50 border-neutral-800/70 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: th.primaryColor }}
                />
                <span className="truncate">{th.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Vocal & Audio Performance Mode */}
      <div className="space-y-2 pt-2 border-t border-neutral-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-200 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span>نمط الأداء الصوتي</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => onChangeVocalMode('synth_reciter')}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
              vocalMode === 'synth_reciter'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-neutral-950/50 text-neutral-400 border-neutral-800/80 hover:text-neutral-200'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-right">
              <div className="font-bold">تلاوة لحنية آلية</div>
              <div className="text-[10px] text-neutral-500">نطق الكلمات مع الإيقاع</div>
            </div>
          </button>

          <button
            onClick={() => onChangeVocalMode('mic_record')}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
              vocalMode === 'mic_record'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-neutral-950/50 text-neutral-400 border-neutral-800/80 hover:text-neutral-200'
            }`}
          >
            <Mic className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-right">
              <div className="font-bold">غناء مباشر بالمايكروفون</div>
              <div className="text-[10px] text-neutral-500">مع صدى ومؤثرات صوتية</div>
            </div>
          </button>

          <button
            onClick={() => onChangeVocalMode('instrumental')}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
              vocalMode === 'instrumental'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-neutral-950/50 text-neutral-400 border-neutral-800/80 hover:text-neutral-200'
            }`}
          >
            <VolumeX className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-right">
              <div className="font-bold">كاريوكي موسيقي فقط</div>
              <div className="text-[10px] text-neutral-500">إيقاع ولحن نقي</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
