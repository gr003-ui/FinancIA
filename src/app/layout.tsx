import type { Metadata, Viewport } from 'next';
import AppLayout             from '../components/AppLayout';
import AuthProvider          from '../components/AuthProvider';
import ThemeProvider         from '../components/ThemeProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinancIA',
  description: 'Gestión de finanzas personales para el mercado argentino',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinancIA',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#080A12]">
        <ServiceWorkerRegister />
        <AuthProvider>
          <ThemeProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}