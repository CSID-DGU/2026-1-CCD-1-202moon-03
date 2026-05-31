import { useState } from 'react';

interface PlayerDebugPanelProps {
  debug: {
    [key: string]: unknown;
    sessionId: string | null;
    state: string;
    currentAiStatus: string | null;
    playerType?: string;
    playerSrc?: string;
    isPlayerReady?: boolean;
    loadedSegments: number;
    loadedQuizzes: number;
    loadedFallEvents: number;
    preparedFallEvents?: number;
    missingSegmentEvents?: number;
    missingBlankMatchEvents?: number;
    missingBlankMatchDetails?: string | null;
    droppedByBlankLimit?: number;
    invalidTargetTimeCount?: number;
    rainDifficulty?: string;
    adaptiveMode?: string;
    adaptiveDecision?: string;
    adaptiveStreak?: number;
    windowAccuracy?: number | null;
    windowMissRate?: number | null;
    adaptiveSamplingStep?: number;
    activeBlanks?: number;
    fallSpeed?: number;
    fallLeadTimeOffset?: number;
    minFallDuration?: number;
    missGraceSeconds?: number;
    videoTimeSeconds?: number | null;
    activeKeywordId?: string | null;
    activeKeywordSegmentId?: number | null;
    prioritizedSegmentId?: number | null;
    pendingKeywordCount?: number;
    visibleKeywordCount?: number;
    visibleKeywordStates?: string | null;
    lastJudgement?: string | null;
    tabSwitchCount?: number;
    errorMessage: string;
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-3 first:mt-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-300/90">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="break-words">
      {label}: {value}
    </div>
  );
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== 'number') {
    return '-';
  }

  return value.toFixed(digits);
}

function PlayerDebugPanel({ debug }: PlayerDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="fixed bottom-4 right-4 z-[100] w-[340px] rounded-[14px] border border-[#334155] bg-[rgba(15,23,42,0.92)] p-4 text-left text-[12px] leading-[1.5] text-slate-200 shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
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

      <Section title="Session">
        <Row label="sessionId" value={debug.sessionId ?? '-'} />
        <Row label="state" value={debug.state} />
        <Row label="aiStatus" value={debug.currentAiStatus ?? '-'} />
        <div className="mt-1 break-words text-rose-300">errorMessage: {debug.errorMessage || '-'}</div>
      </Section>

      <Section title="Player">
        <Row label="playerType" value={debug.playerType ?? '-'} />
        <Row label="playerSrc" value={debug.playerSrc || '-'} />
        <Row label="isPlayerReady" value={String(debug.isPlayerReady ?? false)} />
      </Section>

      <Section title="Data">
        <Row label="loadedSegments" value={debug.loadedSegments} />
        <Row label="loadedQuizzes" value={debug.loadedQuizzes} />
        <Row label="loadedFallEvents" value={debug.loadedFallEvents} />
        <Row label="preparedFallEvents" value={debug.preparedFallEvents ?? '-'} />
        <Row label="missingSegmentEvents" value={debug.missingSegmentEvents ?? '-'} />
        <Row label="missingBlankMatchEvents" value={debug.missingBlankMatchEvents ?? '-'} />
        <Row label="missingBlankMatchDetails" value={debug.missingBlankMatchDetails ?? '-'} />
        <Row label="droppedByBlankLimit" value={debug.droppedByBlankLimit ?? '-'} />
        <Row label="invalidTargetTimeCount" value={debug.invalidTargetTimeCount ?? '-'} />
      </Section>

      <Section title="Difficulty">
        <Row label="adaptiveMode" value={debug.adaptiveMode ?? '-'} />
        <Row label="rainDifficulty" value={debug.rainDifficulty ?? '-'} />
        <Row label="activeBlanks" value={debug.activeBlanks ?? '-'} />
        <Row label="fallSpeed" value={formatNumber(debug.fallSpeed)} />
        <Row label="adaptiveSamplingStep" value={debug.adaptiveSamplingStep ?? '-'} />
        <Row label="minFallDuration" value={formatNumber(debug.minFallDuration)} />
        <Row label="fallLeadTimeOffset" value={formatNumber(debug.fallLeadTimeOffset)} />
        <Row label="missGraceSeconds" value={formatNumber(debug.missGraceSeconds)} />
        <Row label="adaptiveDecision" value={debug.adaptiveDecision ?? '-'} />
        <Row label="adaptiveStreak" value={debug.adaptiveStreak ?? '-'} />
        <Row label="windowAccuracy" value={formatNumber(debug.windowAccuracy)} />
        <Row label="windowMissRate" value={formatNumber(debug.windowMissRate)} />
      </Section>

      <Section title="Rain">
        <Row label="videoTimeSeconds" value={formatNumber(debug.videoTimeSeconds)} />
        <Row label="activeKeywordId" value={debug.activeKeywordId ?? '-'} />
        <Row label="activeKeywordSegmentId" value={debug.activeKeywordSegmentId ?? '-'} />
        <Row label="prioritizedSegmentId" value={debug.prioritizedSegmentId ?? '-'} />
        <Row label="pendingKeywordCount" value={debug.pendingKeywordCount ?? '-'} />
        <Row label="visibleKeywordCount" value={debug.visibleKeywordCount ?? '-'} />
        <Row label="visibleKeywordStates" value={debug.visibleKeywordStates ?? '-'} />
        <Row label="lastJudgement" value={debug.lastJudgement ?? '-'} />
      </Section>

      <Section title="Meta">
        <Row label="tabSwitchCount" value={debug.tabSwitchCount ?? '-'} />
      </Section>
    </div>
  );
}

export default PlayerDebugPanel;
