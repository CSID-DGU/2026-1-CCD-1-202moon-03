import { Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import Footer from '../common/Footer';
import Header from '../common/Header';
import { AppShell } from './AppShell';

function MainLayout() {
  const location = useLocation();
  const isOnboardingPage = location.pathname === ROUTES.ONBOARDING;

  if (isOnboardingPage) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-white">
        <main className="h-full overflow-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <AppShell>
      <Header />
      <main className="flex-1 py-8">
        <Outlet />
      </main>
      <Footer />
    </AppShell>
  );
}

export default MainLayout;
