import { useEffect, useState, type RefObject } from 'react';

interface FullscreenToggleButtonProps {
  targetRef: RefObject<HTMLElement | null>;
}

function FullscreenToggleButton({ targetRef }: FullscreenToggleButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await (targetRef.current ?? document.documentElement).requestFullscreen();
    } catch {
      // Some browsers can reject fullscreen requests when the page is not focused.
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleToggleFullscreen()}
      className="flex h-10 w-[110px] items-center justify-center rounded-[10px] border border-[#3D4150] bg-[#25272E] font-paperlogy text-[14px] font-bold text-white transition-colors hover:border-[#1A9AF5] hover:bg-[#2D3039] active:bg-[#202229]"
      aria-label={isFullscreen ? '전체화면 종료' : '전체화면 전환'}
      title={isFullscreen ? '전체화면 종료' : '전체화면'}
    >
      <span className="font-paperlogy">
        ⛶ {isFullscreen ? '전체화면 종료' : '전체화면'}
      </span>
    </button>
  );
}

export default FullscreenToggleButton;
