import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import UploadVideoModal from '../../features/home/UploadVideoModal';
import type { VideoInputSubmitPayload } from '../../features/home/useVideoInput';
import QuizRetryModal from '../../features/result/QuizRetryModal';
import { useQuizRetry } from '../../features/result/useQuizRetry';
import { useResult } from '../../features/result/useResult';

function ResultPage() {
  const navigate = useNavigate();
  const { result, isLoading, error } = useResult();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const quizRetry = useQuizRetry(result.sessionId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleReplay = () => {
    navigate(`${ROUTES.HOME}?modeSelect=${encodeURIComponent(result.sessionId)}`);
  };

  const handleUploadComplete = (_payload: VideoInputSubmitPayload) => {
    navigate(`${ROUTES.HOME}?modeSelect=upload`);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <section className="mx-auto w-full max-w-[800px] rounded-[24px] bg-white p-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-medium leading-[1.5] text-[#15171C]">
              {result.title}
            </h1>
            {isLoading ? <p className="mt-1 text-sm text-[#7C8596]">결과를 불러오는 중...</p> : null}
            {error ? <p className="mt-1 text-sm text-rose-500">{error}</p> : null}
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => navigate(ROUTES.HOME)}
            className="flex h-6 w-6 items-center justify-center text-[#15171C]"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex w-full max-w-[320px] flex-col gap-3">
            <div className="aspect-[360/202] overflow-hidden rounded-[16px] bg-[#EBEBEB]">
              {result.hasThumbnail ? (
                <img
                  src={result.thumbnailUrl}
                  alt={result.title}
                  className="h-full w-full rounded-[16px] object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-[16px] font-medium text-[#7C8596]">
                  썸네일이 아직 없어요
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleReplay}
              className="h-[48px] w-full rounded-[12px] px-4 py-3 text-[16px] font-medium tracking-[-0.4px]"
            >
              영상 다시보기
            </Button>

            <div className="flex flex-1 flex-col justify-end rounded-[12px] bg-[#F4F6F7] px-6 py-6 text-[16px] leading-[1.5] text-[#15171C]">
              <MetaRow label="모드" value={result.mode === 'rain' ? '집중호우' : '피젯'} />
              <MetaRow label="학습일자" value={result.learnedAt} />
              {result.mode === 'rain' ? (
                <>
                  <MetaRow label="점수" value={`${result.score ?? 0}점`} />
                  <MetaRow label="최대 콤보" value={`${result.maxCombo ?? 0}`} />
                  <MetaRow label="탭 이탈" value={`${result.tabSwitchCount}회`} />
                </>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-1 text-[#15171C]">
              <SparkleIcon />
              <h2 className="text-[16px] font-medium leading-[1.5]">AI 요약보기</h2>
            </div>

            <div className="flex flex-1 flex-col rounded-[12px] bg-[#F4F6F7] p-4">
              <p className="text-[14px] leading-[1.5] text-[#15171C]">{result.summary}</p>
            </div>

            <Button
              type="button"
              variant="active"
              onClick={quizRetry.openQuizRetry}
              className="h-[56px] w-full rounded-[12px] px-4 py-4 text-[16px] font-bold tracking-[-0.4px]"
            >
              퀴즈 다시 풀기
            </Button>
          </div>
        </div>
      </section>

      <QuizRetryModal
        isOpen={quizRetry.isOpen}
        isLoading={quizRetry.isLoading}
        loadError={quizRetry.loadError}
        quiz={quizRetry.currentQuiz}
        currentIndex={quizRetry.currentIndex}
        totalCount={quizRetry.totalCount}
        selectedIndex={quizRetry.selectedIndex}
        feedback={quizRetry.feedback}
        isCorrect={quizRetry.isCorrect}
        isCompleted={quizRetry.isCompleted}
        onClose={quizRetry.closeQuizRetry}
        onSelectOption={quizRetry.selectOption}
        onContinue={quizRetry.continueQuizRetry}
        onRestart={quizRetry.restartQuizRetry}
      />

      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onComplete={handleUploadComplete}
      />
    </main>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-[2px]">
      <span className="font-paperlogy text-[16px] font-normal leading-[1.5] text-[#15171C]">
        {label}
      </span>
      <span className="font-paperlogy text-[16px] font-semibold leading-[1.5] text-[#15171C]">
        {value}
      </span>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2L11.7 6.3L16 8L11.7 9.7L10 14L8.3 9.7L4 8L8.3 6.3L10 2Z"
        fill="#71B8FF"
      />
      <path
        d="M15.5 2.5L16.1 4.1L17.7 4.7L16.1 5.3L15.5 6.9L14.9 5.3L13.3 4.7L14.9 4.1L15.5 2.5Z"
        fill="#1A9AF5"
      />
    </svg>
  );
}

export default ResultPage;
