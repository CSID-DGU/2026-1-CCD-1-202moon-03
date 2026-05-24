interface ScoreBoardProps {
  score: number;
  maxCombo: number;
  accuracy: number;
  studyTime: string;
  coreKeyword: string;
}

function ScoreBoard({
  score,
  maxCombo,
  accuracy,
  studyTime,
  coreKeyword,
}: ScoreBoardProps) {
  return (
    <div className="flex h-full items-center rounded-[12px] border border-[#E5E7EC] bg-[#F4F6F7] px-3 py-3">
      <div className="w-full space-y-4 text-[14px] leading-5 text-[#15171C]">
        <MetricRow label="점수" value={`${score.toLocaleString()}점`} />
        <MetricRow label="최대 콤보수" value={`${maxCombo}`} />
        <MetricRow label="정확도" value={`${accuracy}%`} />
        <MetricRow label="학습 시간" value={studyTime} />
        <MetricRow label="핵심 키워드" value={coreKeyword} />
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[14px] font-normal text-[#15171C]">{label}</p>
      <p className="text-right text-[14px] font-semibold text-[#15171C]">{value}</p>
    </div>
  );
}

export default ScoreBoard;
