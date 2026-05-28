import Button from '../../components/ui/Button';
import type { RetryQuizItem } from '../../types';

interface QuizRetryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  loadError: string;
  quiz: RetryQuizItem | null;
  currentIndex: number;
  totalCount: number;
  selectedIndex: number | null;
  feedback: string;
  explanation: string;
  isCorrect: boolean | null;
  isCompleted: boolean;
  onClose: () => void;
  onSelectOption: (index: number) => void;
  onContinue: () => void;
  onRestart?: () => void;
}

function QuizRetryModal({
  isOpen,
  isLoading,
  loadError,
  quiz,
  currentIndex,
  totalCount,
  selectedIndex,
  feedback,
  explanation,
  isCorrect,
  isCompleted,
  onClose,
  onSelectOption,
  onContinue,
  onRestart,
}: QuizRetryModalProps) {
  if (!isOpen) {
    return null;
  }

  const isAnswered = selectedIndex !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,15,24,0.68)] px-6 py-10 backdrop-blur-[3px]">
      <div className="w-full max-w-[720px] rounded-[28px] bg-white p-8 shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#7A879A]">Quiz</p>
            <h2 className="mt-3 text-[30px] font-bold tracking-[-0.03em] text-[#18202C]">
              퀴즈 다시 풀기
            </h2>
            {quiz && !isCompleted ? (
              <p className="mt-2 text-sm text-[#7A879A]">
                {currentIndex} / {totalCount}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#7A879A] transition-colors hover:bg-[#F4F6F7] hover:text-[#18202C]"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#D8DEE8] border-t-[#1A9AF5]" />
            <p className="text-[16px] text-[#7A879A]">복습용 퀴즈를 불러오는 중입니다.</p>
          </div>
        ) : null}

        {!isLoading && loadError ? (
          <div className="mt-8 flex min-h-[240px] flex-col items-center justify-center gap-6 rounded-[20px] bg-[#F8FAFC] px-6 text-center">
            <p className="text-[18px] font-semibold text-[#18202C]">{loadError}</p>
            <Button type="button" variant="active" className="h-[56px] px-8 text-[18px]" onClick={onClose}>
              닫기
            </Button>
          </div>
        ) : null}

        {!isLoading && !loadError && isCompleted ? (
          <div className="mt-8 flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[20px] bg-[#F8FAFC] px-6 text-center">
            <p className="text-[28px] font-bold tracking-[-0.03em] text-[#18202C]">다시 보기 완료</p>
            <p className="text-[16px] leading-[1.6] text-[#5C6880]">
              이번 세션의 퀴즈를 모두 다시 확인했습니다.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {onRestart ? (
                <Button type="button" variant="secondary" className="h-[56px] px-8 text-[18px]" onClick={onRestart}>
                  처음부터 다시
                </Button>
              ) : null}
              <Button type="button" variant="active" className="h-[56px] px-8 text-[18px]" onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        ) : null}

        {!isLoading && !loadError && !isCompleted && quiz ? (
          <>
            <h3 className="mt-8 text-[30px] font-bold tracking-[-0.03em] text-[#18202C]">
              {quiz.question}
            </h3>

            <div className="mt-8 grid gap-3">
              {quiz.options.map((option, index) => {
                const isSelected = selectedIndex === index;
                const isCorrectOption = isAnswered && index === quiz.answer_index;
                const isWrongSelection = isSelected && isCorrect === false;

                return (
                  <button
                    key={`${quiz.quiz_id}-${index}`}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => onSelectOption(index)}
                    className={`rounded-[18px] border px-5 py-4 text-left text-[17px] font-medium leading-[1.5] transition-colors ${
                      isCorrectOption
                        ? 'border-[#16A34A] bg-[#F0FDF4] text-[#166534]'
                        : isWrongSelection
                          ? 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]'
                          : isSelected
                            ? 'border-[#1A9AF5] bg-[#EAF5FF] text-[#0F4C81]'
                            : 'border-[#D8DEE8] bg-[#FBFCFE] text-[#253041] hover:border-[#BCD8F7] hover:bg-[#F4FAFF]'
                    } ${isAnswered ? 'cursor-default' : ''}`}
                  >
                    <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[14px] font-bold text-[#5C6880]">
                      {index + 1}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {feedback ? (
              <div
                className={`mt-6 rounded-[18px] px-5 py-4 text-[16px] leading-[1.6] ${
                  isCorrect ? 'bg-[#F0FDF4] text-[#166534]' : 'bg-[#FEF2F2] text-[#991B1B]'
                }`}
              >
                {feedback}
              </div>
            ) : null}

            {explanation ? (
              <div className="mt-4 rounded-[18px] bg-[#F4F6F9] px-5 py-4 text-[#253041]">
                <p className="text-sm font-semibold tracking-[-0.02em] text-[#18202C]">해설</p>
                <p className="mt-2 text-[16px] leading-[1.6]">{explanation}</p>
              </div>
            ) : null}

            <div className="mt-8 flex justify-end">
              {isAnswered ? (
                <Button type="button" variant="active" className="h-[56px] px-8 text-[18px]" onClick={onContinue}>
                  계속하기
                </Button>
              ) : (
                <div className="text-sm text-[#7A879A]">보기를 하나 선택해 주세요.</div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default QuizRetryModal;
