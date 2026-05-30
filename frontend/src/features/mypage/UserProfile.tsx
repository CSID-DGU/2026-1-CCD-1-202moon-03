import type { AuthUser } from '../../types/auth';

interface UserProfileProps {
  user: AuthUser | null;
  isLoading?: boolean;
  errorMessage?: string;
}

function UserProfile({ user, isLoading = false, errorMessage = '' }: UserProfileProps) {
  return (
    <section className="rounded-[24px] bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <p className="text-sm font-semibold tracking-[-0.02em] text-slate-500">사용자 프로필</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {isLoading ? '프로필 불러오는 중...' : user?.name || '게스트 사용자'}
      </h2>
      <p className="mt-2 text-slate-600">
        {errorMessage || user?.email || '로그인하면 실제 프로필 정보가 여기에 표시됩니다.'}
      </p>
    </section>
  );
}

export default UserProfile;
