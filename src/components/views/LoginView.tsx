import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Store, 
  User, 
  Lock, 
  Phone, 
  ArrowRight, 
  Building2, 
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  Shield,
  Layers,
  Database,
  Check
} from 'lucide-react';
import { Tenant } from '../../types';
import { authService, UserProfile } from '../../services/authService';

interface LoginViewProps {
  tenants: Tenant[];
  initialPortal?: 'shop' | 'system_admin';
  onLoginSuccess: (user: UserProfile, tenantId?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  tenants,
  initialPortal = 'shop',
  onLoginSuccess
}) => {
  const [portalMode, setPortalMode] = useState<'shop' | 'system_admin'>(initialPortal);
  
  // Standard Shop Login state
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || '');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // System Admin Master Login state
  const [masterKey, setMasterKey] = useState('bdyusuf2016');
  const [secretPin, setSecretPin] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, selectedTenantId]);

  useEffect(() => {
    // Check URL hash or path for direct system-admin login routing
    const checkHash = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('system-admin') || path.includes('system-admin')) {
        setPortalMode('system_admin');
      } else if (hash.includes('login') || path.includes('login')) {
        setPortalMode('shop');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleShopLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedTenantId) {
      setErrorMsg('দয়া করে আপনার দোকান নির্বাচন করুন অথবা System Admin দিয়ে নতুন দোকান তৈরি করুন।');
      return;
    }

    const res = authService.login(identifier, selectedTenantId);
    if (res.success && res.user) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user!, selectedTenantId);
      }, 400);
    } else {
      setErrorMsg(res.message || 'লগইন ব্যর্থ হয়েছে');
    }
  };

  const handleSystemAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = authService.systemAdminLogin(masterKey, secretPin);
    if (res.success && res.user) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user!, selectedTenantId);
      }, 400);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-slate-100 flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Brand & Portal Switcher Bar */}
      <header className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-lg text-white leading-tight">দোকান ম্যানেজার ERP V2.0</div>
            <div className="text-xs text-blue-400 font-medium">Multi-Tenant Business Management Platform</div>
          </div>
        </div>

        {/* Portal Mode Switcher */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setPortalMode('shop');
              window.location.hash = '/login';
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              portalMode === 'shop'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            দোকান লগইন (/login)
          </button>
          
          <button
            type="button"
            onClick={() => {
              setPortalMode('system_admin');
              window.location.hash = '/system-admin/login';
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              portalMode === 'system_admin'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            System Admin (/system-admin/login)
          </button>
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Left Column: Form Entry */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {portalMode === 'system_admin' ? (
                // SYSTEM ADMIN PORTAL HEADER
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Dedicated System Admin Portal
                  </div>
                  <h2 className="text-xl font-extrabold text-white">Md. Yusuf Ali (Platform Owner)</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    সিস্টেম প্ল্যাটফর্ম, মাল্টি-টেন্যান্ট প্রভিশনিং এবং গ্লোবাল মডিউল ম্যাট্রিক্স নিয়ন্ত্রণ করতে মাস্টার আইডি দিয়ে লগইন করুন।
                  </p>
                </div>
              ) : (
                // STANDARD SHOP LOGIN HEADER
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    দোকান ও স্টাফ পোর্টাল
                  </div>
                  <h2 className="text-xl font-extrabold text-white">দোকান অ্যাকাউন্টে প্রবেশ করুন</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    দোকান নির্বাচন করে আপনার মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।
                  </p>
                </div>
              )}

              {/* Alert message */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* FORM SWITCH */}
              {portalMode === 'system_admin' ? (
                // SYSTEM ADMIN FORM
                <form onSubmit={handleSystemAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      System Admin Identifier / ID
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={masterKey}
                        onChange={e => setMasterKey(e.target.value)}
                        placeholder="bdyusuf2016"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">সিস্টেম এডমিন আইডি: <b className="text-purple-300 font-mono">bdyusuf2016</b></span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Security Secret Key / PIN
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={secretPin}
                        onChange={e => setSecretPin(e.target.value)}
                        placeholder="পাসওয়ার্ড লিখুন..."
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>System Admin পোর্টালে প্রবেশ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                // STANDARD SHOP LOGIN FORM
                <form onSubmit={handleShopLogin} className="space-y-4">
                  {tenants.length > 0 ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        দোকান / প্রতিষ্ঠান নির্বাচন করুন
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={selectedTenantId}
                          onChange={e => setSelectedTenantId(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          {tenants.map(t => (
                            <option key={t.id} value={t.id} className="bg-slate-800 text-white">
                              {t.name} ({t.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-2">
                      <p className="font-semibold">এখনো কোনো দোকান নিবন্ধিত নেই।</p>
                      <p className="text-[11px] text-slate-300">
                        সিস্টেম এডমিন হিসেবে লগইন করে নতুন দোকান তৈরি করুন।
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPortalMode('system_admin');
                          window.location.hash = '/system-admin/login';
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>System Admin লগইনে যান</span>
                      </button>
                    </div>
                  )}

                  {tenants.length > 0 && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          মোবাইল নম্বর / ইউজার আইডি
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            placeholder="017xxxxxxxx"
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          পাসওয়ার্ড
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="পাসওয়ার্ড লিখুন..."
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>দোকান ড্যাশবোর্ডে প্রবেশ</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>সুরক্ষিত 256-Bit SSL এনক্রিপশন</span>
              <span className="font-mono">Core v2.4.1</span>
            </div>
          </div>

          {/* Right Column: Platform Architecture Highlights */}
          <div className="lg:col-span-5 bg-slate-950/60 p-6 sm:p-7 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  নিরাপদ মাল্টি-টেন্যান্ট বিজনেস প্ল্যাটফর্ম
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">
                দোকান ম্যানেজার ERP হলো রোল-ভিত্তিক এবং সম্পূর্ণ আইসোলেটেড বিজনেস ম্যানেজমেন্ট আর্কিটেকচার।
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">নিখুঁত রোল ও পারমিশন কন্ট্রোল</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      ম্যানেজার, ক্যাশিয়ার, টেকনিশিয়ান ও বুকস্টোর স্টাফের জন্য সুনির্দিষ্ট এক্সেস।
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">আইসোলেটেড ডাটাবেস লেয়ার</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      প্রতিটি দোকানের পণ্য, বিক্রয়, ক্যাশ খাতা ও কাস্টমার ডেটা সম্পূর্ণ আলাদা।
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">ইন্ডাস্ট্রি মডিউল প্লাগইন</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      মোবাইল IMEI/সার্ভিসিং, বই-খাতা/স্টেশনারি ও গ্রোসারি ব্যাচ ট্র্যাকিং।
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              সিস্টেম ওয়ানার: <b className="text-purple-400 font-mono">bdyusuf2016</b>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 z-10">
        SmartERP Platform &copy; 2026 • Platform Creator: Md. Yusuf Ali (<span className="font-mono text-purple-400">bdyusuf2016</span>)
      </footer>
    </div>
  );
};
