import Button from '../../../components/ui/Button';

interface TypingInputProps {
  value: string;
  activeKeyword?: string;
  hint?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

function TypingInput({ value, activeKeyword, hint, onChange, onSubmit }: TypingInputProps) {
  return (
    <section className="rounded-[28px] border border-[#DDE7F2] bg-white px-6 py-6 shadow-[0_18px_36px_rgba(148,163,184,0.14)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2F80ED]">
            Typing Input
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#1D2836]">
            빈칸 단어 입력
          </h2>
          <p className="text-sm leading-6 text-[#617389]">
            현재 정답: <span className="font-semibold text-[#2F80ED]">{activeKeyword ?? '없음'}</span>
          </p>
        </div>

        {hint ? (
          <div className="max-w-md rounded-2xl border border-[#DDE7F2] bg-[#F7FAFD] px-4 py-3 text-sm leading-6 text-[#526274]">
            힌트: {hint}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="들리는 단어를 입력하세요"
          className="flex-1 rounded-[18px] border border-[#D5E3F2] bg-[#F8FBFE] px-5 py-4 text-lg text-[#1D2836] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2F80ED]"
        />

        <Button
          type="button"
          onClick={onSubmit}
          variant="active"
          className="rounded-[18px] bg-[#2F80ED] px-6 py-4 text-base font-semibold text-white hover:bg-[#1E73E6]"
        >
          입력 확인
        </Button>
      </div>
    </section>
  );
}

export default TypingInput;
