interface KeywordHighlightProps {
  keywords: string[];
}

function KeywordHighlight({ keywords }: KeywordHighlightProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-6">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Keyword Highlight</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700"
          >
            {keyword}
          </span>
        ))}
      </div>
    </section>
  );
}

export default KeywordHighlight;
