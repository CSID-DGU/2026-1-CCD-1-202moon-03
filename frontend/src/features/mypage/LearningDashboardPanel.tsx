import { useEffect, useState, type ReactNode } from 'react';
import type {
  LearningDashboardData,
  LearningDashboardDailyResult,
  LearningDashboardSession,
} from '../../types';
import mascotHoverIcon from '../../assets/icons/mascot_hover.svg';

type ChartPoint = {
  label: string;
  value: number;
};

type TrendTone = 'blue' | 'green';

const PRIMARY_COLOR = '#2563EB';
const ACCENT_COLOR = '#22C55E';

const QUIZ_ACCURACY_DUMMY_POINTS: ChartPoint[] = [
  { label: '1주', value: 72 },
  { label: '2주', value: 81 },
  { label: '3주', value: 89 },
  { label: '4주', value: 84 },
  { label: '5주', value: 92 },
];

const TYPING_ACCURACY_DUMMY_POINTS: ChartPoint[] = [
  { label: '1주', value: 61 },
  { label: '2주', value: 69 },
  { label: '3주', value: 74 },
  { label: '4주', value: 82 },
  { label: '5주', value: 87 },
];

const MOCK_DASHBOARD_DATA: LearningDashboardData = {
  summary: {
    total_study_duration_seconds: 7980,
    average_quiz_accuracy: 81,
    average_typing_accuracy: 86,
    average_tab_leave_count: 0.8,
  },
  trends: {
    study_time: [
      { date: '2026-06-01', seconds: 960 },
      { date: '2026-06-02', seconds: 1380 },
      { date: '2026-06-03', seconds: 720 },
      { date: '2026-06-04', seconds: 1740 },
      { date: '2026-06-05', seconds: 1980 },
      { date: '2026-06-06', seconds: 1200 },
      { date: '2026-06-07', seconds: 0 },
    ],
    quiz_accuracy: [
      { week: '2026-05-04', accuracy: 68 },
      { week: '2026-05-11', accuracy: 74 },
      { week: '2026-05-18', accuracy: 71 },
      { week: '2026-05-25', accuracy: 78 },
      { week: '2026-06-01', accuracy: 84 },
    ],
    typing_accuracy: [
      { week: '2026-05-04', accuracy: 0.73 },
      { week: '2026-05-11', accuracy: 0.79 },
      { week: '2026-05-18', accuracy: 0.76 },
      { week: '2026-05-25', accuracy: 0.83 },
      { week: '2026-06-01', accuracy: 0.88 },
    ],
  },
  focus_stats: {
    this_week_tab_leave_count: 2,
    tab_leave_change_rate: -33,
  },
  daily_results: [
    {
      date: '2026-06-05',
      session_count: 3,
      total_study_duration_seconds: 1980,
      average_quiz_accuracy: 85,
      average_typing_accuracy: 89,
      total_tab_leave_count: 1,
    },
    {
      date: '2026-06-04',
      session_count: 2,
      total_study_duration_seconds: 1740,
      average_quiz_accuracy: 80,
      average_typing_accuracy: 86,
      total_tab_leave_count: 1,
    },
    {
      date: '2026-06-03',
      session_count: 1,
      total_study_duration_seconds: 720,
      average_quiz_accuracy: 74,
      average_typing_accuracy: 81,
      total_tab_leave_count: 0,
    },
    {
      date: '2026-06-02',
      session_count: 2,
      total_study_duration_seconds: 1380,
      average_quiz_accuracy: 79,
      average_typing_accuracy: 84,
      total_tab_leave_count: 0,
    },
    {
      date: '2026-06-01',
      session_count: 1,
      total_study_duration_seconds: 960,
      average_quiz_accuracy: 72,
      average_typing_accuracy: 76,
      total_tab_leave_count: 0,
    },
  ],
  sessions: [
    {
      session_id: 9001,
      title: '한국사능력검정 심화 12강 - 조선 후기 정치',
      mode: 'rain',
      completed_at: '2026-06-05T19:40:00',
      watch_rate: 0.94,
      total_score: 460,
      typing_accuracy: 0.91,
      quiz_correct: 8,
      quiz_total: 10,
      tab_leave_count: 1,
      study_duration_seconds: 840,
    },
    {
      session_id: 9002,
      title: '화학 I 개념 확인 - 몰과 화학식량',
      mode: 'fidget',
      completed_at: '2026-06-05T20:35:00',
      watch_rate: 0.9,
      total_score: 0,
      typing_accuracy: 0,
      quiz_correct: 4,
      quiz_total: 5,
      tab_leave_count: 0,
      study_duration_seconds: 540,
    },
    {
      session_id: 9003,
      title: '한국사능력검정 핵심 퀴즈 복습',
      mode: 'rain',
      completed_at: '2026-06-05T21:10:00',
      watch_rate: 0.91,
      total_score: 520,
      typing_accuracy: 0.88,
      quiz_correct: 9,
      quiz_total: 10,
      tab_leave_count: 0,
      study_duration_seconds: 600,
    },
    {
      session_id: 9004,
      title: '화학 I 8강 - 중화 반응 문제 풀이',
      mode: 'rain',
      completed_at: '2026-06-04T18:20:00',
      watch_rate: 0.9,
      total_score: 380,
      typing_accuracy: 0.84,
      quiz_correct: 6,
      quiz_total: 8,
      tab_leave_count: 1,
      study_duration_seconds: 900,
    },
    {
      session_id: 9005,
      title: '한국사 특강 - 흥선대원군의 개혁 정책',
      mode: 'rain',
      completed_at: '2026-06-04T20:10:00',
      watch_rate: 0.93,
      total_score: 440,
      typing_accuracy: 0.88,
      quiz_correct: 7,
      quiz_total: 9,
      tab_leave_count: 0,
      study_duration_seconds: 840,
    },
    {
      session_id: 9006,
      title: '화학 I 빈출 용어 정리 - 산화와 환원',
      mode: 'rain',
      completed_at: '2026-06-03T21:00:00',
      watch_rate: 0.89,
      total_score: 300,
      typing_accuracy: 0.81,
      quiz_correct: 5,
      quiz_total: 7,
      tab_leave_count: 0,
      study_duration_seconds: 720,
    },
    {
      session_id: 9007,
      title: '한국사 입문 3강 - 고려의 통치 체제',
      mode: 'rain',
      completed_at: '2026-06-02T19:15:00',
      watch_rate: 0.87,
      total_score: 340,
      typing_accuracy: 0.82,
      quiz_correct: 6,
      quiz_total: 8,
      tab_leave_count: 0,
      study_duration_seconds: 660,
    },
    {
      session_id: 9008,
      title: '화학 I 개념 점검 - 원자의 구조',
      mode: 'fidget',
      completed_at: '2026-06-02T20:30:00',
      watch_rate: 0.9,
      total_score: 0,
      typing_accuracy: 0,
      quiz_correct: 3,
      quiz_total: 5,
      tab_leave_count: 0,
      study_duration_seconds: 720,
    },
    {
      session_id: 9009,
      title: '한국사 개념 미리보기 - 조선의 신분제',
      mode: 'rain',
      completed_at: '2026-06-01T20:10:00',
      watch_rate: 0.85,
      total_score: 260,
      typing_accuracy: 0.76,
      quiz_correct: 5,
      quiz_total: 7,
      tab_leave_count: 0,
      study_duration_seconds: 960,
    },
  ],
};

interface LearningDashboardPanelProps {
  dashboard: LearningDashboardData | null;
  formatDisplayedStudyTime: (totalStudySeconds: number) => string;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  const [, month = '', day = ''] = value.split('-');
  return `${month}.${day}`;
}

function formatTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getModeDisplayLabel(mode: string) {
  if (mode === 'rain') {
    return '집중호우';
  }

  if (mode === 'spinner' || mode === 'fidget') {
    return '피젯';
  }

  return mode;
}

function getWeekdayLabel(date: Date) {
  const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];
  return weekdayLabels[date.getDay()];
}

function normalizeAccuracyValue(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, normalized));
}

function formatStudyTime(totalStudySeconds: number) {
  if (totalStudySeconds <= 0) {
    return '0분';
  }

  const hours = Math.floor(totalStudySeconds / 3600);
  const minutes = Math.round((totalStudySeconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  }

  return `${minutes}분`;
}

function formatPercentValue(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return `${Math.round(normalizeAccuracyValue(value))}%`;
}

function formatAverageTabLeave(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return `${value.toFixed(1)}회`;
}

function formatSignedDelta(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '변화 없음';
  }

  const rounded = Math.round(Math.abs(value));
  if (rounded === 0) {
    return '지난주와 동일';
  }

  return `${value > 0 ? '▲' : '▼'} ${rounded}% ${value > 0 ? '증가' : '감소'}`;
}

function getDeltaTone(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) {
    return 'text-[#64748B]';
  }

  return value > 0 ? 'text-[#2563EB]' : 'text-[#16A34A]';
}

function toChangeRate(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return ((current - previous) / previous) * 100;
}

function getWeekLabel(index: number) {
  return `${index + 1}주`;
}

function buildStudyTimePoints(dashboard: LearningDashboardData | null): ChartPoint[] {
  const trendPoints = dashboard?.trends.study_time ?? [];
  const dailyDates = dashboard?.daily_results.map((item) => item.date) ?? [];
  const allDates = [...trendPoints.map((point) => point.date), ...dailyDates];

  if (allDates.length === 0) {
    return [];
  }

  const parsedDates = allDates
    .map(parseDateKey)
    .filter((date): date is Date => date !== null)
    .sort((left, right) => left.getTime() - right.getTime());

  if (parsedDates.length === 0) {
    return [];
  }

  const valueByDate = new Map(
    trendPoints.map((point) => [point.date, Math.max(0, Math.round(point.seconds / 60))]),
  );

  const firstDate = parsedDates[0];
  const lastDate = parsedDates[parsedDates.length - 1];
  const cursor = new Date(firstDate);
  const filledPoints: ChartPoint[] = [];

  while (cursor.getTime() <= lastDate.getTime()) {
    const dateKey = formatDateKey(cursor);

    filledPoints.push({
      label: getWeekdayLabel(cursor),
      value: valueByDate.get(dateKey) ?? 0,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  const recentWeekPoints = filledPoints.slice(-7);
  const mondayFirstLabels = ['월', '화', '수', '목', '금', '토', '일'];
  const pointsByWeekday = new Map<string, number>();

  for (let index = recentWeekPoints.length - 1; index >= 0; index -= 1) {
    const point = recentWeekPoints[index];

    if (!pointsByWeekday.has(point.label)) {
      pointsByWeekday.set(point.label, point.value);
    }
  }

  return mondayFirstLabels.map((label) => ({
    label,
    value: pointsByWeekday.get(label) ?? 0,
  }));
}

function sumLast(points: ChartPoint[], count: number, offset = 0) {
  return points
    .slice(Math.max(0, points.length - count - offset), Math.max(0, points.length - offset))
    .reduce((total, point) => total + point.value, 0);
}

function averageLast(points: ChartPoint[], count: number, offset = 0) {
  const target = points.slice(
    Math.max(0, points.length - count - offset),
    Math.max(0, points.length - offset),
  );

  if (target.length === 0) {
    return 0;
  }

  return target.reduce((total, point) => total + point.value, 0) / target.length;
}

function getFocusScore(tabLeaveCount: number, changeRate: number) {
  const baseScore = 96 - tabLeaveCount * 7;
  const bonus = changeRate < 0 ? Math.min(12, Math.abs(changeRate) * 0.12) : 0;
  return Math.max(45, Math.min(100, Math.round(baseScore + bonus)));
}

function getFocusBadge(score: number) {
  if (score >= 90) {
    return '매우 집중 상태';
  }

  if (score >= 75) {
    return '안정적인 집중 상태';
  }

  if (score >= 60) {
    return '집중 회복 중';
  }

  return '집중 관리 필요';
}

function getWeeklyReportMessages(params: {
  studyTimeDelta: number;
  tabLeaveChangeRate: number;
  typingDelta: number;
  focusScore: number;
}) {
  const messages: string[] = [];

  messages.push(
    params.studyTimeDelta >= 0
      ? '학습 시간이 지난주보다 늘어나며 좋은 흐름을 이어가고 있어요.'
      : '학습시간이 잠시 줄었지만 학습 흐름은 유지되고 있습니다.',
  );

  messages.push(
    params.tabLeaveChangeRate <= 0
      ? '이탈 횟수가 줄어들며 집중 흐름도 더 안정적으로 유지되고 있어요.'
      : '집중 흐름을 더 단단하게 만들 여지가 보입니다.',
  );

  messages.push(
    params.typingDelta >= 0
      ? '입력 성공률이 높아지며 학습 몰입도도 함께 좋아지고 있어요.'
      : '입력 성공률은 잠시 주춤했지만 다음 학습에서 충분히 회복할 수 있습니다.',
  );

  if (params.focusScore >= 90) {
    messages.push('이번 주는 전반적으로 아주 좋은 학습 리듬을 만들고 있습니다.');
  }

  return messages.slice(0, 3);
}

function getStudyTimeInsight(points: ChartPoint[]) {
  const activePoints = points.filter((point) => point.value > 0);

  if (activePoints.length === 0) {
    return '이번 주 학습 기록이 아직 많지 않아요. 짧게라도 꾸준히 이어가보세요.';
  }

  const strongestDay = activePoints.reduce((best, current) =>
    current.value > best.value ? current : best,
  );

  return `${strongestDay.label}요일에 가장 오래 학습했어요. 현재 흐름을 유지해보세요.`;
}

function getTrendInsight(type: 'quiz' | 'typing', delta: number) {
  if (type === 'quiz') {
    if (delta >= 10) {
      return '최근 5주 기준 퀴즈 정답률이 뚜렷하게 상승하고 있어요.';
    }

    if (delta >= 0) {
      return '최근 5주 기준 퀴즈 정답률이 안정적으로 회복 중이에요.';
    }

    return '최근 5주 기준 퀴즈 정답률이 잠시 주춤했어요.';
  }

  if (delta >= 10) {
    return '입력 성공률이 꾸준히 상승하며 학습 리듬이 좋아지고 있어요.';
  }

  if (delta >= 0) {
    return '입력 성공률이 전반적으로 안정적인 흐름을 유지하고 있어요.';
  }

  return '입력 성공률이 잠시 흔들렸지만 다시 회복할 여지가 충분해요.';
}

function getFocusInsight(count: number, changeRate: number, score: number) {
  if (count === 0) {
    return '이번 주에는 이탈 없이 아주 안정적인 집중 흐름을 유지했어요.';
  }

  if (changeRate < 0) {
    return '지난주보다 이탈 횟수가 줄면서 집중 흐름이\n더 안정되고 있어요.';
  }

  if (score >= 75) {
    return '전반적인 집중 흐름은 안정적이에요. 지금 리듬을 유지해보세요.';
  }

  return '탭 전환을 조금만 더 줄이면 집중도가 더 빠르게 회복될 수 있어요.';
}

function CardShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-[#E6ECF5] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="1.9">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" strokeLinecap="round" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8" strokeLinecap="round" />
    </svg>
  );
}

function TabIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="4" y="5" width="12" height="14" rx="2.5" />
      <path d="M4 9h12" strokeLinecap="round" />
      <path d="M13 7h.01" strokeLinecap="round" />
      <path d="m13.5 14.5 6-6" strokeLinecap="round" />
      <path d="M16 8.5h3.5V12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2 className="text-[30px] font-bold leading-[1.2] tracking-[-0.035em] text-[#0F172A]">
        {children}
      </h2>
    </div>
  );
}

function KPIIconWrap({
  colorClass,
  children,
}: {
  colorClass: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${colorClass}`}>
      {children}
    </div>
  );
}

function DashboardStatSummaryCard({
  label,
  value,
  deltaText,
  deltaValue,
  icon,
  iconColorClass,
  valueClassName = '',
  labelClassName = '',
}: {
  label: string;
  value: string;
  deltaText: string;
  deltaValue?: number | null;
  icon: ReactNode;
  iconColorClass: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <CardShell className="relative px-6 py-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(37,99,235,0.08)]">
      <div className="min-w-0 pr-20">
        <p
          className={`whitespace-nowrap text-[14px] font-medium text-[#64748B] ${labelClassName}`}
        >
          {label}
        </p>
          <p
            className={`mt-4 whitespace-nowrap text-[34px] font-black leading-none tracking-[-0.05em] text-[#0F172A] ${valueClassName}`}
          >
            {value}
          </p>
      </div>
      <div className="absolute right-2 top-3">
        <KPIIconWrap colorClass={iconColorClass}>{icon}</KPIIconWrap>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className={`text-[13px] font-semibold ${getDeltaTone(deltaValue)}`}>{deltaText}</span>
        <span className="text-[12px] font-medium text-[#94A3B8]">지난주 대비</span>
      </div>
    </CardShell>
  );
}

function DashboardBarChart({
  title,
  points,
  totalSeconds,
  insight,
}: {
  title: string;
  points: ChartPoint[];
  totalSeconds: number;
  insight: string;
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 10);
  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, index) =>
    Math.round((maxValue / ticks) * (ticks - index)),
  );
  const currentWeekMinutes = sumLast(points, 7);

  return (
    <CardShell className="px-7 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[20px] font-bold tracking-[-0.03em] text-[#0F172A]">{title}</h3>
          <p className="mt-2 text-[14px] text-[#64748B]">
            이번 주 총 학습시간 {formatStudyTime(currentWeekMinutes * 60)}
          </p>
          <p className="mt-2 max-w-[32ch] text-pretty text-[13px] leading-[1.7] text-[#94A3B8]">
            {insight}
          </p>
        </div>
        <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[12px] font-semibold text-[#2563EB]">
          누적 {formatStudyTime(totalSeconds)}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-[48px_minmax(0,1fr)] gap-4">
        <div className="flex h-[236px] flex-col justify-between text-right text-[12px] font-medium text-[#94A3B8]">
          {tickValues.map((tickValue) => (
            <span key={tickValue}>{tickValue}</span>
          ))}
        </div>

        <div className="grid h-[236px] min-w-0" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
          {points.map((point) => {
            const height = Math.max(10, (point.value / maxValue) * 176);

            return (
              <div key={point.label} className="flex min-w-0 flex-col justify-end px-1">
                <div className="relative flex-1 rounded-t-[16px] border-b border-[#E2E8F0]">
                  <div
                    className="absolute bottom-0 left-1/2 w-[min(26px,80%)] -translate-x-1/2 rounded-t-[14px] bg-gradient-to-t from-[#2563EB] via-[#3B82F6] to-[#93C5FD] shadow-[0_8px_18px_rgba(37,99,235,0.18)]"
                    style={{ height }}
                  />
                </div>
                <span className="mt-3 text-center text-[11px] font-semibold tracking-[-0.02em] text-[#64748B]">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}

function DashboardLineChart({
  title,
  points,
  tone,
  insight,
}: {
  title: string;
  points: ChartPoint[];
  tone: TrendTone;
  insight: string;
}) {
  const chartSize = 100;
  const safeValues = points.map((point) => normalizeAccuracyValue(point.value));
  const rawMinValue = safeValues.length > 0 ? Math.min(...safeValues) : 0;
  const rawMaxValue = safeValues.length > 0 ? Math.max(...safeValues) : 100;
  const minValue = Math.max(0, Math.floor((rawMinValue - 5) / 10) * 10);
  const maxValue = Math.min(100, Math.ceil((rawMaxValue + 5) / 10) * 10);
  const range = Math.max(10, maxValue - minValue);
  const tickValues = Array.from({ length: 5 }, (_, index) =>
    Math.round(maxValue - (range / 4) * index),
  );

  const normalizedPoints = points.map((point, index) => {
    const safeValue = normalizeAccuracyValue(point.value);
    const x = ((index + 0.5) / points.length) * chartSize;
    const y = ((maxValue - safeValue) / range) * chartSize;

    return { ...point, x, y };
  });

  const polylinePoints = normalizedPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const strokeColor = tone === 'blue' ? PRIMARY_COLOR : ACCENT_COLOR;
  const softFillColor = tone === 'blue' ? 'rgba(37,99,235,0.08)' : 'rgba(34,197,94,0.08)';
  const latestValue = points[points.length - 1]?.value ?? 0;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoveredPoint = hoveredIndex !== null ? normalizedPoints[hoveredIndex] : null;

  return (
    <CardShell className="px-7 py-6">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h3 className="text-[20px] font-bold tracking-[-0.03em] text-[#0F172A]">{title}</h3>
          <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-[1.6] text-[#64748B]">
            {insight}
          </p>
        </div>
        <span
          className="shrink-0 self-start rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{
            color: strokeColor,
            backgroundColor: softFillColor,
          }}
        >
          최근 {Math.round(normalizeAccuracyValue(latestValue))}%
        </span>
      </div>

      <div className="mt-8 grid grid-cols-[48px_minmax(0,1fr)] gap-4">
        <div className="flex h-[170px] flex-col justify-between text-right text-[12px] font-medium text-[#94A3B8]">
          {tickValues.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="min-w-0">
          <div className="relative h-[170px] w-full">
            {hoveredPoint ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[10px] bg-[#0F172A] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                style={{
                  left: `${hoveredPoint.x}%`,
                  top: `calc(${hoveredPoint.y}% - 10px)`,
                }}
              >
                {hoveredPoint.label} · {Math.round(normalizeAccuracyValue(hoveredPoint.value))}%
              </div>
            ) : null}

            <svg
              viewBox={`0 0 ${chartSize} ${chartSize}`}
              className="block h-[170px] w-full overflow-visible"
              preserveAspectRatio="none"
            >
              {[0, 25, 50, 75, 100].map((lineY) => (
                <line
                  key={lineY}
                  x1="0"
                  x2={chartSize}
                  y1={lineY}
                  y2={lineY}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {normalizedPoints.length > 1 ? (
                <polyline
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
            </svg>

            {normalizedPoints.map((point, index) => {
              const isLast = index === normalizedPoints.length - 1;

              return (
                <span
                  key={point.label}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_6px_14px_rgba(15,23,42,0.12)] transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  tabIndex={0}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    width: isLast ? '14px' : '10px',
                    height: isLast ? '14px' : '10px',
                    backgroundColor: strokeColor,
                    boxShadow: isLast ? `0 0 0 6px ${softFillColor}` : undefined,
                  }}
                  aria-label={`${point.label} ${Math.round(normalizeAccuracyValue(point.value))}%`}
                />
              );
            })}
          </div>

          <div className="mt-4 grid text-[12px] font-semibold text-[#64748B]" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
            {points.map((point) => (
              <span key={point.label} className="text-center">
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function FocusAnalysisCard({
  count,
  changeRate,
  insight,
}: {
  count: number;
  changeRate: number;
  insight: string;
}) {
  const focusScore = getFocusScore(count, changeRate);
  const focusBadge = getFocusBadge(focusScore);

  return (
    <CardShell className="px-7 py-6">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h3 className="text-[20px] font-bold tracking-[-0.03em] text-[#0F172A]">집중도 분석</h3>
          <p className="mt-2 whitespace-nowrap text-[13px] text-[#64748B]">
            학습 집중 흐름을 한눈에 확인해보세요.
          </p>
        </div>
        <span className="shrink-0 self-start whitespace-nowrap rounded-full bg-[#ECFDF3] px-4 py-1 text-[12px] font-semibold text-[#16A34A]">
          {focusBadge}
        </span>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="rounded-[18px] bg-[#F8FAFC] px-5 py-5">
          <p className="whitespace-nowrap text-[14px] font-medium text-[#64748B]">집중도 점수</p>
          <p className="mt-3 text-[36px] font-black leading-none tracking-[-0.05em] text-[#0F172A]">
            {focusScore}점
          </p>
        </div>

        <div className="rounded-[18px] bg-[#F8FAFC] px-5 py-5">
          <div className="flex items-start justify-between gap-2">
            <span className="shrink-0 whitespace-nowrap text-[14px] font-medium text-[#64748B]">이탈 횟수</span>
            <span className="shrink-0 whitespace-nowrap text-[12px] font-semibold text-[#16A34A]">
              {formatSignedDelta(changeRate)}
            </span>
          </div>
          <p className="mt-3 text-[32px] font-black leading-none tracking-[-0.05em] text-[#0F172A]">
            {count}회
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col items-end gap-2">
        <div className="relative w-fit max-w-[34ch] self-start rounded-[18px] border border-[#DCE6F4] bg-white px-4 py-3 text-[13px] leading-[1.75] text-[#64748B] shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
          <span className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-[#DCE6F4] bg-white" />
          <p className="relative z-[1]">
            {insight.split('\n').map((line, index) => (
              <span key={`${line}-${index}`} className="block whitespace-nowrap">
                {line}
              </span>
            ))}
          </p>
        </div>
        <img
          src={mascotHoverIcon}
          alt=""
          aria-hidden="true"
          className="h-[88px] w-auto shrink-0 object-contain"
        />
      </div>
    </CardShell>
  );
}

function DailyResultCards({
  items,
  sessions,
}: {
  items: LearningDashboardDailyResult[];
  sessions: LearningDashboardSession[];
}) {
  const PAGE_SIZE = 9;
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(items[0]?.date ?? null);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, pageCount - 1));
  }, [pageCount]);

  useEffect(() => {
    const visibleDates = new Set(
      items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((item) => item.date),
    );

    if (selectedDate && !visibleDates.has(selectedDate)) {
      setSelectedDate(items[currentPage * PAGE_SIZE]?.date ?? null);
    }
  }, [currentPage, items, selectedDate]);

  const visibleItems = items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selectedSessions = sessions
    .filter((session) => session.completed_at.slice(0, 10) === selectedDate)
    .sort((left, right) => right.completed_at.localeCompare(left.completed_at));

  return (
    <CardShell className="px-7 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[20px] font-bold tracking-[-0.03em] text-[#0F172A]">일자별 학습결과</h3>
          <p className="mt-2 text-[14px] text-[#64748B]">날짜별 학습량과 성과를 빠르게 훑어볼 수 있습니다.</p>
        </div>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE6F4] bg-white text-[#2563EB] transition hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="이전 페이지"
            >
              <ChevronLeftIcon />
            </button>
            <span className="min-w-[52px] text-center text-[13px] font-semibold text-[#64748B]">
              {currentPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={currentPage === pageCount - 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE6F4] bg-white text-[#2563EB] transition hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="다음 페이지"
            >
              <ChevronRightIcon />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <button
            key={item.date}
            type="button"
            onClick={() => setSelectedDate((prev) => (prev === item.date ? null : item.date))}
            className={`rounded-[18px] border bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_100%)] px-5 py-5 text-left shadow-[0_8px_20px_rgba(37,99,235,0.04)] transition hover:-translate-y-0.5 ${
              selectedDate === item.date
                ? 'border-[#2563EB] ring-2 ring-[rgba(37,99,235,0.12)]'
                : 'border-[#DCE6F4]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[18px] font-bold text-[#0F172A]">{item.date.replace(/-/g, '.')}</p>
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                  selectedDate === item.date
                    ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]'
                    : 'border-[#E2E8F0] bg-white text-[#94A3B8]'
                }`}
              >
                <span
                  className={`transition-transform duration-200 ${
                    selectedDate === item.date ? 'rotate-180' : ''
                  }`}
                >
                  <ChevronDownIcon />
                </span>
              </span>
            </div>
            <div className="mt-4 space-y-2 text-[14px] text-[#475569]">
              <p>학습 {item.session_count}회</p>
              <p>총 {formatStudyTime(item.total_study_duration_seconds)}</p>
              <p>평균 정답률 {formatPercentValue(item.average_quiz_accuracy)}</p>
            </div>
            <p className="mt-4 text-[12px] font-semibold text-[#2563EB]">
              {selectedDate === item.date ? '세션 상세 접기' : '세션 상세 보기'}
            </p>
          </button>
        ))}
      </div>

      {selectedDate ? (
        <div className="mt-6 rounded-[20px] border border-[#DCE6F4] bg-[#F8FBFF] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-[18px] font-bold tracking-[-0.03em] text-[#0F172A]">
                {selectedDate.replace(/-/g, '.')} 세션 상세
              </h4>
              <p className="mt-1 text-[13px] text-[#64748B]">
                해당 날짜에 학습한 세션 정보를 확인할 수 있습니다.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#2563EB]">
              {selectedSessions.length}개 세션
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {selectedSessions.length > 0 ? (
              selectedSessions.map((session) => {
                const quizAccuracy =
                  session.quiz_total && session.quiz_total > 0
                    ? Math.round((session.quiz_correct / session.quiz_total) * 100)
                    : null;

                return (
                  <article
                    key={session.session_id}
                    className="rounded-[16px] border border-[#E6ECF5] bg-white px-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold text-[#0F172A]">
                        {session.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#64748B]">
                        <span className="rounded-full bg-[#EFF6FF] px-2 py-1 font-semibold text-[#2563EB]">
                          {getModeDisplayLabel(session.mode)}
                        </span>
                        <span>{formatTimeLabel(session.completed_at)}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-[13px] text-[#475569] sm:grid-cols-2 xl:grid-cols-4">
                      <p>학습 시간 {formatStudyTime(session.study_duration_seconds)}</p>
                      <p>정답률 {quizAccuracy !== null ? `${quizAccuracy}%` : '-'}</p>
                      <p>
                        입력 성공률{' '}
                        {session.mode === 'fidget'
                          ? '-'
                          : formatPercentValue(session.typing_accuracy)}
                      </p>
                      <p>이탈 횟수 {session.tab_leave_count}회</p>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[16px] border border-dashed border-[#DCE6F4] bg-white px-4 py-5 text-[14px] text-[#64748B]">
                해당 날짜에 표시할 세션 정보가 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </CardShell>
  );
}

function WeeklyReportCard({
  messages,
}: {
  messages: string[];
}) {
  return (
    <CardShell className="overflow-hidden border-[#DBEAFE] bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_52%,#F0FDF4_100%)] px-7 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#2563EB]">
            <SparkleIcon />
            <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">Weekly Report</span>
          </div>
          <h3 className="mt-3 text-[24px] font-bold tracking-[-0.03em] text-[#0F172A]">
            이번 주 학습 리포트
          </h3>
          <p className="mt-2 text-[14px] text-[#475569]">한 주 동안의 학습 결과를 요약해드릴게요.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {messages.map((message) => (
          <div
            key={message}
            className="flex items-center gap-3 rounded-[16px] border border-[rgba(37,99,235,0.08)] bg-white/80 px-4 py-4 backdrop-blur-sm"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#22C55E]" />
            <p className="text-[15px] leading-[1.6] text-[#334155]">{message}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export function LearningDashboardPanel({
  dashboard,
  formatDisplayedStudyTime,
}: LearningDashboardPanelProps) {
  const shouldUseMockDashboard =
    !dashboard ||
    ((!dashboard.daily_results || dashboard.daily_results.length === 0) &&
      (!dashboard.sessions || dashboard.sessions.length === 0));

  const effectiveDashboard = shouldUseMockDashboard ? MOCK_DASHBOARD_DATA : dashboard;
  const studyTimePoints = buildStudyTimePoints(effectiveDashboard);

  const quizAccuracyTrendPoints =
    effectiveDashboard?.trends.quiz_accuracy.map((point, index) => ({
      label: getWeekLabel(index),
      value: normalizeAccuracyValue(point.accuracy),
    })) ?? [];

  const quizAccuracyPoints =
    quizAccuracyTrendPoints.length >= 2 ? quizAccuracyTrendPoints : QUIZ_ACCURACY_DUMMY_POINTS;

  const typingAccuracyTrendPoints =
    effectiveDashboard?.trends.typing_accuracy.map((point, index) => ({
      label: getWeekLabel(index),
      value: normalizeAccuracyValue(point.accuracy),
    })) ?? [];

  const typingAccuracyPoints =
    typingAccuracyTrendPoints.length >= 2
      ? typingAccuracyTrendPoints
      : TYPING_ACCURACY_DUMMY_POINTS;

  const rawStudyTimeDelta = toChangeRate(sumLast(studyTimePoints, 7), sumLast(studyTimePoints, 7, 7));
  const rawQuizAccuracyDelta = toChangeRate(
    averageLast(quizAccuracyPoints, 2),
    averageLast(quizAccuracyPoints, 2, 2),
  );
  const rawTypingAccuracyDelta = toChangeRate(
    averageLast(typingAccuracyPoints, 2),
    averageLast(typingAccuracyPoints, 2, 2),
  );
  const rawTabLeaveChangeRate = effectiveDashboard?.focus_stats.tab_leave_change_rate ?? 0;

  const studyTimeDelta = shouldUseMockDashboard ? 18 : rawStudyTimeDelta;
  const quizAccuracyDelta = shouldUseMockDashboard ? 7 : rawQuizAccuracyDelta;
  const typingAccuracyDelta = shouldUseMockDashboard ? 6 : rawTypingAccuracyDelta;
  const tabLeaveChangeRate = shouldUseMockDashboard ? -25 : rawTabLeaveChangeRate;
  const focusScore = getFocusScore(
    effectiveDashboard?.focus_stats.this_week_tab_leave_count ?? 0,
    tabLeaveChangeRate,
  );

  const weeklyReportMessages = getWeeklyReportMessages({
    studyTimeDelta,
    tabLeaveChangeRate,
    typingDelta: typingAccuracyDelta,
    focusScore,
  });
  const studyTimeInsight = getStudyTimeInsight(studyTimePoints);
  const quizTrendInsight = getTrendInsight('quiz', quizAccuracyDelta);
  const typingTrendInsight = getTrendInsight('typing', typingAccuracyDelta);
  const focusInsight = getFocusInsight(
    effectiveDashboard?.focus_stats.this_week_tab_leave_count ?? 0,
    tabLeaveChangeRate,
    focusScore,
  );

  return (
    <div className="mt-4 space-y-6">
      <DashboardSectionTitle>학습 대시보드</DashboardSectionTitle>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatSummaryCard
          label="총 학습시간"
          value={formatDisplayedStudyTime(
            effectiveDashboard?.summary.total_study_duration_seconds ?? 0,
          ).replace('시간', '시간 ')}
          deltaText={formatSignedDelta(studyTimeDelta)}
          deltaValue={studyTimeDelta}
          valueClassName="text-[22px] tracking-[-0.07em]"
          icon={<ClockIcon />}
          iconColorClass="bg-[#EFF6FF] text-[#2563EB]"
        />
        <DashboardStatSummaryCard
          label="평균 정답률"
          value={formatPercentValue(effectiveDashboard?.summary.average_quiz_accuracy)}
          deltaText={formatSignedDelta(quizAccuracyDelta)}
          deltaValue={quizAccuracyDelta}
          icon={<TargetIcon />}
          iconColorClass="bg-[#EFF6FF] text-[#2563EB]"
        />
        <DashboardStatSummaryCard
          label="평균 입력성공률"
          value={formatPercentValue(effectiveDashboard?.summary.average_typing_accuracy)}
          deltaText={formatSignedDelta(typingAccuracyDelta)}
          deltaValue={typingAccuracyDelta}
          icon={<KeyboardIcon />}
          iconColorClass="bg-[#ECFDF3] text-[#22C55E]"
        />
        <DashboardStatSummaryCard
          label="이번 주 이탈 횟수"
          value={`${effectiveDashboard?.focus_stats.this_week_tab_leave_count ?? 0}회`}
          deltaText={formatSignedDelta(tabLeaveChangeRate)}
          deltaValue={tabLeaveChangeRate}
          labelClassName="text-[12px] tracking-[-0.03em]"
          icon={<TabIcon />}
          iconColorClass="bg-[#F8FAFC] text-[#0F172A]"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <DashboardBarChart
          title="학습 시간"
          points={studyTimePoints.length > 0 ? studyTimePoints : [{ label: '데이터 없음', value: 0 }]}
          totalSeconds={effectiveDashboard?.summary.total_study_duration_seconds ?? 0}
          insight={studyTimeInsight}
        />
        <FocusAnalysisCard
          count={effectiveDashboard?.focus_stats.this_week_tab_leave_count ?? 0}
          changeRate={tabLeaveChangeRate}
          insight={focusInsight}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardLineChart
          title="퀴즈 정답률 추이"
          points={quizAccuracyPoints}
          tone="blue"
          insight={quizTrendInsight}
        />
        <DashboardLineChart
          title="입력 성공률 추이"
          points={typingAccuracyPoints}
          tone="green"
          insight={typingTrendInsight}
        />
      </div>

      <DailyResultCards
        items={effectiveDashboard?.daily_results ?? []}
        sessions={effectiveDashboard?.sessions ?? []}
      />

      <WeeklyReportCard messages={weeklyReportMessages} />
    </div>
  );
}
