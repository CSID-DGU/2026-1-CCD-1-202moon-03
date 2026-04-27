import { useAuthStore } from '../../store/useAuthStore';

const mockHistory = [
  { id: 'history-1', title: 'English lecture practice', mode: 'Spinner', createdAt: '2026-04-26' },
  { id: 'history-2', title: 'Interview review', mode: 'Rain', createdAt: '2026-04-24' },
];

export function useMyPage() {
  const user = useAuthStore((state) => state.user);

  return {
    user,
    learningHistory: mockHistory,
  };
}
