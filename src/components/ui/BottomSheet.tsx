'use client';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="brand-pattern fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] rounded-t-[2rem] border border-white/15 bg-black/80 p-4 shadow-[0_-24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl max-w-2xl mx-auto"
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose(); }}
          >
            <div aria-hidden className="brand-chip mx-auto mb-3 h-1.5 w-12 rounded-full" />
            <div className="mb-4 flex items-start justify-between gap-3">
              {title && (
                <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sky-100 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(85dvh-7rem)] overflow-y-auto pr-1">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
