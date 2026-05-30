import { useNavigate } from 'react-router-dom';
import onboardLogo from '../../assets/icons/onboard.svg';
import Button from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../store/useAuthStore';

function OnboardingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="flex h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#FFF_0%,#ECF8FF_100%)] px-6 py-8">
      <div className="flex h-full w-full max-w-[1440px] flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-[clamp(72px,13vh,140px)]">
          <img
            src={onboardLogo}
            alt="TADAC"
            className="h-auto w-[min(469px,68vw)] drop-shadow-[0_18px_44px_rgba(126,191,255,0.34)]"
          />
          <Button
            type="button"
            disabled={false}
            variant="active"
            onClick={() => navigate(isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN)}
            className="h-[64px] w-[min(402px,72vw)] rounded-[16px] border-[#1A9AF5] px-5 py-4 text-[18px] tracking-[-0.45px]"
          >
            시작하기
          </Button>
        </div>
      </div>
    </section>
  );
}

export default OnboardingPage;
