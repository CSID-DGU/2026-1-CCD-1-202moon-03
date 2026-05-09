import Button from '../../../components/ui/Button';
import type { RainQuizState } from './types';

interface RainQuizModalProps {
  quizState: RainQuizState | null;
  onSelectOption: (index: number) => void;
  onContinue: () => void;
}

function RainQuizModal({ quizState, onSelectOption, onContinue }: RainQuizModalProps) {
  if (!quizState) {
    return null;
  }

  const { quiz, selectedIndex, feedback, isCorrect, isSubmitting } = quizState;
  const isAnswered = selectedIndex !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,15,24,0.68)] px-6 py-10 backdrop-blur-[3px]">
      <div className="w-full max-w-[720px] rounded-[28px] bg-white p-8 shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#7A879A]">Quiz</p>
        <h2 className="mt-3 text-[30px] font-bold tracking-[-0.03em] text-[#18202C]">
          {quiz.question}
        </h2>

        <div className="mt-8 grid gap-3">
          {quiz.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = isAnswered && index === quiz.answer_index;
            const isWrongSelection = isSelected && isCorrect === false;

            return (
              <button
                key={`${quiz.quiz_id}-${index}`}
                type="button"
                disabled={isSubmitting || isAnswered}
                onClick={() => onSelectOption(index)}
                className={`rounded-[18px] border px-5 py-4 text-left text-[17px] font-medium leading-[1.5] transition-colors ${
                  isCorrectOption
                    ? 'border-[#16A34A] bg-[#F0FDF4] text-[#166534]'
                    : isWrongSelection
                      ? 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]'
                      : isSelected
                        ? 'border-[#1A9AF5] bg-[#EAF5FF] text-[#0F4C81]'
                        : 'border-[#D8DEE8] bg-[#FBFCFE] text-[#253041] hover:border-[#BCD8F7] hover:bg-[#F4FAFF]'
                } ${isSubmitting || isAnswered ? 'cursor-default' : ''}`}
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

        <div className="mt-8 flex justify-end">
          {isAnswered ? (
            <Button type="button" variant="active" className="h-[56px] px-8 text-[18px]" onClick={onContinue}>
              계속하기
            </Button>
          ) : (
            <div className="text-sm text-[#7A879A]">
              {isSubmitting ? '정답을 확인하는 중...' : '보기를 하나 선택해 주세요.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RainQuizModal;
