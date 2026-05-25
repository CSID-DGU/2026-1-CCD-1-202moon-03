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
      <div className="min-h-screen bg-white">
        <main className="min-h-screen">
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
