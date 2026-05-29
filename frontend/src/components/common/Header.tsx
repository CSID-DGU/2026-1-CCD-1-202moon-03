import { Link } from 'react-router-dom';
import tadacLogo from '../../assets/icons/TADAC.svg';
import mypageIcon from '../../assets/icons/mypageIcon.svg';
import { ROUTES } from '../../constants/routes';

function Header() {
  return (
    <header className="-mx-6 -mt-10 relative bg-white">
      <div className="mx-auto flex h-[84px] w-full max-w-[1440px] items-center justify-between px-8 sm:px-12 lg:px-16">
        <Link to={ROUTES.HOME} aria-label="TADAC 홈으로 이동" className="flex items-center">
          <img src={tadacLogo} alt="TADAC" className="h-10 w-auto sm:h-11" />
        </Link>

        <Link
          to={ROUTES.MYPAGE}
          aria-label="마이페이지로 이동"
          className="flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200 hover:bg-[#F3F7FC]"
        >
          <img src={mypageIcon} alt="" aria-hidden="true" className="h-9 w-9" />
        </Link>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-[#E3E7EE]"
      />
    </header>
  );
}

export default Header;
