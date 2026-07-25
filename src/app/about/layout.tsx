import type { ReactNode } from 'react';

import AppFooter from '@/frontend/components/AppFooter';
import NavigationBar from '@/frontend/components/home/NavigationBar';
import { DEFAULT_BACKGROUND } from '@/frontend/helpers/background';

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundImage: DEFAULT_BACKGROUND }}>
      <NavigationBar />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
