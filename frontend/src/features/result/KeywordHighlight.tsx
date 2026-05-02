interface KeywordHighlightProps {
  keywords: string[];
}

function KeywordHighlight({ keywords }: KeywordHighlightProps) {
  return (
    <section className="space-y-4">
      <p className="text-[16px] font-semibold text-[#5F6777]">핵심 키워드</p>
      <div className="flex flex-wrap gap-3">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-full bg-[#EEF5FF] px-4 py-2 text-[14px] font-medium text-[#287AD6]"
          >
            {keyword}
          </span>
        ))}
      </div>
    </section>
  );
}

export default KeywordHighlight;
