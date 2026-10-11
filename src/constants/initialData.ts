import { LyricLine, VisualTheme, RhythmPattern } from '../types/music';

export const DEFAULT_LYRICS: LyricLine[] = [
  {
    id: 'l1',
    text: 'طلال جالس تحت الشجرة',
    startTime: 0,
    duration: 3.8,
    noteHint: 'مقدمة البداية'
  },
  {
    id: 'l2',
    text: 'يلعب يكتب ماله فزعه',
    startTime: 4.0,
    duration: 3.8,
    noteHint: 'تصاعد الإيقاع'
  },
  {
    id: 'l3',
    text: 'احزر ايش فيه يامتعلم',
    startTime: 8.0,
    duration: 3.8,
    noteHint: 'سؤال ووقفة طربية'
  },
  {
    id: 'l4',
    text: 'فيه جبن خيانه غدره',
    startTime: 12.0,
    duration: 3.8,
    noteHint: 'ضربات الدف والدربكة'
  },
  {
    id: 'l5',
    text: 'اليوم يالله فوق الفجعه',
    startTime: 16.0,
    duration: 3.8,
    noteHint: 'ذروة اللحن'
  },
  {
    id: 'l6',
    text: 'ماهو عنتر او هو عبله',
    startTime: 20.0,
    duration: 3.8,
    noteHint: 'تفاعل وتصفيق الجمهور'
  },
  {
    id: 'l7',
    text: 'اسرح ارجم فوق الصلعه',
    startTime: 24.0,
    duration: 3.8,
    noteHint: 'إيقاع راقص وسريع'
  },
  {
    id: 'l8',
    text: 'كمل شعره ماعد هدره',
    startTime: 28.0,
    duration: 3.8,
    noteHint: 'تسارع الدوم والتاك'
  },
  {
    id: 'l9',
    text: 'طلال عبدالله هو عجله',
    startTime: 32.0,
    duration: 4.5,
    noteHint: 'قفلة الكليب الختامية'
  }
];

export const VISUAL_THEMES: VisualTheme[] = [
  {
    id: 'royal_gold',
    name: 'المسرح الملكي الذهبي',
    primaryColor: '#F59E0B',
    secondaryColor: '#D97706',
    spotlightColor: 'rgba(251, 191, 36, 0.45)',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    bgFilter: 'brightness(1.0) contrast(1.05)',
  },
  {
    id: 'neon_night',
    name: 'أضواء النيون والمهرجان',
    primaryColor: '#EC4899',
    secondaryColor: '#8B5CF6',
    spotlightColor: 'rgba(236, 72, 153, 0.45)',
    glowColor: 'rgba(139, 92, 246, 0.65)',
    bgFilter: 'hue-rotate(280deg) brightness(1.1)',
  },
  {
    id: 'velvet_oriental',
    name: 'السهرة المخملية الطربية',
    primaryColor: '#EF4444',
    secondaryColor: '#B91C1C',
    spotlightColor: 'rgba(239, 68, 68, 0.45)',
    glowColor: 'rgba(185, 28, 28, 0.7)',
    bgFilter: 'sepia(0.25) contrast(1.15)',
  },
  {
    id: 'emerald_stage',
    name: 'أضواء الزمرد والليزر',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    spotlightColor: 'rgba(16, 185, 129, 0.45)',
    glowColor: 'rgba(5, 150, 105, 0.6)',
    bgFilter: 'hue-rotate(90deg) contrast(1.1)',
  }
];

export const RHYTHM_OPTIONS: { id: RhythmPattern; name: string; desc: string; bpm: number }[] = [
  { id: 'maqsum', name: 'مقسوم شرقي', desc: 'الإيقاع الغنائي الشهير والمحبوب (دوم تاك.. تاك دوم تاك)', bpm: 106 },
  { id: 'malfuf', name: 'ملفوف راقص', desc: 'إيقاع سريع وحماسي للرقص والدبكة (2/4)', bpm: 120 },
  { id: 'saidi', name: 'صعيدي طربي', desc: 'ضربات قوية وفخمة مع رنة الدف (4/4)', bpm: 100 },
  { id: 'baladi', name: 'بلدي أصيل', desc: 'إيقاع راقص وتمايل طربي كلاسيكي', bpm: 96 },
  { id: 'dance_pop', name: 'بوب راقص حديث', desc: 'إيقاع حفلات ونوادي مع تصفيق الجمهور المستمر', bpm: 124 },
];
