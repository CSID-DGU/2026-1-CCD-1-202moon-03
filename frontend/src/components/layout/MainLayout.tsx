import { Outlet } from 'react-router-dom';
import Footer from '../common/Footer';
import Header from '../common/Header';
import { AppShell } from './AppShell';

function MainLayout() {
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
