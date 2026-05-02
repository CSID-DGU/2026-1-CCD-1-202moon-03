interface ScoreBoardProps {
  score: number;
  maxCombo: number;
  accuracy: number;
  characterName: string;
}

function ScoreBoard({ score, maxCombo, accuracy, characterName }: ScoreBoardProps) {
  return (
    <aside className="rounded-[28px] border border-[#DDE7F2] bg-white p-6 shadow-[0_18px_36px_rgba(148,163,184,0.14)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2F80ED]">
            Score Board
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#1D2836]">실시간 학습 현황</h2>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#FDE68A_0%,#FBBF24_45%,#F59E0B_100%)] text-3xl shadow-[0_12px_24px_rgba(251,191,36,0.22)]">
            🙂
          </div>
          <p className="text-xs font-medium text-[#66788D]">{characterName}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <MetricCard label="점수" value={score.toLocaleString()} accent="text-[#2F80ED]" />
        <MetricCard label="최대 콤보" value={`${maxCombo}`} accent="text-[#16A34A]" />
        <MetricCard label="정확도" value={`${accuracy}%`} accent="text-[#8B5CF6]" />
      </div>
    </aside>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  accent: string;
}

function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="rounded-[22px] border border-[#E6EDF6] bg-[#F7FAFD] px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A98AA]">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-[-0.03em] ${accent}`}>{value}</p>
    </div>
  );
}

export default ScoreBoard;
