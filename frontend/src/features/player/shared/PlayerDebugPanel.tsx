interface PlayerDebugPanelProps {
  debug: {
    sessionId: string | null;
    state: string;
    currentAiStatus: string | null;
    isStreamingCurrentSession: boolean;
    streamingSourceType: string | null;
    streamingSourceSessionId: string | null;
    loadedSegments: number;
    loadedQuizzes: number;
    loadedFallEvents: number;
    loadedChapterIndexes: number[];
    lastStreamEventType: string;
    errorMessage: string;
  };
}

function PlayerDebugPanel({ debug }: PlayerDebugPanelProps) {
  return (
    <div className="fixed bottom-4 left-4 z-[100] w-[320px] rounded-[14px] border border-[#334155] bg-[rgba(15,23,42,0.92)] p-4 text-left text-[12px] leading-[1.5] text-slate-200 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
      <p className="mb-2 font-semibold text-sky-300">Debug</p>
      <div>sessionId: {debug.sessionId ?? '-'}</div>
      <div>state: {debug.state}</div>
      <div>aiStatus: {debug.currentAiStatus ?? '-'}</div>
      <div>isStreamingCurrentSession: {String(debug.isStreamingCurrentSession)}</div>
      <div>streamingSourceType: {debug.streamingSourceType ?? '-'}</div>
      <div>streamingSourceSessionId: {debug.streamingSourceSessionId ?? '-'}</div>
      <div>lastStreamEventType: {debug.lastStreamEventType || '-'}</div>
      <div>loadedSegments: {debug.loadedSegments}</div>
      <div>loadedQuizzes: {debug.loadedQuizzes}</div>
      <div>loadedFallEvents: {debug.loadedFallEvents}</div>
      <div>loadedChapterIndexes: {debug.loadedChapterIndexes.join(', ') || '-'}</div>
      <div className="mt-2 break-words text-rose-300">errorMessage: {debug.errorMessage || '-'}</div>
    </div>
  );
}

export default PlayerDebugPanel;
