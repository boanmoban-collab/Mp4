import React, { useState, useEffect, useRef } from 'react';
import { LyricLine, RhythmPattern, VisualTheme, VocalMode } from './types/music';
import { DEFAULT_LYRICS, VISUAL_THEMES } from './constants/initialData';
import { audioEngine } from './utils/audioEngine';
import { StageCanvas } from './components/StageCanvas';
import { StudioControls } from './components/StudioControls';
import { LyricsManager } from './components/LyricsManager';
import { VideoExporter } from './components/VideoExporter';
import {
  Music,
  Share2,
  Info,
  ExternalLink,
  Sparkles,
  HelpCircle,
  X,
  Volume2,
} from 'lucide-react';

export default function App() {
  const [lyrics, setLyrics] = useState<LyricLine[]>(DEFAULT_LYRICS);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(108);
  const [rhythm, setRhythm] = useState<RhythmPattern>('maqsum');
  const [vocalMode, setVocalMode] = useState<VocalMode>('synth_reciter');
  const [theme, setTheme] = useState<VisualTheme>(VISUAL_THEMES[0]);
  const [volume, setVolume] = useState<number>(0.85);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Total song duration based on lyrics
  const lastLyric = lyrics[lyrics.length - 1];
  const totalDuration = lastLyric ? lastLyric.startTime + lastLyric.duration : 36;

  // Set up audio engine callbacks
  useEffect(() => {
    audioEngine.onTimeUpdate = (time, lyricIdx) => {
      setCurrentTime(time);
      setActiveLyricIndex(lyricIdx);
      if (time >= totalDuration + 2) {
        handlePause();
        setCurrentTime(0);
        setActiveLyricIndex(-1);
      }
    };

    return () => {
      audioEngine.stop();
    };
  }, [totalDuration]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay(currentTime);
    }
  };

  const handlePlay = (fromTime: number = 0) => {
    audioEngine.setBpm(bpm);
    audioEngine.setRhythm(rhythm);
    audioEngine.setVocalMode(vocalMode);
    audioEngine.setMasterVolume(volume);
    audioEngine.start(lyrics, fromTime);
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioEngine.pause();
    setIsPlaying(false);
  };

  const handleRestart = () => {
    audioEngine.stop();
    setCurrentTime(0);
    setActiveLyricIndex(-1);
    if (isPlaying) {
      handlePlay(0);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (isPlaying) {
      audioEngine.pause();
      handlePlay(seconds);
    }
  };

  const handleSelectLyric = (index: number) => {
    const target = lyrics[index];
    if (target) {
      handleSeek(target.startTime);
    }
  };

  const handleChangeBpm = (newBpm: number) => {
    setBpm(newBpm);
    audioEngine.setBpm(newBpm);
  };

  const handleChangeRhythm = (newRhythm: RhythmPattern) => {
    setRhythm(newRhythm);
    audioEngine.setRhythm(newRhythm);
  };

  const handleChangeVocalMode = async (newMode: VocalMode) => {
    setVocalMode(newMode);
    audioEngine.setVocalMode(newMode);
    if (newMode === 'mic_record') {
      await audioEngine.enableMicrophone();
    } else {
      audioEngine.disableMicrophone();
    }
  };

  const handleChangeTheme = (newTheme: VisualTheme) => {
    setTheme(newTheme);
  };

  const handleChangeVolume = (val: number) => {
    setVolume(val);
    audioEngine.setMasterVolume(val);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20">
              <Music className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                <span>استوديو كليب طلال</span>
                <span className="text-xs font-normal text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  إصدار الفيديو MP4
                </span>
              </h1>
              <p className="text-xs text-neutral-400 hidden sm:block">
                تصميم وبناء فيديو كليب متزامن مع لحن شرقي وكلمات كاريوكي حية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>دليل الاستخدام والـ MP4</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stage Video Display (Centerpiece) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>شاشة المسرح الغنائي والعرض الحي (1280 × 720 HD)</span>
            </span>
            <span className="text-neutral-500">
              {isPlaying ? 'المسرح يتفاعل مع ضربات الإيقاع والتصفيق' : 'اضغط تشغيل أو بدء التصدير'}
            </span>
          </div>

          <StageCanvas
            lyrics={lyrics}
            currentTime={currentTime}
            activeLyricIndex={activeLyricIndex}
            isPlaying={isPlaying}
            isRecording={isRecording}
            theme={theme}
            canvasRef={canvasRef}
          />
        </div>

        {/* Video Exporter Module */}
        <VideoExporter
          canvasRef={canvasRef}
          totalDuration={totalDuration}
          onRecordingStateChange={(rec) => setIsRecording(rec)}
          onStartPlayback={() => handlePlay(0)}
          onStopPlayback={() => handlePause()}
        />

        {/* Lower Grid: Studio Controls (Left) & Lyrics Manager (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <StudioControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              totalDuration={totalDuration}
              bpm={bpm}
              rhythm={rhythm}
              vocalMode={vocalMode}
              theme={theme}
              volume={volume}
              onTogglePlay={handleTogglePlay}
              onRestart={handleRestart}
              onSeek={handleSeek}
              onChangeBpm={handleChangeBpm}
              onChangeRhythm={handleChangeRhythm}
              onChangeVocalMode={handleChangeVocalMode}
              onChangeTheme={handleChangeTheme}
              onChangeVolume={handleChangeVolume}
            />
          </div>

          {/* Lyrics & Karaoke Column (5 cols) */}
          <div className="lg:col-span-5">
            <LyricsManager
              lyrics={lyrics}
              activeLyricIndex={activeLyricIndex}
              onSelectLyric={handleSelectLyric}
              onUpdateLyrics={(newLines) => setLyrics(newLines)}
            />
          </div>
        </div>
      </main>

      {/* Info & Guide Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-right">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-100">
                  دليل إنتاج وتنزيل الفيديو كليب
                </h3>
                <p className="text-xs text-neutral-400">
                  كيف يعمل الاستوديو وتوليد ملف MP4 المباشر
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <strong className="text-amber-400 block mb-1">
                  1. تسجيل الفيديو كليب وتنزيله (MP4 / WebM):
                </strong>
                عند النقر على زر <span className="text-red-400 font-bold">"بدء بناء وتصدير الفيديو"</span>،
                يقوم التطبيق بتسجيل المسرح وأضواء الحفلة وحركات الجمهور والكلمات المتزامنة مع الصوت عالي الدقة.
                وبمجرد انتهاء الأغنية يظهر لك فوراً زر تحميل الفيديو المباشر لجهازك بصيغة MP4 أو WebM.
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <strong className="text-amber-400 block mb-1">2. الإيقاعات واللحن الشرقي:</strong>
                تمت برمجة محرك إيقاعات شرقية حي عبر Web Audio API يولد أصوات الدربكة (الدوم والتاك)،
                والدف، والرق، وتصفيق الجمهور، مع إمكانية التنقل بين مقسوم، ملفوف، صعيدي، وبلدي.
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <strong className="text-amber-400 block mb-1">
                  3. الغناء والتلاوة المتزامنة:
                </strong>
                يمكنك التبديل بين التلاوة الآلية، أو تشغيل المايكروفون لتغني بصوتك مع صدى ومؤثرات صوتية، أو وضع الموسيقى فقط.
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors"
            >
              فهمت، لنبدأ الإبداع!
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-4 text-center text-xs text-neutral-500">
        استوديو كليب طلال جالس تحت الشجرة · إنتاج وتصدير فيديو كليب تفاعلي متكامل
      </footer>
    </div>
  );
}
