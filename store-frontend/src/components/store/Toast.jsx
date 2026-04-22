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
          style={{ translateX: '-50%' }}
          className="fixed bottom-24 md:bottom-10 left-1/2 z-[2000] flex items-center gap-3 bg-black text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl shadow-2xl ring-1 ring-white/10 max-w-[90vw] md:w-auto md:min-w-[300px]"
        >
          <div className="p-1 bg-emerald-500 rounded-full flex-shrink-0">
            <CheckCircle2 size={16} strokeWidth={3} />
          </div>
          <p className="text-[0.6rem] md:text-[0.65rem] font-black uppercase tracking-widest flex-1 line-clamp-2">
            {toast.message}
          </p>
          <button className="text-white/40 hover:text-white transition-colors flex-shrink-0">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
