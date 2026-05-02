interface QuizRetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function QuizRetryModal({ isOpen, onClose }: QuizRetryModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-6">
      <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">퀴즈 모달</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          퀴즈 다시 풀기
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          실제 퀴즈 내용 대신, 퀴즈 재진입 흐름만 확인할 수 있는 mock 모달입니다.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizRetryModal;
