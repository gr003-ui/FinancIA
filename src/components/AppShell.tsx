"use client";
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import TransactionForm from './TransactionForm';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex-1 overflow-y-auto h-screen">
        {children}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        title="Nuevo movimiento"
        className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 hover:bg-emerald-400 hover:scale-110 transition-all z-40 text-white"
      >
        <Plus size={28} />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 px-2">
              <p className="text-white font-black text-lg">Nuevo Movimiento</p>
              <button
                onClick={() => setOpen(false)}
                className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <TransactionForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}