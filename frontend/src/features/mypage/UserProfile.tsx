import type { AuthUser } from '../../types/auth';

interface UserProfileProps {
  user: AuthUser | null;
}

function UserProfile({ user }: UserProfileProps) {
  return (
    <section className="rounded-[24px] bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">사용자 프로필</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {user?.name ?? '게스트 사용자'}
      </h2>
      <p className="mt-2 text-slate-600">
        {user?.email ?? '로그인하면 실제 프로필 정보와 연동할 수 있습니다.'}
      </p>
    </section>
  );
}

export default UserProfile;
