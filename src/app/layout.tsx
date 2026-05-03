"use client";
import { useFinanceStore } from '../store/useFinanceStore';
import Sidebar from '../components/Sidebar';
import AppShell from '../components/AppShell';
import ThemeProvider from '../components/ThemeProvider';
import OnboardingWizard from '../components/OnboardingWizard';
import './globals.css';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { onboardingComplete, setOnboardingComplete } = useFinanceStore();

  if (!onboardingComplete) {
    return (
      <OnboardingWizard onComplete={setOnboardingComplete} />
    );
  }

  return (
    <div className="flex bg-[#080A12] min-h-screen">
      <Sidebar />
      <AppShell>
        {children}
      </AppShell>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#080A12]">
        <ThemeProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}