interface KeywordSpinnerProps {
  activeKeyword: string;
  remainingKeywords: string[];
}

function KeywordSpinner({ activeKeyword, remainingKeywords }: KeywordSpinnerProps) {
  return (
    <section className="rounded-[24px] border border-slate-800 bg-slate-900 px-5 py-5">
      <p className="text-sm uppercase tracking-[0.3em] text-sky-300">키워드 스피너</p>
      <h2 className="mt-3 text-2xl font-semibold">{activeKeyword}</h2>
      <p className="mt-2 text-sm text-slate-400">
        남은 키워드: {remainingKeywords.join(', ') || '생성된 키워드를 기다리는 중입니다.'}
      </p>
    </section>
  );
}

export default KeywordSpinner;
