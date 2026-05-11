"use client";
import { useFinanceStore } from '../store/useFinanceStore';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import AppShell from './AppShell';
import OnboardingWizard from './OnboardingWizard';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { onboardingComplete, setOnboardingComplete } = useFinanceStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!onboardingComplete) {
    return <OnboardingWizard onComplete={setOnboardingComplete} />;
  }

  return (
    <div className="flex bg-[#080A12] min-h-screen">
      {/* Sidebar solo en desktop */}
      {!isMobile && <Sidebar />}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        <AppShell>{children}</AppShell>
      </div>

      {/* Bottom nav solo en mobile */}
      {isMobile && <BottomNav />}
    </div>
  );
}