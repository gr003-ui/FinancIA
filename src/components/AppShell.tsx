"use client";
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionForm from './TransactionForm';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen]       = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
      <div className="flex-1 overflow-y-auto h-screen">
        {children}
      </div>

      {/* FAB solo en desktop — en mobile lo maneja BottomNav */}
      {!isMobile && (
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 hover:bg-emerald-400 transition-colors z-40 text-white"
        >
          <Plus size={28} />
        </motion.button>
      )}

      {/* Modal desktop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1,   y: 0  }}
              exit={{    opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}