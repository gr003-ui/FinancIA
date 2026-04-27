import Sidebar from '../components/Sidebar';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex bg-slate-50">
        <Sidebar />
        <div className="flex-1 overflow-y-auto h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}