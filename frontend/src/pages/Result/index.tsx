import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import UploadVideoModal from '../../features/home/UploadVideoModal';
import type { VideoInputSubmitPayload } from '../../features/home/useVideoInput';
import KeywordHighlight from '../../features/result/KeywordHighlight';
import QuizRetryModal from '../../features/result/QuizRetryModal';
import ResultSummary from '../../features/result/ResultSummary';
import { useResult } from '../../features/result/useResult';

function ResultPage() {
  const navigate = useNavigate();
  const { video, title, summary, highlightedKeywords } = useResult();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleReplay = () => {
    navigate(`${ROUTES.HOME}?modeSelect=${encodeURIComponent(video.id)}`);
  };

  const handleUploadComplete = (_payload: VideoInputSubmitPayload) => {
    navigate(`${ROUTES.HOME}?modeSelect=upload`);
  };

  return (
    <div className="-mx-6 -my-8 min-h-screen bg-white px-6 py-16">
      <div className="mx-auto w-full max-w-[1120px] rounded-[28px] bg-white px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.95fr]">
          <div className="space-y-6">
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#1B1E26]">{title}</h1>
            <div
              className={`overflow-hidden rounded-[10px] bg-gradient-to-br ${video.thumbnailColor} shadow-[0_10px_30px_rgba(15,23,42,0.08)]`}
            >
              <div className="flex aspect-[1.58/1] items-center justify-center text-4xl font-bold tracking-[0.16em] text-white">
                {video.thumbnailLabel}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsQuizOpen(true)}
                className="rounded-[14px] border border-[#DCE1EA] bg-white px-5 py-3 text-[15px] font-semibold text-[#303747] transition-colors hover:bg-[#F7F9FC]"
              >
                퀴즈 다시 풀기
              </button>
              <button
                type="button"
                onClick={handleReplay}
                className="rounded-[14px] border border-[#DCE1EA] bg-white px-5 py-3 text-[15px] font-semibold text-[#303747] transition-colors hover:bg-[#F7F9FC]"
              >
                영상 다시 보기
              </button>
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="rounded-[14px] border border-[#DCE1EA] bg-white px-5 py-3 text-[15px] font-semibold text-[#303747] transition-colors hover:bg-[#F7F9FC]"
              >
                영상 업로드 +
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <ResultSummary title="AI 요약본" summary={summary} />
            <KeywordHighlight keywords={highlightedKeywords} />
            <div className="rounded-[16px] bg-[#F7F8FA] px-5 py-5">
              <div className="flex flex-wrap gap-3 text-[14px] text-[#495264]">
                <span className="rounded-full bg-white px-4 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  모드 {video.mode === 'rain' ? '집중호우' : '피젯 스피너'}
                </span>
                <span className="rounded-full bg-white px-4 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  학습일자 {video.learnedAt}
                </span>
                {video.mode === 'rain' ? (
                  <>
                    <span className="rounded-full bg-white px-4 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                      점수 {video.score ?? 0}
                    </span>
                    <span className="rounded-full bg-white px-4 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                      최대 콤보 {video.maxCombo ?? 0}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuizRetryModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onComplete={handleUploadComplete}
      />
    </div>
  );
}

export default ResultPage;
