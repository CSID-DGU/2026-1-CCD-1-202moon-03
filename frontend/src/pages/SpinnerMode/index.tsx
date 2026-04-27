import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import KeywordSpinner from '../../features/player/spinner/KeywordSpinner';
import SpinnerCanvas from '../../features/player/spinner/SpinnerCanvas';
import { useSpinnerMode } from '../../features/player/spinner/useSpinnerMode';

function SpinnerModePage() {
  const { sessionTitle, activeKeyword, keywords } = useSpinnerMode();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Player Mode</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{sessionTitle}</h1>
        </div>
        <Link className="text-sm text-slate-300 transition-colors hover:text-white" to={ROUTES.RESULT}>
          View Result Skeleton
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <SpinnerCanvas keywords={keywords} />
        <KeywordSpinner activeKeyword={activeKeyword} remainingKeywords={keywords.slice(1)} />
      </div>
    </main>
  );
}

export default SpinnerModePage;
