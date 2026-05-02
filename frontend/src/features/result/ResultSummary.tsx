interface ResultSummaryProps {
  title: string;
  summary: string;
}

function ResultSummary({ title, summary }: ResultSummaryProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-5 w-5 rounded-[2px] bg-[#FFD8D8]" aria-hidden="true" />
        <h2 className="text-[24px] font-bold tracking-[-0.03em] text-[#1B1E26]">{title}</h2>
      </div>
      <div className="min-h-[274px] rounded-[10px] bg-[#F4F6F8] px-5 py-4 text-[15px] leading-[1.8] text-[#333A48]">
        {summary}
      </div>
    </section>
  );
}

export default ResultSummary;
