import Sidebar from '../components/Sidebar';
import AppShell from '../components/AppShell';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex bg-[#080A12] min-h-screen">
        <Sidebar />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}