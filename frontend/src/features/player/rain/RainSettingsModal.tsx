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

const BLANK_COUNT_MIN = 1;
const BLANK_COUNT_MAX = 6;
const FALL_SPEED_MIN = 1;
const FALL_SPEED_MAX = 5;

function RainSettingsModal({ isOpen, settings, onClose, onApply }: RainSettingsModalProps) {
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

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  const isManualMode = draft.mode === 'manual';

  return (
    <>
      {/* 바깥 클릭 감지용 투명 backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={modalRef}
        className="absolute right-0 top-full z-50 mt-2 w-[220px] rounded-[16px] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      >
        {/* 모드 */}
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
              onClick={() => setDraft((prev) => ({ ...prev, mode: 'manual' }))}
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

        {/* 난이도 (자동 모드) */}
        {!isManualMode && (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[#15171C]">난이도</span>
            <div className="flex overflow-hidden rounded-[8px] border border-[#E5E7EC]">
              {(['easy', 'normal', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, difficulty: d }))}
                  className={`px-2 py-1 text-[12px] font-semibold transition-colors ${
                    draft.difficulty === d
                      ? 'bg-[#1A9AF5] text-white'
                      : 'bg-white text-[#7D828B]'
                  }`}
                >
                  {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 빈칸 개수 */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[15px] font-semibold text-[#15171C]">빈칸 개수</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  blankCount: clamp(prev.blankCount - 1, BLANK_COUNT_MIN, BLANK_COUNT_MAX),
                }))
              }
              disabled={!isManualMode || draft.blankCount <= BLANK_COUNT_MIN}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A9AF5] text-white disabled:opacity-40"
            >
              <MinusIcon />
            </button>
            <span className="w-5 text-center text-[15px] font-bold text-[#15171C]">
              {draft.blankCount}
            </span>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  blankCount: clamp(prev.blankCount + 1, BLANK_COUNT_MIN, BLANK_COUNT_MAX),
                }))
              }
              disabled={!isManualMode || draft.blankCount >= BLANK_COUNT_MAX}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A9AF5] text-white disabled:opacity-40"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {/* 낙하속도 */}
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[15px] font-semibold text-[#15171C]">낙하속도</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  fallSpeed: clamp(prev.fallSpeed - 1, FALL_SPEED_MIN, FALL_SPEED_MAX),
                }))
              }
              disabled={!isManualMode || draft.fallSpeed <= FALL_SPEED_MIN}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A9AF5] text-white disabled:opacity-40"
            >
              <MinusIcon />
            </button>
            <span className="w-5 text-center text-[15px] font-bold text-[#15171C]">
              {draft.fallSpeed}
            </span>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  fallSpeed: clamp(prev.fallSpeed + 1, FALL_SPEED_MIN, FALL_SPEED_MAX),
                }))
              }
              disabled={!isManualMode || draft.fallSpeed >= FALL_SPEED_MAX}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A9AF5] text-white disabled:opacity-40"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {/* 적용 */}
        <p className="mb-4 text-[12px] leading-5 text-[#7D828B]">
          {isManualMode
            ? '수동 모드에서는 빈칸 수와 낙하 속도를 직접 조절할 수 있어요.'
            : '자동 모드에서는 현재 난이도에 맞는 기본값이 적용됩니다.'}
        </p>
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

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default RainSettingsModal;
