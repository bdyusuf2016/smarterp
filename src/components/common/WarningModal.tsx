import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, X, ShieldAlert, Package, Check } from 'lucide-react';

export interface WarningModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  itemName?: string;
  currentStock?: number | string;
  requestedQty?: number | string;
  unit?: string;
  type?: 'warning' | 'danger' | 'info';
  confirmText?: string;
  actionText?: string;
  onConfirm: () => void;
  onAction?: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  title = 'স্টক সতর্কতা (Stock Warning)',
  message,
  itemName,
  currentStock,
  requestedQty,
  unit = 'টি',
  type = 'warning',
  confirmText = 'ঠিক আছে, বুঝেছি',
  actionText,
  onConfirm,
  onAction
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onConfirm}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1a1d26] border border-amber-200/80 dark:border-amber-900/50 rounded-2xl shadow-2xl overflow-hidden z-10"
            role="alertdialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Accent Bar */}
            <div className={`h-1.5 w-full ${
              type === 'danger'
                ? 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500'
                : 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-400'
            }`} />

            {/* Header with Close */}
            <div className="relative px-6 pt-6 pb-2">
              <button
                type="button"
                onClick={onConfirm}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                {/* Animated Glowing Warning Icon */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md ${
                    type === 'danger'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900/60 shadow-rose-500/10'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-900/60 shadow-amber-500/10'
                  }`}>
                    {type === 'danger' ? (
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 animate-bounce" />
                    )}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="min-w-0 flex-1 pr-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {title}
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                    অপারেশন বাতিল করা হয়েছে
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-3 space-y-3">
              {/* Product Badge if available */}
              {itemName && (
                <div className="bg-slate-50 dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      পণ্য
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {itemName}
                    </div>
                  </div>
                  {(currentStock !== undefined || requestedQty !== undefined) && (
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-500 font-semibold">মজুদ স্টক</div>
                      <div className={`text-xs font-mono font-extrabold ${
                        Number(currentStock) <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {currentStock ?? 0} {unit}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="flex-1 font-medium">{message}</p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 bg-slate-50/70 dark:bg-[#151821] border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              {onAction && actionText && (
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onAction();
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 transition-all cursor-pointer"
                >
                  {actionText}
                </button>
              )}

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={onConfirm}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
