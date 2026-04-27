import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../store/useAuthStore';

function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="rounded-[24px] border border-white/60 bg-white/80 px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link className="text-lg font-semibold tracking-tight text-slate-950" to={ROUTES.ONBOARDING}>
            TADAC
          </Link>
          <p className="text-sm text-slate-500">Interactive listening study playground</p>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
          <Link className="transition-colors hover:text-slate-950" to={ROUTES.HOME}>
            Home
          </Link>
          <Link className="transition-colors hover:text-slate-950" to={ROUTES.RESULT}>
            Result
          </Link>
          <Link className="transition-colors hover:text-slate-950" to={ROUTES.MYPAGE}>
            My Page
          </Link>
          <Link className="transition-colors hover:text-slate-950" to={ROUTES.LOGIN}>
            {user ? user.name : 'Login'}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
