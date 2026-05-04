"use client";
import { useFinanceStore } from '../store/useFinanceStore';
import Sidebar from './Sidebar';
import AppShell from './AppShell';
import OnboardingWizard from './OnboardingWizard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { onboardingComplete, setOnboardingComplete } = useFinanceStore();

  if (!onboardingComplete) {
    return <OnboardingWizard onComplete={setOnboardingComplete} />;
  }

  return (
    <div className="flex bg-[#080A12] min-h-screen">
      <Sidebar />
      <AppShell>{children}</AppShell>
    </div>
  );
}