interface SpinnerCanvasProps {
  keywords: string[];
}

function SpinnerCanvas({ keywords }: SpinnerCanvasProps) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-slate-800 bg-slate-900">
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Spinner Canvas</p>
        <p className="text-sm text-slate-400">
          Placeholder arena for spinner animation and video-sync overlays.
        </p>
        <p className="text-xs text-slate-500">Keywords: {keywords.join(', ')}</p>
      </div>
    </div>
  );
}

export default SpinnerCanvas;
