import Sidebar from '../components/Sidebar';
import AppShell from '../components/AppShell';
import ThemeProvider from '../components/ThemeProvider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex bg-[#080A12] min-h-screen">
        <ThemeProvider>
          <Sidebar />
          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}