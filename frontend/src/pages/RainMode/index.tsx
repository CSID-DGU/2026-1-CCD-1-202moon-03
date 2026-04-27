import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import FallingKeywords from '../../features/player/rain/FallingKeywords';
import ScoreBoard from '../../features/player/rain/ScoreBoard';
import TypingInput from '../../features/player/rain/TypingInput';
import { useRainMode } from '../../features/player/rain/useRainMode';

function RainModePage() {
  const { keywords, typedValue, score, combo, accuracy, setTypedValue, incrementSkeletonState } =
    useRainMode();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Player Mode</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Acid Rain Practice</h1>
        </div>
        <Link className="text-sm text-slate-300 transition-colors hover:text-white" to={ROUTES.RESULT}>
          View Result Skeleton
        </Link>
      </div>

      <ScoreBoard score={score} combo={combo} accuracy={accuracy} />
      <FallingKeywords keywords={keywords} />
      <TypingInput value={typedValue} onChange={setTypedValue} />

      <button
        type="button"
        onClick={incrementSkeletonState}
        className="w-fit rounded-[16px] bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
      >
        Mock Score Update
      </button>
    </main>
  );
}

export default RainModePage;
