import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import type { HomeVideoItem } from './homeVideoItems';

interface EditVideoTitleModalProps {
  video: HomeVideoItem | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (videoId: string, nextTitle: string) => void | Promise<void>;
}

export function EditVideoTitleModal({
  video,
  isOpen,
  isSubmitting = false,
  onClose,
  onSave,
}: EditVideoTitleModalProps) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (isOpen && video) {
      setTitle(video.title);
    }
  }, [isOpen, video]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !video) {
    return null;
  }

  const isDisabled = !title.trim() || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.4)] px-6 py-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-video-title-heading"
        className="relative z-10 flex w-full max-w-[420px] flex-col gap-8 overflow-hidden rounded-[24px] bg-white p-8 shadow-[0_30px_70px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            id="edit-video-title-heading"
            className="text-[20px] font-semibold leading-[1.5] tracking-[-0.03em] text-[#3A3D45]"
          >
            제목 수정
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="모달 닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#15171C] transition-colors hover:bg-[#F3F5F9]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-col gap-12">
          <div className="space-y-2">
            <label htmlFor="video-title-input" className="block px-[2px] text-[16px] text-[#15171C]">
              제목
            </label>
            <input
              id="video-title-input"
              name="videoTitle"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력해 주세요"
              className="h-12 w-full rounded-[8px] border border-[#C5C9D4] bg-white px-4 text-[16px] leading-none tracking-[-0.025em] text-[#15171C] outline-none transition-colors placeholder:text-[#A0A6B2] focus:border-[#1A9AF5]"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={isDisabled}
              onClick={() => onSave(video.id, title.trim())}
              variant={isDisabled ? 'inactive' : 'active'}
              className="h-[56px] w-[120px] !text-[16px]"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
