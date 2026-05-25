import { useState } from 'react';

interface PlayerDebugPanelProps {
  debug: {
    sessionId: string | null;
    state: string;
    currentAiStatus: string | null;
    isStreamingCurrentSession: boolean;
    activeStreamStrategy?: string | null;
    actualStreamRequestKey?: string | null;
    shouldResumeFileCurrentSession?: boolean;
    recoveryStrategy?: string | null;
    hasStartedStreamRequest?: boolean;
    lastStreamRequestType?: string | null;
    streamingSourceType: string | null;
    streamingSourceSessionId: string | null;
    hasVideoUrl?: boolean;
    hasStartGameData?: boolean;
    loadedSegments: number;
    loadedQuizzes: number;
    loadedFallEvents: number;
    loadedChapterIndexes: number[];
    lastStreamEventType: string;
    lastChunkSegments: number | null;
    lastMergedTotalSegments: number | null;
    errorMessage: string;
    rainDifficulty?: string;
    adaptiveMode?: string;
    adaptiveDecision?: string;
    adaptiveStreak?: number;
    windowSize?: number;
    windowAccuracy?: number | null;
    windowMissRate?: number | null;
    adaptiveSamplingStep?: number;
    activeBlanks?: number;
    fallSpeed?: number;
    fallLeadTimeOffset?: number;
    minFallDuration?: number;
    missGraceSeconds?: number;
    adaptiveMaxCombo?: number;
    activeKeywordId?: string | null;
    pendingKeywordCount?: number;
    visibleKeywordCount?: number;
    nextTargetTime?: number | null;
    nextFallDuration?: number | null;
    missedKeywordCount?: number;
    lastJudgement?: string | null;
    rafCurrentTime?: number;
    activeKeywordTargetTime?: number | null;
    activeKeywordSegmentId?: number | null;
    preparedFallEvents?: number;
    unmatchedFallEvents?: number;
    droppedByBlankLimit?: number;
    duplicateKeywordCandidates?: number;
    invalidTargetTimeCount?: number;
    editingBlankKey?: string | null;
    isCaptionComposing?: boolean;
    captionSegmentId?: number | null;
    prunedTypedValueCount?: number;
    tabSwitchCount?: number;
    mascotVisualState?: string;
    mascotPromptType?: string;
    isStretchGuideOpen?: boolean;
    stretchCountdownSeconds?: number;
    focusMessage?: string | null;
    hasShownStretchPrompt?: boolean;
  };
}

function PlayerDebugPanel({ debug }: PlayerDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[100] rounded-[12px] border border-[#334155] bg-[rgba(15,23,42,0.92)] px-4 py-2 text-[12px] font-semibold text-sky-300 shadow-[0_14px_36px_rgba(0,0,0,0.35)]"
      >
        Debug 열기
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[320px] rounded-[14px] border border-[#334155] bg-[rgba(15,23,42,0.92)] p-4 text-left text-[12px] leading-[1.5] text-slate-200 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-semibold text-sky-300">Debug</p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-[8px] border border-[#334155] px-2 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/5"
        >
          숨기기
        </button>
      </div>
      <div>sessionId: {debug.sessionId ?? '-'}</div>
      <div>state: {debug.state}</div>
      <div>aiStatus: {debug.currentAiStatus ?? '-'}</div>
      <div>isStreamingCurrentSession: {String(debug.isStreamingCurrentSession)}</div>
      {debug.activeStreamStrategy !== undefined ? (
        <div>activeStreamStrategy: {debug.activeStreamStrategy ?? '-'}</div>
      ) : null}
      {debug.actualStreamRequestKey !== undefined ? (
        <div>actualStreamRequestKey: {debug.actualStreamRequestKey ?? '-'}</div>
      ) : null}
      {debug.shouldResumeFileCurrentSession !== undefined ? (
        <div>shouldResumeFileCurrentSession: {String(debug.shouldResumeFileCurrentSession)}</div>
      ) : null}
      {debug.recoveryStrategy !== undefined ? (
        <div>recoveryStrategy: {debug.recoveryStrategy ?? '-'}</div>
      ) : null}
      {debug.hasStartedStreamRequest !== undefined ? (
        <div>hasStartedStreamRequest: {String(debug.hasStartedStreamRequest)}</div>
      ) : null}
      {debug.lastStreamRequestType !== undefined ? (
        <div>lastStreamRequestType: {debug.lastStreamRequestType ?? '-'}</div>
      ) : null}
      <div>streamingSourceType: {debug.streamingSourceType ?? '-'}</div>
      <div>streamingSourceSessionId: {debug.streamingSourceSessionId ?? '-'}</div>
      {debug.hasVideoUrl !== undefined ? <div>hasVideoUrl: {String(debug.hasVideoUrl)}</div> : null}
      {debug.hasStartGameData !== undefined ? (
        <div>hasStartGameData: {String(debug.hasStartGameData)}</div>
      ) : null}
      <div>lastStreamEventType: {debug.lastStreamEventType || '-'}</div>
      <div>loadedSegments: {debug.loadedSegments}</div>
      <div>loadedQuizzes: {debug.loadedQuizzes}</div>
      <div>loadedFallEvents: {debug.loadedFallEvents}</div>
      <div>loadedChapterIndexes: {debug.loadedChapterIndexes.join(', ') || '-'}</div>
      <div>lastChunkSegments: {debug.lastChunkSegments ?? '-'}</div>
      <div>lastMergedTotalSegments: {debug.lastMergedTotalSegments ?? '-'}</div>
      {typeof debug.activeBlanks === 'number' ? <div>activeBlanks: {debug.activeBlanks}</div> : null}
      {typeof debug.fallSpeed === 'number' ? <div>fallSpeed: {debug.fallSpeed}</div> : null}
      {typeof debug.minFallDuration === 'number' ? (
        <div>minFallDuration: {debug.minFallDuration}</div>
      ) : null}
      {typeof debug.pendingKeywordCount === 'number' ? (
        <div>pendingKeywordCount: {debug.pendingKeywordCount}</div>
      ) : null}
      {typeof debug.visibleKeywordCount === 'number' ? (
        <div>visibleKeywordCount: {debug.visibleKeywordCount}</div>
      ) : null}
      {typeof debug.nextTargetTime === 'number' ? (
        <div>nextTargetTime: {debug.nextTargetTime.toFixed(2)}</div>
      ) : null}
      {typeof debug.nextFallDuration === 'number' ? (
        <div>nextFallDuration: {debug.nextFallDuration.toFixed(2)}</div>
      ) : null}
      {typeof debug.rafCurrentTime === 'number' ? (
        <div>rafCurrentTime: {debug.rafCurrentTime.toFixed(2)}</div>
      ) : null}
      {typeof debug.activeKeywordTargetTime === 'number' ? (
        <div>activeKeywordTargetTime: {debug.activeKeywordTargetTime.toFixed(2)}</div>
      ) : null}
      {typeof debug.activeKeywordSegmentId === 'number' ? (
        <div>activeKeywordSegmentId: {debug.activeKeywordSegmentId}</div>
      ) : null}
      {typeof debug.missedKeywordCount === 'number' ? (
        <div>missedKeywordCount: {debug.missedKeywordCount}</div>
      ) : null}
      {typeof debug.preparedFallEvents === 'number' ? (
        <div>preparedFallEvents: {debug.preparedFallEvents}</div>
      ) : null}
      {typeof debug.unmatchedFallEvents === 'number' ? (
        <div>unmatchedFallEvents: {debug.unmatchedFallEvents}</div>
      ) : null}
      {typeof debug.droppedByBlankLimit === 'number' ? (
        <div>droppedByBlankLimit: {debug.droppedByBlankLimit}</div>
      ) : null}
      {typeof debug.duplicateKeywordCandidates === 'number' ? (
        <div>duplicateKeywordCandidates: {debug.duplicateKeywordCandidates}</div>
      ) : null}
      {typeof debug.invalidTargetTimeCount === 'number' ? (
        <div>invalidTargetTimeCount: {debug.invalidTargetTimeCount}</div>
      ) : null}
      {debug.editingBlankKey !== undefined ? (
        <div>editingBlankKey: {debug.editingBlankKey ?? '-'}</div>
      ) : null}
      {debug.isCaptionComposing !== undefined ? (
        <div>isCaptionComposing: {String(debug.isCaptionComposing)}</div>
      ) : null}
      {typeof debug.captionSegmentId === 'number' ? (
        <div>captionSegmentId: {debug.captionSegmentId}</div>
      ) : null}
      {typeof debug.prunedTypedValueCount === 'number' ? (
        <div>prunedTypedValueCount: {debug.prunedTypedValueCount}</div>
      ) : null}
      {typeof debug.tabSwitchCount === 'number' ? (
        <div>tabSwitchCount: {debug.tabSwitchCount}</div>
      ) : null}
      {debug.mascotVisualState !== undefined ? <div>mascotVisualState: {debug.mascotVisualState}</div> : null}
      {debug.mascotPromptType !== undefined ? <div>mascotPromptType: {debug.mascotPromptType}</div> : null}
      {debug.isStretchGuideOpen !== undefined ? (
        <div>isStretchGuideOpen: {String(debug.isStretchGuideOpen)}</div>
      ) : null}
      {typeof debug.stretchCountdownSeconds === 'number' ? (
        <div>stretchCountdownSeconds: {debug.stretchCountdownSeconds}</div>
      ) : null}
      {debug.focusMessage !== undefined ? <div>focusMessage: {debug.focusMessage ?? '-'}</div> : null}
      {debug.hasShownStretchPrompt !== undefined ? (
        <div>hasShownStretchPrompt: {String(debug.hasShownStretchPrompt)}</div>
      ) : null}
      {debug.activeKeywordId !== undefined ? <div>activeKeywordId: {debug.activeKeywordId ?? '-'}</div> : null}
      {debug.lastJudgement !== undefined ? <div>lastJudgement: {debug.lastJudgement ?? '-'}</div> : null}
      <div className="mt-2 break-words text-rose-300">errorMessage: {debug.errorMessage || '-'}</div>
      {debug.rainDifficulty !== undefined ? <div className="mt-2">rainDifficulty: {debug.rainDifficulty}</div> : null}
      {debug.adaptiveMode !== undefined ? <div>adaptiveMode: {debug.adaptiveMode}</div> : null}
      {debug.adaptiveDecision !== undefined ? <div>adaptiveDecision: {debug.adaptiveDecision}</div> : null}
      {typeof debug.adaptiveStreak === 'number' ? (
        <div>adaptiveStreak: {debug.adaptiveStreak}</div>
      ) : null}
      {typeof debug.windowSize === 'number' ? <div>windowSize: {debug.windowSize}</div> : null}
      {typeof debug.windowAccuracy === 'number' ? (
        <div>windowAccuracy: {debug.windowAccuracy}</div>
      ) : null}
      {typeof debug.windowMissRate === 'number' ? (
        <div>windowMissRate: {debug.windowMissRate}</div>
      ) : null}
      {typeof debug.adaptiveSamplingStep === 'number' ? (
        <div>adaptiveSamplingStep: {debug.adaptiveSamplingStep}</div>
      ) : null}
      {typeof debug.fallLeadTimeOffset === 'number' ? (
        <div>fallLeadTimeOffset: {debug.fallLeadTimeOffset}</div>
      ) : null}
      {typeof debug.missGraceSeconds === 'number' ? (
        <div>missGraceSeconds: {debug.missGraceSeconds}</div>
      ) : null}
      {typeof debug.adaptiveMaxCombo === 'number' ? (
        <div>adaptiveMaxCombo: {debug.adaptiveMaxCombo}</div>
      ) : null}
    </div>
  );
}

export default PlayerDebugPanel;
