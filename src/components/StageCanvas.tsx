import React, { useEffect, useRef, useState } from 'react';
import { LyricLine, VisualTheme } from '../types/music';
import { audioEngine } from '../utils/audioEngine';
import stageBgSrc from '../assets/images/concert_stage_night_1791713322220.jpg';

interface StageCanvasProps {
  lyrics: LyricLine[];
  currentTime: number;
  activeLyricIndex: number;
  isPlaying: boolean;
  isRecording: boolean;
  theme: VisualTheme;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  aspectRatio?: '16:9' | '9:16';
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  hue: number;
}

export const StageCanvas: React.FC<StageCanvasProps> = ({
  lyrics,
  currentTime,
  activeLyricIndex,
  isPlaying,
  isRecording,
  theme,
  canvasRef,
}) => {
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  // Particles for stage atmosphere
  const particlesRef = useRef<Particle[]>([]);

  // Beat reaction states
  const beatPulseRef = useRef<number>(0);
  const clapTriggerRef = useRef<number>(0);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = stageBgSrc;
    img.onload = () => {
      bgImageRef.current = img;
      setImageLoaded(true);
    };

    // Initialize 60 floating particles
    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        radius: Math.random() * 3 + 1,
        speedY: -(Math.random() * 0.8 + 0.2),
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.7 + 0.3,
        hue: Math.random() * 40 + 35, // warm gold
      });
    }
    particlesRef.current = particles;

    // Listen to drum hits from audio engine
    const handleBeat = (type: 'dum' | 'tak' | 'clap' | 'riq') => {
      if (type === 'dum') {
        beatPulseRef.current = 1.0;
      } else if (type === 'tak') {
        beatPulseRef.current = Math.max(beatPulseRef.current, 0.6);
      } else if (type === 'clap') {
        clapTriggerRef.current = 1.0;
      }
    };
    audioEngine.onBeatTrigger = handleBeat;

    return () => {
      audioEngine.onBeatTrigger = undefined;
    };
  }, []);

  // Main canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timeAcc = 0;

    const render = () => {
      timeAcc += 0.02;
      const width = canvas.width;
      const height = canvas.height;

      // Decay pulses
      beatPulseRef.current = Math.max(0, beatPulseRef.current - 0.04);
      clapTriggerRef.current = Math.max(0, clapTriggerRef.current - 0.05);

      // 1. Draw Background
      if (bgImageRef.current && imageLoaded) {
        ctx.save();
        ctx.drawImage(bgImageRef.current, 0, 0, width, height);

        // Apply theme color ambiance overlay
        ctx.fillStyle = theme.glowColor;
        ctx.globalAlpha = 0.15 + beatPulseRef.current * 0.12;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      } else {
        // Fallback dark stage gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#09090b');
        bgGrad.addColorStop(0.7, '#18181b');
        bgGrad.addColorStop(1, '#050505');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Dynamic Overhead Moving Spotlights
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const spotlightBeams = [
        { origX: width * 0.2, targetX: width * 0.45 + Math.sin(timeAcc * 1.5) * 120, width: 140 },
        { origX: width * 0.4, targetX: width * 0.5 + Math.sin(timeAcc * 1.2 + 1) * 80, width: 160 },
        { origX: width * 0.6, targetX: width * 0.52 + Math.cos(timeAcc * 1.3) * 90, width: 160 },
        { origX: width * 0.8, targetX: width * 0.55 + Math.cos(timeAcc * 1.6 + 2) * 130, width: 140 },
      ];

      spotlightBeams.forEach((beam, idx) => {
        const spotGrad = ctx.createLinearGradient(beam.origX, 0, beam.targetX, height * 0.75);
        spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        spotGrad.addColorStop(0.4, theme.spotlightColor);
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.moveTo(beam.origX - 20, 0);
        ctx.lineTo(beam.origX + 20, 0);
        ctx.lineTo(beam.targetX + beam.width / 2, height * 0.78);
        ctx.lineTo(beam.targetX - beam.width / 2, height * 0.78);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // 3. Stage Floor Ellipse Glow (Center Stage)
      ctx.save();
      const floorGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.68,
        20,
        width * 0.5,
        height * 0.68,
        240 + beatPulseRef.current * 60
      );
      floorGlow.addColorStop(0, theme.glowColor);
      floorGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
      floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGlow;
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.68, 220 + beatPulseRef.current * 40, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Audio Visualizer Frequency Waves across the lower-mid stage
      const analyser = audioEngine.getAnalyser();
      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.save();
        const barWidth = (width * 0.6) / 32;
        const startX = width * 0.2;
        ctx.fillStyle = theme.primaryColor;
        ctx.globalAlpha = 0.45;

        for (let i = 0; i < 32; i++) {
          const val = dataArray[i * 2] || 0;
          const barHeight = (val / 255) * 55;
          const x = startX + i * barWidth;
          const y = height * 0.66 - barHeight;

          ctx.fillRect(x, y, barWidth - 3, barHeight);
        }
        ctx.restore();
      }

      // 5. Floating Golden Sparks / Stage Mist
      ctx.save();
      particlesRef.current.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < 50) {
          p.y = height * 0.75;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${p.opacity * (0.6 + beatPulseRef.current * 0.4)})`;
        ctx.fill();
      });
      ctx.restore();

      // 6. Animated Cheering Crowd Hands & Clapping Silhouettes
      ctx.save();
      const crowdY = height * 0.92;
      ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';

      // Foreground audience heads & clapping arms
      const crowdHandsCount = 18;
      for (let i = 0; i < crowdHandsCount; i++) {
        const handX = (width / crowdHandsCount) * i + 35;
        // Natural swaying + clap reaction
        const sway = Math.sin(timeAcc * 2 + i) * 6;
        const clapBoost = (clapTriggerRef.current > 0.1 || (i % 2 === 0 && beatPulseRef.current > 0.3)) ? 26 : 0;
        const handY = crowdY - 30 - sway - clapBoost;

        // Draw cheering arm / hand silhouette
        ctx.beginPath();
        ctx.ellipse(handX, handY, 9, 14, (i % 2 === 0 ? 0.2 : -0.2), 0, Math.PI * 2);
        ctx.fill();

        // Phone flashlight dots in audience
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(handX - 4, handY - 8, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
        }
      }
      ctx.restore();

      // 7. Synchronized Karaoke / Lyrics Title & Overlay
      const currentLyric = lyrics[activeLyricIndex];
      if (currentLyric) {
        // Calculate progress within current line
        const elapsedInLine = currentTime - currentLyric.startTime;
        const lineProgress = Math.min(1, Math.max(0, elapsedInLine / currentLyric.duration));

        ctx.save();
        // Lower third backdrop ribbon
        const ribbonY = height * 0.74;
        const ribbonHeight = 84;
        const gradRibbon = ctx.createLinearGradient(0, ribbonY, 0, ribbonY + ribbonHeight);
        gradRibbon.addColorStop(0, 'rgba(5, 5, 8, 0.92)');
        gradRibbon.addColorStop(0.5, 'rgba(15, 15, 25, 0.96)');
        gradRibbon.addColorStop(1, 'rgba(5, 5, 8, 0.92)');

        ctx.fillStyle = gradRibbon;
        ctx.fillRect(width * 0.1, ribbonY, width * 0.8, ribbonHeight);

        // Gold border outline
        ctx.strokeStyle = theme.primaryColor;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(width * 0.1, ribbonY, width * 0.8, ribbonHeight);

        // Active line text
        ctx.font = 'bold 36px "Cairo", "Amiri", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer glow
        ctx.shadowColor = theme.primaryColor;
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(currentLyric.text, width * 0.5, ribbonY + ribbonHeight * 0.44);

        // Progress line underneath the active lyric
        ctx.shadowBlur = 0;
        const barStartX = width * 0.2;
        const barMaxWidth = width * 0.6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(barStartX, ribbonY + ribbonHeight - 10, barMaxWidth, 4);

        ctx.fillStyle = theme.primaryColor;
        ctx.fillRect(barStartX, ribbonY + ribbonHeight - 10, barMaxWidth * lineProgress, 4);

        // Next lyric preview hint
        const nextLyric = lyrics[activeLyricIndex + 1];
        if (nextLyric) {
          ctx.font = '500 18px "Cairo", sans-serif';
          ctx.fillStyle = 'rgba(220, 220, 230, 0.65)';
          ctx.fillText(`التالي: ${nextLyric.text}`, width * 0.5, ribbonY - 18);
        }

        ctx.restore();
      } else {
        // Welcome / Intro Title Banner
        ctx.save();
        ctx.font = 'bold 32px "Cairo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = theme.primaryColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('كليب: طلال جالس تحت الشجرة', width * 0.5, height * 0.78);

        ctx.font = '500 18px "Cairo", sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText('اضغط تشغيل لبدء الأغنية والعرض المتزامن', width * 0.5, height * 0.84);
        ctx.restore();
      }

      // 8. Watermark & Status Badges (Top Left & Top Right)
      ctx.save();
      // Right header: Song Title
      ctx.font = 'bold 20px "Cairo", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('🎵 كليب: طلال تحت الشجرة', width - 36, 42);

      ctx.font = '500 14px "Cairo", sans-serif';
      ctx.fillStyle = theme.primaryColor;
      ctx.fillText(`اللحن والإيقاع الشرقي · ${Math.floor(currentTime)} ثانية`, width - 36, 68);

      // Left header: REC indicator when recording
      if (isRecording) {
        ctx.textAlign = 'left';
        const blink = Math.floor(timeAcc * 4) % 2 === 0;
        ctx.beginPath();
        ctx.arc(42, 40, 7, 0, Math.PI * 2);
        ctx.fillStyle = blink ? '#EF4444' : '#7F1D1D';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.font = 'bold 16px "Cairo", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.fillText('جاري تسجيل الفيديو (REC)', 58, 45);
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [lyrics, currentTime, activeLyricIndex, isPlaying, isRecording, theme, imageLoaded]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl group">
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        width={1280}
        height={720}
        className="w-full h-auto aspect-video block object-cover"
      />
    </div>
  );
};
