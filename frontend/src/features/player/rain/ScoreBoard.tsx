interface ScoreBoardProps {
  score: number;
  combo: number;
  accuracy: number;
}

function ScoreBoard({ score, combo, accuracy }: ScoreBoardProps) {
  return (
    <div className="grid gap-4 rounded-[24px] border border-slate-800 bg-slate-900 px-5 py-5 md:grid-cols-3">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
        <p className="mt-2 text-2xl font-semibold">{score}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Combo</p>
        <p className="mt-2 text-2xl font-semibold">{combo}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Accuracy</p>
        <p className="mt-2 text-2xl font-semibold">{accuracy}%</p>
      </div>
    </div>
  );
}

export default ScoreBoard;
