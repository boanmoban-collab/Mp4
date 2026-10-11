import React, { useState } from 'react';
import { LyricLine } from '../types/music';
import { Music2, Edit3, Check, Plus, Trash2 } from 'lucide-react';

interface LyricsManagerProps {
  lyrics: LyricLine[];
  activeLyricIndex: number;
  onSelectLyric: (index: number) => void;
  onUpdateLyrics: (newLyrics: LyricLine[]) => void;
}

export const LyricsManager: React.FC<LyricsManagerProps> = ({
  lyrics,
  activeLyricIndex,
  onSelectLyric,
  onUpdateLyrics,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLines, setEditedLines] = useState<LyricLine[]>(lyrics);

  const handleSave = () => {
    onUpdateLyrics(editedLines);
    setIsEditing(false);
  };

  const handleTextChange = (id: string, text: string) => {
    setEditedLines((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleAddLine = () => {
    const last = editedLines[editedLines.length - 1];
    const newStartTime = last ? last.startTime + last.duration : 0;
    const newLine: LyricLine = {
      id: `l_${Date.now()}`,
      text: 'شطر جديد...',
      startTime: newStartTime,
      duration: 3.8,
      noteHint: 'مقطع إضافي',
    };
    setEditedLines((prev) => [...prev, newLine]);
  };

  const handleDeleteLine = (id: string) => {
    setEditedLines((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-100">كلمات الأغنية والمتزامنات</h3>
            <p className="text-xs text-neutral-400">شاشة الكاريوكي وعرض الأشعار المتناغمة</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isEditing) handleSave();
            else {
              setEditedLines(lyrics);
              setIsEditing(true);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          {isEditing ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>حفظ الكلمات</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>تعديل الكلمات</span>
            </>
          )}
        </button>
      </div>

      {isEditing ? (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
          {editedLines.map((line, idx) => (
            <div
              key={line.id}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800"
            >
              <span className="text-xs font-mono text-neutral-500 w-6 text-center">
                {idx + 1}
              </span>
              <input
                type="text"
                value={line.text}
                onChange={(e) => handleTextChange(line.id, e.target.value)}
                className="flex-1 bg-transparent text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-2 py-1"
              />
              <button
                onClick={() => handleDeleteLine(line.id)}
                className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                title="حذف الشطر"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddLine}
            className="w-full mt-2 py-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 hover:border-amber-500/50 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة شطر جديد</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
          {lyrics.map((line, idx) => {
            const isActive = idx === activeLyricIndex;
            return (
              <div
                key={line.id}
                onClick={() => onSelectLyric(idx)}
                className={`group relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'bg-neutral-950/40 hover:bg-neutral-800/50 border border-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full transition-transform ${
                      isActive ? 'bg-amber-400 scale-125 animate-pulse' : 'bg-neutral-700'
                    }`}
                  />
                  <span
                    className={`text-sm md:text-base font-semibold transition-colors ${
                      isActive
                        ? 'text-amber-300 font-bold drop-shadow'
                        : 'text-neutral-300 group-hover:text-neutral-100'
                    }`}
                  >
                    {line.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                  <span>{Math.floor(line.startTime)}ث</span>
                  {line.noteHint && (
                    <span className="hidden md:inline-block text-[11px] text-neutral-400 font-sans">
                      · {line.noteHint}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
