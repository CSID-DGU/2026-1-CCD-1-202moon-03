interface LearningHistoryItem {
  id: string;
  title: string;
  mode: string;
  createdAt: string;
}

interface LearningHistoryProps {
  items: LearningHistoryItem[];
}

function LearningHistory({ items }: LearningHistoryProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-6">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">학습 이력</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-[18px] bg-white px-4 py-4">
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {item.mode} · {item.createdAt}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default LearningHistory;
