import { useEffect, useRef, useState } from 'react';

export interface RainSettings {
  mode: 'auto' | 'manual';
  difficulty: 'easy' | 'normal' | 'hard';
  blankCount: number;
  fallSpeed: number;
}

interface RainSettingsModalProps {
  isOpen: boolean;
  settings: RainSettings;
  onClose: () => void;
  onApply: (settings: RainSettings) => void;
}

const AUTO_DIFFICULTY_TO_MANUAL_SETTINGS: Record<
  RainSettings['difficulty'],
  Pick<RainSettings, 'blankCount' | 'fallSpeed'>
> = {
  easy: {
    blankCount: 1,
    fallSpeed: 1,
  },
  normal: {
    blankCount: 2,
    fallSpeed: 2,
  },
  hard: {
    blankCount: 2,
    fallSpeed: 4,
  },
};

function RainSettingsModal({
  isOpen,
  settings,
  onClose,
  onApply,
}: RainSettingsModalProps) {
  const [draft, setDraft] = useState<RainSettings>(settings);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isManualMode = draft.mode === 'manual';

  const applyDifficultyToManualSettings = (difficulty: RainSettings['difficulty']) =>
    AUTO_DIFFICULTY_TO_MANUAL_SETTINGS[difficulty];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={modalRef}
        className="absolute right-0 top-full z-50 mt-2 w-[220px] rounded-[16px] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[15px] font-semibold text-[#15171C]">모드</span>
          <div className="flex overflow-hidden rounded-[8px] border border-[#E5E7EC]">
            <button
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, mode: 'auto' }))}
              className={`px-3 py-1 text-[13px] font-semibold transition-colors ${
                draft.mode === 'auto'
                  ? 'bg-[#1A9AF5] text-white'
                  : 'bg-white text-[#7D828B]'
              }`}
            >
              자동
            </button>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  mode: 'manual',
                  ...(prev.mode === 'auto'
                    ? applyDifficultyToManualSettings(prev.difficulty)
                    : {}),
                }))
              }
              className={`px-3 py-1 text-[13px] font-semibold transition-colors ${
                draft.mode === 'manual'
                  ? 'bg-[#1A9AF5] text-white'
                  : 'bg-white text-[#7D828B]'
              }`}
            >
              수동
            </button>
          </div>
        </div>

        {isManualMode && (
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[#15171C]">난이도</span>
            <div className="flex overflow-hidden rounded-[8px] border border-[#E5E7EC]">
              {(['easy', 'normal', 'hard'] as const).map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      difficulty,
                      ...(prev.mode === 'manual'
                        ? applyDifficultyToManualSettings(difficulty)
                        : {}),
                    }))
                  }
                  className={`px-2 py-1 text-[12px] font-semibold transition-colors ${
                    draft.difficulty === difficulty
                      ? 'bg-[#1A9AF5] text-white'
                      : 'bg-white text-[#7D828B]'
                  }`}
                >
                  {difficulty === 'easy'
                    ? '쉬움'
                    : difficulty === 'normal'
                      ? '보통'
                      : '어려움'}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          className="w-full rounded-[8px] bg-[#1A9AF5] py-2 text-[15px] font-semibold text-white"
        >
          적용
        </button>
      </div>
    </>
  );
}

export default RainSettingsModal;
