import React, { useState } from 'react';
import { videoRecorder, RecordingResult } from '../utils/videoRecorder';
import { audioEngine } from '../utils/audioEngine';
import {
  Video,
  Download,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface VideoExporterProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  totalDuration: number;
  onRecordingStateChange: (isRecording: boolean) => void;
  onStartPlayback: () => void;
  onStopPlayback: () => void;
}

export const VideoExporter: React.FC<VideoExporterProps> = ({
  canvasRef,
  totalDuration,
  onRecordingStateChange,
  onStartPlayback,
  onStopPlayback,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startExportRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setErrorMsg('لوحة الفيديو غير متوفرة حالياً.');
      return;
    }

    setErrorMsg(null);
    setResult(null);
    setRecordedSeconds(0);

    const audioStream = audioEngine.getMediaStream();

    videoRecorder.onProgress = (elapsed) => {
      setRecordedSeconds(elapsed);
      if (elapsed >= totalDuration) {
        stopExportRecording();
      }
    };

    videoRecorder.onFinished = (res) => {
      setResult(res);
      setIsRecording(false);
      onRecordingStateChange(false);
      onStopPlayback();
    };

    videoRecorder.onError = (err) => {
      setErrorMsg(`حدث خطأ أثناء التسجيل: ${err.message}`);
      setIsRecording(false);
      onRecordingStateChange(false);
      onStopPlayback();
    };

    // Start playback and recording synchronously
    onStartPlayback();
    const success = videoRecorder.startRecording(canvas, audioStream);
    if (success) {
      setIsRecording(true);
      onRecordingStateChange(true);
    } else {
      setErrorMsg('تعذر بدء مسجل الفيديو في المتصفح.');
      onStopPlayback();
    }
  };

  const stopExportRecording = () => {
    videoRecorder.stopRecording();
  };

  const handleDownload = () => {
    if (!result) return;
    const filename = `talal_music_video_clip_${Date.now()}.${result.extension}`;
    videoRecorder.downloadVideo(result.url, filename);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-100">
              تصدير وتنزيل الفيديو كليب (MP4 / WebM)
            </h3>
            <p className="text-xs text-neutral-400">
              تسجيل حي بجودة HD 720p مع اللحن المدمج ورابط تحميل مباشر
            </p>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>جاري البناء والتسجيل: {Math.floor(recordedSeconds)} ثانية</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Recording in Progress UI */}
      {isRecording && (
        <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span>التقدم في بناء الفيديو كليب:</span>
            <span className="font-mono text-amber-400 font-bold">
              {Math.min(100, Math.round((recordedSeconds / totalDuration) * 100))}%
            </span>
          </div>

          <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (recordedSeconds / totalDuration) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-neutral-400">
              يتم التقاط الشاشة والموسيقى والأشعار المتزامنة بدقة عالية...
            </span>
            <button
              onClick={stopExportRecording}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              إنهاء وحفظ الآن
            </button>
          </div>
        </div>
      )}

      {/* Finished Result & Direct Download */}
      {result && !isRecording && (
        <div className="p-5 rounded-xl bg-gradient-to-b from-emerald-950/30 to-neutral-950/60 border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-neutral-100">
                اكتمل بناء وتوليد الفيديو كليب بنجاح!
              </h4>
              <p className="text-xs text-neutral-400">
                الملف جاهز للتشغيل وللتحميل المباشر بصيغة {result.extension.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Video Preview Player */}
          <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black aspect-video max-h-60 mx-auto">
            <video
              src={result.url}
              controls
              className="w-full h-full object-contain"
            />
          </div>

          {/* Meta specs */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-500 block text-[11px]">الامتداد</span>
              <span className="font-bold text-neutral-200 uppercase">{result.extension}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-500 block text-[11px]">المدة</span>
              <span className="font-bold text-neutral-200">{result.durationSeconds} ثانية</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-500 block text-[11px]">الحجم</span>
              <span className="font-bold text-neutral-200">{formatFileSize(result.sizeBytes)}</span>
            </div>
          </div>

          {/* Direct Download Button */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>تحميل فيديو كليب {result.extension.toUpperCase()} مباشرة</span>
            </button>

            <button
              onClick={startExportRecording}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تسجيل جديد</span>
            </button>
          </div>
        </div>
      )}

      {/* Initial state trigger */}
      {!isRecording && !result && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
          <div className="flex items-center gap-3">
            <FileVideo className="w-8 h-8 text-amber-400/80 shrink-0" />
            <div className="text-xs text-neutral-300">
              <div className="font-bold text-neutral-100 text-sm">
                توليد ملف فيديو MP4 كامل للأغنية
              </div>
              <div className="text-neutral-400 text-[11px]">
                يسجل كامل المؤثرات البصرية وتفاعل المسرح مع الكلمات المتزامنة
              </div>
            </div>
          </div>

          <button
            onClick={startExportRecording}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 active:scale-95 transition-all shrink-0"
          >
            <Video className="w-4 h-4" />
            <span>بدء بناء وتصدير الفيديو</span>
          </button>
        </div>
      )}
    </div>
  );
};
