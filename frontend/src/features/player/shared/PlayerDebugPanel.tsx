interface PlayerDebugPanelProps {
  debug: {
    sessionId: string | null;
    state: string;
    currentAiStatus: string | null;
    isStreamingCurrentSession: boolean;
    activeStreamStrategy?: string | null;
    shouldResumeFileCurrentSession?: boolean;
    recoveryStrategy?: string | null;
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
    activeBlanks?: number;
    fallSpeed?: number;
    minFallDuration?: number;
    missGraceSeconds?: number;
    activeKeywordId?: string | null;
    pendingKeywordCount?: number;
    visibleKeywordCount?: number;
    nextTargetTime?: number | null;
    nextFallDuration?: number | null;
    missedKeywordCount?: number;
    lastJudgement?: string | null;
    preparedFallEvents?: number;
    unmatchedFallEvents?: number;
    droppedByBlankLimit?: number;
    duplicateKeywordCandidates?: number;
  };
}

function PlayerDebugPanel({ debug }: PlayerDebugPanelProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[320px] rounded-[14px] border border-[#334155] bg-[rgba(15,23,42,0.92)] p-4 text-left text-[12px] leading-[1.5] text-slate-200 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
      <p className="mb-2 font-semibold text-sky-300">Debug</p>
      <div>sessionId: {debug.sessionId ?? '-'}</div>
      <div>state: {debug.state}</div>
      <div>aiStatus: {debug.currentAiStatus ?? '-'}</div>
      <div>isStreamingCurrentSession: {String(debug.isStreamingCurrentSession)}</div>
      {debug.activeStreamStrategy !== undefined ? (
        <div>activeStreamStrategy: {debug.activeStreamStrategy ?? '-'}</div>
      ) : null}
      {debug.shouldResumeFileCurrentSession !== undefined ? (
        <div>shouldResumeFileCurrentSession: {String(debug.shouldResumeFileCurrentSession)}</div>
      ) : null}
      {debug.recoveryStrategy !== undefined ? (
        <div>recoveryStrategy: {debug.recoveryStrategy ?? '-'}</div>
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
      {debug.rainDifficulty !== undefined ? <div>rainDifficulty: {debug.rainDifficulty}</div> : null}
      {typeof debug.activeBlanks === 'number' ? <div>activeBlanks: {debug.activeBlanks}</div> : null}
      {typeof debug.fallSpeed === 'number' ? <div>fallSpeed: {debug.fallSpeed}</div> : null}
      {typeof debug.minFallDuration === 'number' ? (
        <div>minFallDuration: {debug.minFallDuration}</div>
      ) : null}
      {typeof debug.missGraceSeconds === 'number' ? (
        <div>missGraceSeconds: {debug.missGraceSeconds}</div>
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
      {debug.activeKeywordId !== undefined ? <div>activeKeywordId: {debug.activeKeywordId ?? '-'}</div> : null}
      {debug.lastJudgement !== undefined ? <div>lastJudgement: {debug.lastJudgement ?? '-'}</div> : null}
      <div className="mt-2 break-words text-rose-300">errorMessage: {debug.errorMessage || '-'}</div>
    </div>
  );
}

export default PlayerDebugPanel;
