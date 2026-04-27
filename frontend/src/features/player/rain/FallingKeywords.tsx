interface FallingKeywordsProps {
  keywords: string[];
}

function FallingKeywords({ keywords }: FallingKeywordsProps) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-900 px-5 py-5">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Falling Keywords</p>
      <p className="mt-3 text-sm text-slate-300">
        Placeholder lane for animated falling keywords: {keywords.join(', ')}
      </p>
    </div>
  );
}

export default FallingKeywords;
