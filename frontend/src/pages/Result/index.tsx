import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import UploadVideoModal from '../../features/home/UploadVideoModal';
import type { VideoInputSubmitPayload } from '../../features/home/useVideoInput';
import QuizRetryModal from '../../features/result/QuizRetryModal';
import { useQuizRetry } from '../../features/result/useQuizRetry';
import { useResult } from '../../features/result/useResult';
import { usePlayerStore } from '../../store/usePlayerStore';

function stripInlineMarkdown(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .trim();
}

function formatStudyDuration(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return '0분';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  }

  return `${minutes}분`;
}

function formatPercent(value: number | null | undefined, scale: 'ratio' | 'percent' = 'ratio') {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  const normalizedValue =
    scale === 'ratio'
      ? (value <= 1 ? value * 100 : value)
      : value;
  return `${Math.round(normalizedValue)}%`;
}

function ensureLeadingMarkdownHeading(summary: string) {
  const lines = summary.split('\n');
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);

  if (firstContentIndex === -1) {
    return summary;
  }

  const firstLine = lines[firstContentIndex].trim();

  if (/^#{1,6}\s+/.test(firstLine)) {
    return summary;
  }

  lines[firstContentIndex] = `# ${firstLine}`;
  return lines.join('\n');
}

function renderSummaryText(summary: string) {
  return ensureLeadingMarkdownHeading(summary)
    .split('\n')
    .map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={`summary-space-${index}`} className="h-3" />;
      }

      const headingMatch = trimmed.match(/^#{1,6}\s*(.+)$/);
      if (headingMatch) {
        return (
          <p
            key={`summary-heading-${index}`}
            className="mt-3 text-[19px] font-bold leading-[1.55] text-[#15171C] first:mt-0"
          >
            {stripInlineMarkdown(headingMatch[1])}
          </p>
        );
      }

      return (
        <p key={`summary-paragraph-${index}`} className="text-[16px] leading-[1.8] text-[#15171C]">
          {stripInlineMarkdown(trimmed)}
        </p>
      );
    });
}

const SUMMARY_SECTION_GAP = 8;

function ResultPage() {
  const navigate = useNavigate();
  const { result, isLoading, error, isShowingReplayUpdate } = useResult();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [collapsedSummaryHeight, setCollapsedSummaryHeight] = useState<number | null>(null);
  const [shouldShowSummaryToggle, setShouldShowSummaryToggle] = useState(false);
  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const summaryHeaderRef = useRef<HTMLDivElement | null>(null);
  const summaryToggleRef = useRef<HTMLDivElement | null>(null);
  const summaryContentRef = useRef<HTMLDivElement | null>(null);
  const quizRetry = useQuizRetry(result.sessionId);
  const setSessionPlaybackMode = usePlayerStore((state) => state.setSessionPlaybackMode);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    setIsSummaryExpanded(false);
  }, [result.sessionId]);

  useEffect(() => {
    const leftColumn = leftColumnRef.current;
    const summaryHeader = summaryHeaderRef.current;
    const summaryToggle = summaryToggleRef.current;
    const summaryContent = summaryContentRef.current;

    if (!leftColumn || !summaryHeader || !summaryToggle || !summaryContent) {
      return;
    }

    const updateHeight = () => {
      const availableHeightWithoutToggle =
        leftColumn.offsetHeight - summaryHeader.offsetHeight - SUMMARY_SECTION_GAP;
      const naturalSummaryHeight = summaryContent.scrollHeight;
      const nextShouldShowToggle = naturalSummaryHeight > availableHeightWithoutToggle;
      const nextCollapsedHeight = availableHeightWithoutToggle;

      setShouldShowSummaryToggle(nextShouldShowToggle);
      setCollapsedSummaryHeight(nextCollapsedHeight > 0 ? nextCollapsedHeight : null);

      if (!nextShouldShowToggle) {
        setIsSummaryExpanded(false);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(leftColumn);
    observer.observe(summaryHeader);
    observer.observe(summaryToggle);
    observer.observe(summaryContent);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [result.summary]);

  const handleReplay = () => {
    setSessionPlaybackMode('replay');
    navigate(`${ROUTES.HOME}?modeSelect=${encodeURIComponent(result.sessionId)}`);
  };

  const handleUploadComplete = (_payload: VideoInputSubmitPayload) => {
    navigate(`${ROUTES.HOME}?modeSelect=upload`);
  };

  return (
    <main className="flex h-full items-center justify-center bg-white px-6">
      <section className="w-full max-w-[800px] translate-y-4 rounded-[24px] bg-white px-8 py-2 md:translate-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-medium leading-[1.5] text-[#15171C]">
              {result.title}
            </h1>
            {isShowingReplayUpdate ? (
              <p className="mt-1 text-sm font-medium text-[#1A9AF5]">
                다시보기 결과가 반영된 최신 기록이에요.
              </p>
            ) : null}
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

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div ref={leftColumnRef} className="flex w-full max-w-[320px] flex-col gap-3">
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

            <Button
              type="button"
              variant="active"
              onClick={quizRetry.openQuizRetry}
              className="h-[56px] w-full rounded-[12px] px-4 py-4 text-[16px] font-bold tracking-[-0.4px]"
            >
              퀴즈 다시 풀기
            </Button>

            <div className="rounded-[12px] bg-[#F4F6F7] px-6 py-6 text-[16px] leading-[1.5] text-[#15171C]">
              <MetaRow label="모드" value={result.mode === 'rain' ? '집중호우' : '스피너'} />
              <MetaRow label="학습일자" value={result.learnedAt} />
              <MetaRow label="학습 시간" value={formatStudyDuration(result.studyDurationSeconds)} />
              <MetaRow
                label="퀴즈 정답률"
                value={`${result.quizTotal > 0 ? Math.round((result.quizCorrect / result.quizTotal) * 100) : 0}% (${result.quizCorrect} / ${result.quizTotal})`}
              />
              {result.mode === 'rain' ? (
                <>
                  <MetaRow label="입력 성공률" value={formatPercent(result.typingAccuracy)} />
                  <MetaRow label="점수" value={`${result.score ?? 0}점`} />
                  <MetaRow label="최대 콤보" value={`${result.maxCombo ?? 0}`} />
                </>
              ) : null}
              <MetaRow label="탭 이탈" value={`${result.tabLeaveCount}회`} />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div ref={summaryHeaderRef} className="flex items-center gap-1 text-[#15171C]">
              <SparkleIcon />
              <h2 className="text-[16px] font-medium leading-[1.5]">AI 요약보기</h2>
            </div>

            <div className="relative -translate-y-[0.5px]">
              <div
                ref={summaryContentRef}
                className={`-translate-y-[0.4px] rounded-[12px] bg-[#F4F6F7] p-4 ${
                  isSummaryExpanded || !shouldShowSummaryToggle ? '' : 'overflow-hidden'
                }`}
                style={
                  !isSummaryExpanded && shouldShowSummaryToggle && collapsedSummaryHeight
                    ? { maxHeight: `${collapsedSummaryHeight}px` }
                    : undefined
                }
              >
                <div className="space-y-1">{renderSummaryText(result.summary)}</div>
              </div>

              {shouldShowSummaryToggle && !isSummaryExpanded ? (
                <>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 translate-y-[0.2px] rounded-b-[12px] bg-gradient-to-t from-[#F4F6F7] via-[#F4F6F7]/98 via-40% via-[#F4F6F7]/88 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-[12px] bg-[#F4F6F7]" />
                  <div className="absolute inset-x-0 bottom-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsSummaryExpanded(true)}
                      className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full border border-[#D8E8FB] bg-white px-4 text-sm font-medium text-[#1A9AF5] shadow-[0_8px_20px_rgba(26,154,245,0.12)] transition-colors hover:bg-[#F7FBFF]"
                    >
                      <span>더보기</span>
                      <ChevronIcon expanded={false} />
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            <div
              ref={summaryToggleRef}
              className={shouldShowSummaryToggle && isSummaryExpanded ? 'flex w-full justify-center' : 'h-0'}
              aria-hidden={!shouldShowSummaryToggle || !isSummaryExpanded}
            >
              {shouldShowSummaryToggle && isSummaryExpanded ? (
                <button
                  type="button"
                  onClick={() => setIsSummaryExpanded(false)}
                  className="inline-flex h-[36px] items-center justify-center gap-1.5 self-center rounded-full px-4 text-sm font-medium text-[#667085] transition-colors hover:text-[#344054]"
                >
                  <span>접기</span>
                  <ChevronIcon expanded />
                </button>
              ) : null}
            </div>
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
        explanation={quizRetry.explanation}
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

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6.5L8 10L12 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ResultPage;
