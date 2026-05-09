import VideoInputForm from './VideoInputForm';
import type { VideoInputSubmitPayload } from './useVideoInput';

interface UploadVideoModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onComplete: (payload: VideoInputSubmitPayload) => void;
}

function UploadVideoModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onComplete,
}: UploadVideoModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,18,24,0.32)] px-6 py-8 backdrop-blur-[2px]">
      <div className="w-full max-w-[792px] rounded-[28px] bg-white px-10 pb-10 pt-12 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="mb-10 flex items-start justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#1F2430]">영상 업로드</h2>
            <p className="text-[17px] leading-[1.45] text-[#6C7485]">
              영상 링크를 넣거나 파일 업로드를 해주세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-12 w-12 items-center justify-center rounded-full text-[28px] font-light leading-none text-[#171A21] transition-colors hover:bg-[#F3F5F9]"
          >
            ×
          </button>
        </div>

        <VideoInputForm
          isSubmitting={isSubmitting}
          submitLabel="완료"
          onCancel={onClose}
          onSubmit={onComplete}
        />
      </div>
    </div>
  );
}

export default UploadVideoModal;
