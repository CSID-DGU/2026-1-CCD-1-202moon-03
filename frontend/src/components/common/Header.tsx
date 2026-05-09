import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../store/useAuthStore';

function Header() {
  const user = useAuthStore((state) => state.user);
  const profileLabel = user?.name ? user.name.slice(0, 2).toUpperCase() : 'MY';

  return (
    <header className="-mx-6 -mt-10 border-b border-[#E3E7EE] bg-white">
      <div className="mx-auto flex h-[84px] w-full max-w-[1440px] items-center justify-between px-8 sm:px-12 lg:px-16">
        <Link to={ROUTES.HOME} className="flex items-center gap-3">
          <span className="h-7 w-7 rounded-[2px] bg-[#D9D9D9]" aria-hidden="true" />
          <span className="text-[30px] font-bold tracking-[-0.04em] text-[#161A23]">TADAC</span>
        </Link>

        <Link
          to={ROUTES.MYPAGE}
          aria-label="마이페이지로 이동"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D9DFEA] text-[13px] font-semibold text-[#2D3545] transition-transform duration-200 hover:scale-[1.03]"
        >
          {profileLabel}
        </Link>
      </div>
    </header>
  );
}

export default Header;
