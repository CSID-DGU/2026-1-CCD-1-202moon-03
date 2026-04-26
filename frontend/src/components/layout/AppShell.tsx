import type { PropsWithChildren } from 'react';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fde68a,_#fff_30%,_#e2e8f0_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}
