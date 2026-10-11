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

interface MusicNoteParticle {
  x: number;
  y: number;
  symbol: string;
  speedY: number;
  speedX: number;
  opacity: number;
  size: number;
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

  const particlesRef = useRef<Particle[]>([]);
  const musicNotesRef = useRef<MusicNoteParticle[]>([]);

  // Beat reaction states
  const beatPulseRef = useRef<number>(0);
  const clapTriggerRef = useRef<number>(0);
  const takTriggerRef = useRef<number>(0);

  useEffect(() => {
    const img = new Image();
    img.src = stageBgSrc;
    img.onload = () => {
      bgImageRef.current = img;
      setImageLoaded(true);
    };

    // Initialize floating stage particles
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        radius: Math.random() * 2.5 + 1,
        speedY: -(Math.random() * 0.7 + 0.2),
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.6 + 0.3,
        hue: Math.random() * 40 + 35,
      });
    }
    particlesRef.current = particles;

    // Initialize floating musical notes
    const symbols = ['♪', '♫', '♩', '♬'];
    const notes: MusicNoteParticle[] = [];
    for (let i = 0; i < 12; i++) {
      notes.push({
        x: 640 + (Math.random() - 0.5) * 300,
        y: 400 + Math.random() * 200,
        symbol: symbols[i % symbols.length],
        speedY: -(Math.random() * 1.0 + 0.5),
        speedX: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.8 + 0.2,
        size: Math.random() * 10 + 16,
      });
    }
    musicNotesRef.current = notes;

    const handleBeat = (type: 'dum' | 'tak' | 'clap' | 'riq') => {
      if (type === 'dum') {
        beatPulseRef.current = 1.0;
      } else if (type === 'tak') {
        takTriggerRef.current = 0.8;
      } else if (type === 'clap') {
        clapTriggerRef.current = 1.0;
      }
    };
    audioEngine.onBeatTrigger = handleBeat;

    return () => {
      audioEngine.onBeatTrigger = undefined;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timeAcc = 0;

    const render = () => {
      timeAcc += 0.025;
      const width = canvas.width;
      const height = canvas.height;

      // Decay triggers smoothly
      beatPulseRef.current = Math.max(0, beatPulseRef.current - 0.04);
      clapTriggerRef.current = Math.max(0, clapTriggerRef.current - 0.05);
      takTriggerRef.current = Math.max(0, takTriggerRef.current - 0.04);

      // 1. Draw Base Concert Stage
      if (bgImageRef.current && imageLoaded) {
        ctx.save();
        ctx.drawImage(bgImageRef.current, 0, 0, width, height);

        // Dynamic colored ambiance wash
        ctx.fillStyle = theme.glowColor;
        ctx.globalAlpha = 0.12 + beatPulseRef.current * 0.14;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      } else {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Dynamic Overhead Moving Spotlights
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const spotlightBeams = [
        { origX: width * 0.22, targetX: width * 0.47 + Math.sin(timeAcc * 1.8) * 140, width: 150 },
        { origX: width * 0.38, targetX: width * 0.5 + Math.sin(timeAcc * 1.4 + 1) * 90, width: 170 },
        { origX: width * 0.62, targetX: width * 0.5 + Math.cos(timeAcc * 1.5 + 2) * 100, width: 170 },
        { origX: width * 0.78, targetX: width * 0.53 + Math.cos(timeAcc * 1.9) * 150, width: 150 },
      ];

      spotlightBeams.forEach((beam) => {
        const spotGrad = ctx.createLinearGradient(beam.origX, 0, beam.targetX, height * 0.74);
        spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        spotGrad.addColorStop(0.35, theme.spotlightColor);
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.moveTo(beam.origX - 18, 0);
        ctx.lineTo(beam.origX + 18, 0);
        ctx.lineTo(beam.targetX + beam.width / 2, height * 0.75);
        ctx.lineTo(beam.targetX - beam.width / 2, height * 0.75);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // 3. Center Stage Glowing Floor Pod & Visualizer Waves
      ctx.save();
      const floorGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.67,
        15,
        width * 0.5,
        height * 0.67,
        220 + beatPulseRef.current * 70
      );
      floorGlow.addColorStop(0, theme.glowColor);
      floorGlow.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
      floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGlow;
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.67, 240 + beatPulseRef.current * 50, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Audio Frequency Spectrum along the stage back
      const analyser = audioEngine.getAnalyser();
      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.save();
        const barCount = 36;
        const barWidth = (width * 0.64) / barCount;
        const startX = width * 0.18;
        ctx.fillStyle = theme.primaryColor;
        ctx.globalAlpha = 0.4;

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * 2] || 0;
          const barH = (val / 255) * 60;
          const x = startX + i * barWidth;
          const y = height * 0.65 - barH;
          ctx.fillRect(x, y, barWidth - 4, barH);
        }
        ctx.restore();
      }

      // 4. Detailed Animated Singer Figure (حركة المغنية على خشبة المسرح)
      ctx.save();
      const singerCenterX = width * 0.5;
      const singerBaseY = height * 0.67;

      // Realistic rhythmic torso sway & footwork
      const swayTorso = Math.sin(timeAcc * 3.0) * 8;
      const headTilt = Math.sin(timeAcc * 3.0) * 0.08;
      const breathBounce = Math.abs(Math.sin(timeAcc * 6.0)) * (isPlaying ? 4 : 1);
      const isSinging = isPlaying && activeLyricIndex !== -1;

      // Shadow on floor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.ellipse(singerCenterX + swayTorso * 0.5, singerBaseY, 45, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flowing evening gown (modest elegant gown)
      const gownGrad = ctx.createLinearGradient(
        singerCenterX,
        singerBaseY - 180,
        singerCenterX,
        singerBaseY
      );
      gownGrad.addColorStop(0, '#581c87'); // Rich velvet purple / maroon
      gownGrad.addColorStop(0.5, '#7e22ce');
      gownGrad.addColorStop(1, '#3b0764');

      ctx.fillStyle = gownGrad;
      ctx.beginPath();
      ctx.moveTo(singerCenterX - 18 + swayTorso, singerBaseY - 140 - breathBounce);
      ctx.quadraticCurveTo(
        singerCenterX - 28 + swayTorso * 0.6,
        singerBaseY - 70,
        singerCenterX - 55 + swayTorso * 0.3,
        singerBaseY
      );
      ctx.lineTo(singerCenterX + 55 + swayTorso * 0.3, singerBaseY);
      ctx.quadraticCurveTo(
        singerCenterX + 28 + swayTorso * 0.6,
        singerBaseY - 70,
        singerCenterX + 18 + swayTorso,
        singerBaseY - 140 - breathBounce
      );
      ctx.closePath();
      ctx.fill();

      // Torso / Bodice
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.moveTo(singerCenterX - 18 + swayTorso, singerBaseY - 140 - breathBounce);
      ctx.lineTo(singerCenterX - 14 + swayTorso * 1.1, singerBaseY - 200 - breathBounce);
      ctx.lineTo(singerCenterX + 14 + swayTorso * 1.1, singerBaseY - 200 - breathBounce);
      ctx.lineTo(singerCenterX + 18 + swayTorso, singerBaseY - 140 - breathBounce);
      ctx.closePath();
      ctx.fill();

      // Head & Neck with tilt
      const neckX = singerCenterX + swayTorso * 1.15;
      const neckY = singerBaseY - 205 - breathBounce;

      // Neck
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(neckX - 5, neckY, 10, 15);

      // Head
      ctx.save();
      ctx.translate(neckX, neckY - 14);
      ctx.rotate(headTilt);

      // Face silhouette
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Hair silhouette
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(0, -4, 18, Math.PI * 0.8, Math.PI * 2.2);
      ctx.lineTo(14, 18);
      ctx.lineTo(-14, 18);
      ctx.closePath();
      ctx.fill();

      // Animated mouth singing
      if (isSinging) {
        ctx.fillStyle = '#831843';
        const mouthOpen = 2 + Math.abs(Math.sin(timeAcc * 14)) * 4;
        ctx.beginPath();
        ctx.ellipse(0, 5, 4, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Arms & Microphone Gestures
      // Right arm holding microphone stand
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(singerCenterX + 14 + swayTorso * 1.1, singerBaseY - 195 - breathBounce);
      ctx.lineTo(singerCenterX + 28, singerBaseY - 170 - breathBounce);
      ctx.lineTo(singerCenterX + 22, singerBaseY - 190);
      ctx.stroke();

      // Left arm gesturing expressively with the song rhythm
      const armGestureY = Math.sin(timeAcc * 3.5) * 16;
      ctx.beginPath();
      ctx.moveTo(singerCenterX - 14 + swayTorso * 1.1, singerBaseY - 195 - breathBounce);
      ctx.lineTo(singerCenterX - 36 + swayTorso, singerBaseY - 175 + armGestureY);
      ctx.lineTo(singerCenterX - 52 + swayTorso, singerBaseY - 188 + armGestureY * 1.4);
      ctx.stroke();

      // Vintage Chrome Stage Microphone Stand
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(singerCenterX + 24, singerBaseY - 195);
      ctx.lineTo(singerCenterX + 24, singerBaseY + 6);
      ctx.stroke();

      // Mic base
      ctx.beginPath();
      ctx.ellipse(singerCenterX + 24, singerBaseY + 6, 16, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Mic head
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(singerCenterX + 24, singerBaseY - 198, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 5. Floating Music Notes (♪ ♫)
      ctx.save();
      musicNotesRef.current.forEach((n) => {
        n.y += n.speedY;
        n.x += n.speedX;
        if (n.y < 120) {
          n.y = height * 0.65;
          n.x = width * 0.5 + (Math.random() - 0.5) * 220;
        }

        ctx.font = `bold ${n.size}px "Amiri", serif`;
        ctx.fillStyle = theme.primaryColor;
        ctx.globalAlpha = n.opacity * (0.6 + beatPulseRef.current * 0.4);
        ctx.fillText(n.symbol, n.x, n.y);
      });
      ctx.restore();

      // 6. Floating Golden Sparks
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
        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${p.opacity * (0.5 + beatPulseRef.current * 0.5)})`;
        ctx.fill();
      });
      ctx.restore();

      // 7. Active Cheering & Clapping Audience (حركة المستمعين والجمهور)
      ctx.save();
      const crowdY = height * 0.94;
      const audienceCount = 22;

      for (let i = 0; i < audienceCount; i++) {
        const personX = (width / audienceCount) * i + 28;

        // Individual sway phase and clapping intensity
        const swayPhase = Math.sin(timeAcc * 3.2 + i * 0.6) * 9;
        const bob = Math.abs(Math.sin(timeAcc * 6.4 + i)) * 6;
        const isClapping = clapTriggerRef.current > 0.1 || (i % 2 === 0 && beatPulseRef.current > 0.25);
        const clapBoost = isClapping ? 32 : 0;
        const headY = crowdY - 32 - bob;

        ctx.fillStyle = 'rgba(8, 8, 14, 0.96)';

        // Head silhouette
        ctx.beginPath();
        ctx.arc(personX + swayPhase * 0.4, headY, 13, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder / Torso silhouette
        ctx.beginPath();
        ctx.ellipse(personX + swayPhase * 0.4, crowdY, 22, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Clapping Arms & Hands
        const armLeftX = personX - 10 + swayPhase * 0.4;
        const armRightX = personX + 10 + swayPhase * 0.4;
        const handY = headY - 8 - clapBoost;

        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(8, 8, 14, 0.96)';
        ctx.lineCap = 'round';

        // Left arm
        ctx.beginPath();
        ctx.moveTo(personX - 14, crowdY - 8);
        ctx.lineTo(armLeftX, handY);
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(personX + 14, crowdY - 8);
        ctx.lineTo(armRightX, handY);
        ctx.stroke();

        // Clapping burst effect
        if (isClapping && i % 3 === 0) {
          ctx.beginPath();
          ctx.arc((armLeftX + armRightX) / 2, handY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Audience Smartphone Lights
        if (i % 4 === 1) {
          ctx.beginPath();
          ctx.arc(personX + swayPhase * 0.4 + 12, headY - 14, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();

      // 8. Synchronized Karaoke Lyrics Ribbon
      const currentLyric = lyrics[activeLyricIndex];
      if (currentLyric) {
        const elapsedInLine = currentTime - currentLyric.startTime;
        const lineProgress = Math.min(1, Math.max(0, elapsedInLine / currentLyric.duration));

        ctx.save();
        const ribbonY = height * 0.74;
        const ribbonHeight = 84;
        const gradRibbon = ctx.createLinearGradient(0, ribbonY, 0, ribbonY + ribbonHeight);
        gradRibbon.addColorStop(0, 'rgba(5, 5, 8, 0.94)');
        gradRibbon.addColorStop(0.5, 'rgba(15, 15, 25, 0.98)');
        gradRibbon.addColorStop(1, 'rgba(5, 5, 8, 0.94)');

        ctx.fillStyle = gradRibbon;
        ctx.fillRect(width * 0.08, ribbonY, width * 0.84, ribbonHeight);

        // Gold border
        ctx.strokeStyle = theme.primaryColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(width * 0.08, ribbonY, width * 0.84, ribbonHeight);

        // Active lyric text
        ctx.font = 'bold 36px "Cairo", "Amiri", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = theme.primaryColor;
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(currentLyric.text, width * 0.5, ribbonY + ribbonHeight * 0.43);

        // Progress bar under active text
        ctx.shadowBlur = 0;
        const barStartX = width * 0.18;
        const barMaxWidth = width * 0.64;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.fillRect(barStartX, ribbonY + ribbonHeight - 10, barMaxWidth, 4);

        ctx.fillStyle = theme.primaryColor;
        ctx.fillRect(barStartX, ribbonY + ribbonHeight - 10, barMaxWidth * lineProgress, 4);

        // Next lyric hint
        const nextLyric = lyrics[activeLyricIndex + 1];
        if (nextLyric) {
          ctx.font = '600 18px "Cairo", sans-serif';
          ctx.fillStyle = 'rgba(230, 230, 240, 0.75)';
          ctx.fillText(`الشطر التالي: ${nextLyric.text}`, width * 0.5, ribbonY - 18);
        }

        ctx.restore();
      } else {
        // Welcome / Intro Title Banner
        ctx.save();
        ctx.font = 'bold 32px "Cairo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = theme.primaryColor;
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('كليب: طلال جالس تحت الشجرة', width * 0.5, height * 0.77);

        ctx.font = '500 18px "Cairo", sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText('اضغط تشغيل لبدء الأغنية والعرض المتزامن', width * 0.5, height * 0.83);
        ctx.restore();
      }

      // 9. Watermark & Status (Top)
      ctx.save();
      ctx.font = 'bold 20px "Cairo", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('🎵 كليب: طلال تحت الشجرة', width - 36, 42);

      ctx.font = '500 14px "Cairo", sans-serif';
      ctx.fillStyle = theme.primaryColor;
      ctx.fillText(`اللحن والإيقاع الشرقي · ${Math.floor(currentTime)} ثانية`, width - 36, 68);

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
        ctx.fillText('جاري تسجيل وبناء الفيديو (REC)', 58, 45);
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
