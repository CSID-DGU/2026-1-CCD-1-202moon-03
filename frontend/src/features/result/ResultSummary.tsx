interface ResultSummaryProps {
  title: string;
  summary: string;
}

function ResultSummary({ title, summary }: ResultSummaryProps) {
  return (
    <section className="rounded-[24px] bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 text-slate-600">{summary}</p>
    </section>
  );
}

export default ResultSummary;
