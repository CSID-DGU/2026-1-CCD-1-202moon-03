import { Outlet } from 'react-router-dom';

function PlayerLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Outlet />
    </div>
  );
}

export default PlayerLayout;
