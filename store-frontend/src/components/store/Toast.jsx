import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useStore } from '../../services/useStore';

const Toast = () => {
  const { toast } = useStore();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl shadow-2xl ring-1 ring-white/10 min-w-[300px]"
        >
          <div className="p-1 bg-emerald-500 rounded-full">
            <CheckCircle2 size={16} strokeWidth={3} />
          </div>
          <p className="text-[0.65rem] font-black uppercase tracking-widest flex-1">{toast.message}</p>
          <button className="text-white/40 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
