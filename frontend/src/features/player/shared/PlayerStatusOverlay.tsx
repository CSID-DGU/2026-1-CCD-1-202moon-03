interface PlayerStatusOverlayProps {
  title: string;
  description: string;
  tone?: 'neutral' | 'error';
}

function PlayerStatusOverlay({
  title,
  description,
  tone = 'neutral',
}: PlayerStatusOverlayProps) {
  return (
    <div className="flex w-full aspect-video items-center justify-center rounded-[16px] border border-[#2D3340] bg-[#1B2029] px-8 text-center">
      <div className="max-w-[420px] space-y-3">
        <p
          className={`text-[28px] font-bold tracking-[-0.03em] ${
            tone === 'error' ? 'text-rose-300' : 'text-white'
          }`}
        >
          {title}
        </p>
        <p className="text-[16px] leading-[1.6] text-slate-300">{description}</p>
      </div>
    </div>
  );
}

export default PlayerStatusOverlay;
