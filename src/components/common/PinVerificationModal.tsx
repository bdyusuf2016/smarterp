import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Lock, Eye, EyeOff, X, KeyRound, AlertTriangle } from 'lucide-react';
import { storageService } from '../../services/storageService';

export interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionType?: 'delete' | 'edit' | 'reset' | 'general';
  title?: string;
  subtitle?: string;
  itemName?: string;
  tenantId?: string;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionType = 'delete',
  title,
  subtitle,
  itemName,
  tenantId
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setShake(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedTitle =
    title ||
    (actionType === 'delete'
      ? 'আইটেম মুছে ফেলতে পিন ভেরিফিকেশন'
      : actionType === 'edit'
      ? 'সম্পাদনা করতে পিন ভেরিফিকেশন'
      : actionType === 'reset'
      ? 'ডাটা রিসেট সিকিউরিটি পিন'
      : 'সিকিউরিটি পিন ভেরিফিকেশন');

  const resolvedSubtitle =
    subtitle ||
    (itemName
      ? `"${itemName}" এর জন্য সিকিউরিটি পিন প্রদান করে নিশ্চিত করুন।`
      : 'অনুমোদিত ব্যক্তি হিসেবে আপনার ৪ ডিজিটের সিকিউরিটি পিন প্রদান করুন।');

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!pin.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার সিকিউরিটি পিন লিখুন');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const isValid = storageService.verifySecurityPin(pin.trim(), tenantId);

    if (isValid) {
      setErrorMsg('');
      setPin('');
      onClose();
      onSuccess();
    } else {
      setErrorMsg('ভুল সিকিউরিটি পিন! সঠিক পিন প্রদান করুন।');
      setShake(true);
      setPin('');
      inputRef.current?.focus();
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const headerColors =
    actionType === 'delete'
      ? 'from-rose-500/15 to-red-500/5 text-rose-600 border-rose-100'
      : actionType === 'reset'
      ? 'from-amber-500/15 to-orange-500/5 text-amber-600 border-amber-100'
      : 'from-blue-500/15 to-indigo-500/5 text-indigo-600 border-indigo-100';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-auto flex flex-col"
        >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b bg-gradient-to-r ${headerColors} flex items-start justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                {actionType === 'delete' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                ) : actionType === 'reset' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {resolvedTitle}
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  {resolvedSubtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleVerify} className="p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium"
              >
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                ৪ বা ৬ ডিজিটের সিকিউরিটি পিন লিখুন
              </label>

              <div className={`relative ${shake ? 'animate-shake' : ''}`}>
                <input
                  ref={inputRef}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 8) setPin(val);
                    setErrorMsg('');
                  }}
                  placeholder="• • • •"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl sm:text-2xl font-bold py-3 px-4 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  title={showPin ? 'পিন লুকান' : 'পিন দেখুন'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-1.5 text-center text-[10px] text-slate-500 font-medium">
                💡 ডিফল্ট পিন: <span className="font-mono font-bold text-slate-700">1234</span> (সেটিংস থেকে পরিবর্তনযোগ্য)
              </div>
            </div>

            {/* Quick Touch Keypad */}
            <div className="pt-2">
              <div className="grid grid-cols-3 gap-1.5 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className="py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 text-slate-700 font-bold text-base rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 text-slate-700 font-bold text-base rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  ⌫
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  actionType === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : actionType === 'reset'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>যাচাই ও সম্পন্ন করুন</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
