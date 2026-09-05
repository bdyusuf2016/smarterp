import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  LogOut,
  RefreshCw,
  X,
  ShieldAlert,
  Info
} from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalOptions {
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  itemName?: string;
  warningNote?: string;
  icon?: 'trash' | 'alert' | 'logout' | 'reset' | 'info' | 'check' | 'shield';
}

export interface ConfirmationModalProps extends ConfirmModalOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  description,
  confirmText,
  cancelText,
  type = 'info',
  itemName,
  warningNote,
  icon
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Keyboard shortcut listener (Enter = Confirm, Escape = Cancel)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        // Only trigger confirm if focus is not on cancel button
        if (document.activeElement !== cancelBtnRef.current) {
          e.preventDefault();
          onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Auto-focus the appropriate button
    const timer = setTimeout(() => {
      if (type === 'danger') {
        // For danger actions, focus cancel first to prevent accidental deletions
        cancelBtnRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onCancel, onConfirm, type]);

  if (!isOpen) return null;

  const displayMessage = message || description || '';

  // Icon resolution based on type and custom icon prop
  const renderIcon = () => {
    const iconClass = 'w-6 h-6 sm:w-7 sm:h-7';
    if (icon === 'trash' || (type === 'danger' && !icon)) {
      return <Trash2 className={`${iconClass} text-rose-600 animate-pulse`} />;
    }
    if (icon === 'shield') {
      return <ShieldAlert className={`${iconClass} text-rose-600`} />;
    }
    if (icon === 'alert' || (type === 'warning' && !icon)) {
      return <AlertTriangle className={`${iconClass} text-amber-600`} />;
    }
    if (icon === 'reset') {
      return <RefreshCw className={`${iconClass} text-amber-600`} />;
    }
    if (icon === 'logout') {
      return <LogOut className={`${iconClass} text-indigo-600`} />;
    }
    if (icon === 'check' || type === 'success') {
      return <CheckCircle2 className={`${iconClass} text-emerald-600`} />;
    }
    return <HelpCircle className={`${iconClass} text-indigo-600`} />;
  };

  // Color scheme mappings
  const themeStyles = {
    danger: {
      headerBg: 'from-rose-500/10 via-red-500/5 to-transparent',
      iconContainer: 'bg-rose-100/90 border-rose-200 shadow-rose-200/50 ring-4 ring-rose-50',
      confirmBtn:
        'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-500/25 focus:ring-rose-500',
      tagBg: 'bg-rose-50 text-rose-700 border-rose-200',
      defaultConfirmText: 'হ্যাঁ, মুছে ফেলুন'
    },
    warning: {
      headerBg: 'from-amber-500/10 via-orange-500/5 to-transparent',
      iconContainer: 'bg-amber-100/90 border-amber-200 shadow-amber-200/50 ring-4 ring-amber-50',
      confirmBtn:
        'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 focus:ring-amber-500',
      tagBg: 'bg-amber-50 text-amber-800 border-amber-200',
      defaultConfirmText: 'নিশ্চিত করুন'
    },
    info: {
      headerBg: 'from-indigo-500/10 via-blue-500/5 to-transparent',
      iconContainer: 'bg-indigo-100/90 border-indigo-200 shadow-indigo-200/50 ring-4 ring-indigo-50',
      confirmBtn:
        'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/25 focus:ring-indigo-500',
      tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      defaultConfirmText: 'হ্যাঁ, নিশ্চিত'
    },
    success: {
      headerBg: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      iconContainer: 'bg-emerald-100/90 border-emerald-200 shadow-emerald-200/50 ring-4 ring-emerald-50',
      confirmBtn:
        'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 focus:ring-emerald-500',
      tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      defaultConfirmText: 'ঠিক আছে'
    }
  }[type];

  const resolvedConfirmText = confirmText || themeStyles.defaultConfirmText;
  const resolvedCancelText = cancelText || 'বাতিল';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 my-auto flex flex-col"
        >
          {/* Header Accent Bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${
            type === 'danger'
              ? 'from-rose-500 to-red-600'
              : type === 'warning'
              ? 'from-amber-500 to-orange-500'
              : type === 'success'
              ? 'from-emerald-500 to-teal-500'
              : 'from-indigo-500 to-blue-600'
          }`} />

          {/* Close Button Top-Right */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Body Content */}
          <div className="p-5 sm:p-7 space-y-4">
            {/* Top Icon Badge & Title */}
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 ${themeStyles.iconContainer}`}
              >
                {renderIcon()}
              </div>

              <div className="flex-1 pr-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {title}
                </h3>
                {displayMessage && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                    {displayMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Optional Item Identifier Tag */}
            {itemName && (
              <div className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  নির্বাচিত আইটেম:
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-[240px] px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                  {itemName}
                </span>
              </div>
            )}

            {/* Optional Irreversible Warning Callout */}
            {warningNote && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 font-medium ${
                  type === 'danger'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-700'
                    : 'bg-amber-50/80 border-amber-200 text-amber-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{warningNote}</div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="px-5 py-4 sm:px-7 sm:py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm transition-all duration-150 shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-300 active:scale-95 cursor-pointer"
            >
              {resolvedCancelText}
            </button>

            <button
              ref={confirmBtnRef}
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-1 active:scale-95 cursor-pointer flex items-center gap-1.5 ${themeStyles.confirmBtn}`}
            >
              {type === 'danger' && <Trash2 className="w-4 h-4" />}
              {type === 'warning' && <AlertTriangle className="w-4 h-4" />}
              {type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {type === 'info' && (icon === 'logout' ? <LogOut className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />)}
              <span>{resolvedConfirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
