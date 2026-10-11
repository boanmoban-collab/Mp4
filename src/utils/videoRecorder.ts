/**
 * Video Recording & Direct MP4/WebM Export Engine
 * Records the animated Canvas and synchronized Web Audio mix in real-time,
 * generating a direct downloadable video file.
 */

export interface RecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  extension: 'mp4' | 'webm';
  sizeBytes: number;
  durationSeconds: number;
}

class VideoRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private startTime: number = 0;
  private timerInterval: number | null = null;

  public onProgress?: (elapsedSeconds: number) => void;
  public onFinished?: (result: RecordingResult) => void;
  public onError?: (error: Error) => void;

  public startRecording(canvas: HTMLCanvasElement, audioStream: MediaStream | null): boolean {
    if (this.isRecording) return false;

    try {
      this.recordedChunks = [];
      const canvasStream = canvas.captureStream(30); // 30 FPS high-quality capture
      const combinedStream = new MediaStream();

      // Add video tracks
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

      // Add audio tracks if available
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }

      // Determine supported mime type
      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      if (!selectedMime) {
        selectedMime = 'video/webm'; // fallback
      }

      const options: MediaRecorderOptions = {
        mimeType: selectedMime,
        videoBitsPerSecond: 2500000, // 2.5 Mbps crisp video
      };

      this.mediaRecorder = new MediaRecorder(combinedStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const extension = selectedMime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(this.recordedChunks, { type: selectedMime });
        const url = URL.createObjectURL(blob);

        if (this.timerInterval !== null) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        this.isRecording = false;

        if (this.onFinished) {
          this.onFinished({
            blob,
            url,
            mimeType: selectedMime,
            extension,
            sizeBytes: blob.size,
            durationSeconds: Math.round(duration),
          });
        }
      };

      this.startTime = Date.now();
      this.isRecording = true;
      this.mediaRecorder.start(200); // 200ms slice for fluid streaming

      this.timerInterval = window.setInterval(() => {
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (this.onProgress) {
          this.onProgress(elapsed);
        }
      }, 500);

      return true;
    } catch (err) {
      console.error('Error starting video recording:', err);
      if (this.onError) {
        this.onError(err instanceof Error ? err : new Error(String(err)));
      }
      return false;
    }
  }

  public stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRecording = false;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public downloadVideo(url: string, filename: string = 'talal_music_video_clip.mp4') {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const videoRecorder = new VideoRecorderService();
