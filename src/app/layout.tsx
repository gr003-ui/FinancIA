import type { Metadata } from 'next';
import AppLayout from '../components/AppLayout';
import AuthProvider from '../components/AuthProvider';
import ThemeProvider from '../components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinancIA',
  description: 'Gestión de finanzas personales para el mercado argentino',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#080A12]">
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