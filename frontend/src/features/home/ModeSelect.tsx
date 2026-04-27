import type { PlayerMode } from '../../store/usePlayerStore';

interface ModeSelectProps {
  onSelect: (mode: Exclude<PlayerMode, null>) => void;
}

function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <section className="rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Mode Select</p>
        <h2 className="text-3xl font-semibold tracking-tight">Choose your listening challenge</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          This section is a skeleton entry point for the player experience. Real API and session
          setup can be attached here later.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect('spinner')}
          className="rounded-[20px] border border-sky-400/30 bg-sky-500/10 px-5 py-5 text-left transition-colors hover:bg-sky-500/20"
        >
          <p className="text-lg font-semibold">Fidget Spinner Mode</p>
          <p className="mt-2 text-sm text-slate-300">Keyword-driven spinner interaction skeleton.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelect('rain')}
          className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 px-5 py-5 text-left transition-colors hover:bg-emerald-500/20"
        >
          <p className="text-lg font-semibold">Acid Rain Mode</p>
          <p className="mt-2 text-sm text-slate-300">Typing and falling-keyword practice skeleton.</p>
        </button>
      </div>
    </section>
  );
}

export default ModeSelect;
