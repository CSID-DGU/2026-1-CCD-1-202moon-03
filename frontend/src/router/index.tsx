import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import MainLayout from '../components/layout/MainLayout';
import PlayerLayout from '../components/layout/PlayerLayout';
import HomePage from '../pages/Home';
import LoginPage from '../pages/Login';
import MyPage from '../pages/MyPage';
import OnboardingPage from '../pages/Onboarding';
import RainModePage from '../pages/RainMode';
import ResultPage from '../pages/Result';
import SignupPage from '../pages/Signup';
import SpinnerModePage from '../pages/SpinnerMode';
import { ROUTES } from '../constants/routes';

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
      </div>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: ROUTES.ONBOARDING,
        element: <OnboardingPage />,
      },
      {
        path: ROUTES.HOME,
        element: <HomePage />,
      },
      {
        path: ROUTES.MYPAGE,
        element: <MyPage />,
      },
      {
        path: ROUTES.RESULT,
        element: <ResultPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTES.SIGNUP,
        element: <SignupPage />,
      },
    ],
  },
  {
    element: <PlayerLayout />,
    children: [
      {
        path: ROUTES.PLAYER_SPINNER,
        element: <SpinnerModePage />,
      },
      {
        path: ROUTES.PLAYER_RAIN,
        element: <RainModePage />,
      },
    ],
  },
]);
