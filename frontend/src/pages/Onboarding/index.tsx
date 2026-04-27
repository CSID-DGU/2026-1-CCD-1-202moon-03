import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { ROUTES } from '../../constants/routes';

function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-[560px] rounded-[36px] bg-white px-8 py-10 text-center shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-[32px] bg-slate-950 text-3xl font-semibold text-white">
          TD
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-slate-400">Onboarding</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          Turn passive watching into active listening practice
        </h1>
        <p className="mt-4 text-slate-600">
          Start with a video or recording, choose a learning mode, and leave room for richer
          results and personal history later.
        </p>
        <div className="mt-8">
          <PrimaryButton
            type="button"
            disabled={false}
            variant="active"
            onClick={() => navigate(ROUTES.HOME)}
          >
            Start
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}

export default OnboardingPage;
