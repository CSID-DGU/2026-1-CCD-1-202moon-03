interface SpinnerCanvasProps {
  keywords: string[];
}

function SpinnerCanvas({ keywords }: SpinnerCanvasProps) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-slate-800 bg-slate-900">
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">스피너 캔버스</p>
        <p className="text-sm text-slate-400">
          스피너 애니메이션과 영상 동기화 오버레이가 들어갈 placeholder 영역입니다.
        </p>
        <p className="text-xs text-slate-500">키워드: {keywords.join(', ')}</p>
      </div>
    </div>
  );
}

export default SpinnerCanvas;
