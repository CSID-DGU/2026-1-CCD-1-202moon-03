import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../store/useAuthStore';

function OnboardingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-[560px] rounded-[36px] bg-white px-8 py-10 text-center shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-[32px] bg-slate-950 text-3xl font-semibold text-white">
          TD
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-slate-400">TADAC</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          수동 시청에서 능동적인 자기 학습으로 바꿔보세요
        </h1>
        <p className="mt-4 text-slate-600">
          영상이나 텍스트를 선택하고, 학습 모드를 고른 뒤 결과와 기록까지 이어지는 흐름을
          준비해두었어요.
        </p>
        <div className="mt-8">
          <Button
            type="button"
            disabled={false}
            variant="active"
            onClick={() => navigate(isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN)}
            className="h-[64px] w-full rounded-[12px] text-[24px]"
          >
            시작하기
          </Button>
        </div>
      </div>
    </section>
  );
}

export default OnboardingPage;
