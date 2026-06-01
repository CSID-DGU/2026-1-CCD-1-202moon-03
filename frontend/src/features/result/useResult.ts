import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSessionResult, getSessionSummary } from '../../services/analytic.api';
import { getSessionDetail } from '../../services/session.api';
import { useRainStore } from '../../store/useRainStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import type {
  ApiErrorResponse,
  SessionDetailData,
  SessionResultData,
  SessionSummaryData,
} from '../../types';

interface ResultViewModel {
  sessionId: string;
  title: string;
  summary: string;
  mode: 'rain' | 'spinner';
  learnedAt: string;
  score: number | null;
  maxCombo: number | null;
  typingAccuracy: number | null;
  watchRate: number;
  quizCorrect: number;
  quizTotal: number;
  tabSwitchCount: number;
  thumbnailUrl: string;
  hasThumbnail: boolean;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  const apiError = error as { response?: { data?: ApiErrorResponse } };

  return apiError?.response?.data?.message || apiError?.response?.data?.detail || fallbackMessage;
}

function mapMode(mode?: SessionResultData['mode'] | SessionDetailData['mode']) {
  return mode === 'rain' ? 'rain' : 'spinner';
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('ko-KR');
}

function getSummaryText(summary: SessionSummaryData | null) {
  if (!summary) {
    return '';
  }

  const summaryWithAlias = summary as SessionSummaryData & {
    ai_summary?: string | null;
  };

  return summary.summary || summaryWithAlias.ai_summary || '';
}

function buildViewModel({
  videoId,
  detail,
  result,
  summary,
  localRainResult,
  preferLocalReplayResult,
}: {
  videoId: string;
  detail: SessionDetailData | null;
  result: SessionResultData | null;
  summary: SessionSummaryData | null;
  localRainResult?: { score: number; maxCombo: number; accuracy: number; tabSwitchCount?: number } | null;
  preferLocalReplayResult: boolean;
}): ResultViewModel {
  const resolvedSummary =
    result?.ai_summary || getSummaryText(summary) || '아직 생성된 AI 요약이 없습니다.';

  return {
    sessionId: String(result?.session_id ?? detail?.session_id ?? detail?.id ?? videoId),
    title: result?.title || detail?.title || '영상 제목',
    summary: resolvedSummary,
    mode: mapMode(result?.mode ?? detail?.mode),
    learnedAt: formatDate(result?.completed_at ?? detail?.created_at),
    score: preferLocalReplayResult
      ? localRainResult?.score ?? result?.total_score ?? null
      : result?.total_score ?? localRainResult?.score ?? null,
    maxCombo: preferLocalReplayResult
      ? localRainResult?.maxCombo ?? result?.max_combo ?? null
      : result?.max_combo ?? localRainResult?.maxCombo ?? null,
    typingAccuracy: preferLocalReplayResult
      ? localRainResult?.accuracy ?? result?.typing_accuracy ?? null
      : result?.typing_accuracy ?? localRainResult?.accuracy ?? null,
    watchRate: result?.watch_rate ?? 0,
    quizCorrect: result?.quiz_correct ?? 0,
    quizTotal: result?.quiz_total ?? 0,
    tabSwitchCount: localRainResult?.tabSwitchCount ?? 0,
    thumbnailUrl: detail?.thumbnail_url || '',
    hasThumbnail: Boolean(detail?.thumbnail_url),
  };
}

export function useResult() {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('videoId');
  const sessionPlaybackMode = usePlayerStore((state) => state.sessionPlaybackMode);
  const localRainResult = useRainStore((state) =>
    videoId ? state.sessionResults[videoId] ?? null : null,
  );
  const [detail, setDetail] = useState<SessionDetailData | null>(null);
  const [resultData, setResultData] = useState<SessionResultData | null>(null);
  const [summaryData, setSummaryData] = useState<SessionSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!videoId) {
      setDetail(null);
      setResultData(null);
      setSummaryData(null);
      setError('세션 정보가 없어 결과를 불러올 수 없습니다.');
      return;
    }

    let isCancelled = false;

    const loadResult = async () => {
      setIsLoading(true);
      setError('');

      try {
        const detailResponse = await getSessionDetail(videoId);
        const detailData = detailResponse.data;
        let fetchedResultData: SessionResultData | null = null;

        if (!isCancelled) {
          setDetail(detailData);
        }

        try {
          const resultResponse = await getSessionResult(videoId);
          fetchedResultData = resultResponse.data;

          if (!isCancelled) {
            setResultData(fetchedResultData);
          }
        } catch (resultError) {
          if (!isCancelled) {
            setResultData(null);
            setError(getErrorMessage(resultError, '학습 결과가 아직 생성되지 않았습니다.'));
          }
        }

        const shouldFetchSummary =
          detailData.ai_status === 'done' && !(fetchedResultData?.ai_summary?.trim());

        if (!shouldFetchSummary) {
          if (!isCancelled) {
            setSummaryData(null);
          }
        } else {
          try {
            const summaryResponse = await getSessionSummary(videoId);

            if (!isCancelled) {
              setSummaryData(summaryResponse.data);
            }
          } catch {
            if (!isCancelled) {
              setSummaryData(null);
            }
          }
        }
      } catch (detailError) {
        if (!isCancelled) {
          setDetail(null);
          setResultData(null);
          setSummaryData(null);
          setError(getErrorMessage(detailError, '세션 상세 정보를 불러오지 못했습니다.'));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadResult();

    return () => {
      isCancelled = true;
    };
  }, [videoId]);

  const result = useMemo(
    () =>
      buildViewModel({
        videoId: videoId ?? '',
        detail,
        result: resultData,
        summary: summaryData,
        localRainResult,
        preferLocalReplayResult: sessionPlaybackMode === 'replay' && Boolean(localRainResult),
      }),
    [detail, localRainResult, resultData, sessionPlaybackMode, summaryData, videoId],
  );

  return {
    result,
    isLoading,
    error,
    isShowingReplayUpdate: sessionPlaybackMode === 'replay' && Boolean(localRainResult),
  };
}
