import type { AuthUser } from '../../types/auth';

interface UserProfileProps {
  user: AuthUser | null;
}

function UserProfile({ user }: UserProfileProps) {
  return (
    <section className="rounded-[24px] bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">User Profile</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {user?.name ?? 'Guest User'}
      </h2>
      <p className="mt-2 text-slate-600">{user?.email ?? 'Login to sync real profile data later.'}</p>
    </section>
  );
}

export default UserProfile;
