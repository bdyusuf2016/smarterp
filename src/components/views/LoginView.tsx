import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Store, 
  User, 
  Lock, 
  ArrowRight, 
  Building2, 
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  Shield,
  Layers,
  Database,
  Check,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Tenant } from '../../types';
import { authService, UserProfile, TenantMatchInfo } from '../../services/authService';
import { routerService } from '../../services/routerService';

interface LoginViewProps {
  tenants: Tenant[];
  initialPortal?: 'shop' | 'system_admin';
  onLoginSuccess: (user: UserProfile, tenantId?: string, targetView?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  tenants,
  onLoginSuccess
}) => {
  const currentRoute = routerService.parseCurrentRoute();
  const tenantHint = currentRoute.tenantId;

  // Resolved tenant if URL contains tenantHint
  const preselectedTenant = useMemo(() => {
    if (!tenantHint) return undefined;
    return tenants.find(
      t => t.id === tenantHint || t.code?.toLowerCase() === tenantHint.toLowerCase()
    );
  }, [tenants, tenantHint]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(preselectedTenant?.id);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [multiTenantOptions, setMultiTenantOptions] = useState<TenantMatchInfo[] | null>(null);

  // Dynamic Tenant / Admin Peek state
  const [peekInfo, setPeekInfo] = useState<{
    matched: boolean;
    isSystemAdmin: boolean;
    displayName?: string;
    subTitle?: string;
    tenants: TenantMatchInfo[];
  }>({ matched: false, isSystemAdmin: false, tenants: [] });

  // Real-time peek debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      const res = authService.peekIdentifier(identifier, selectedTenantId || tenantHint);
      setPeekInfo(res);
      if (res.matched && res.tenants.length === 1) {
        setSelectedTenantId(res.tenants[0].tenant.id);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [identifier, selectedTenantId, tenantHint]);

  const executeLogin = (overrideTenantId?: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    const tid = overrideTenantId || selectedTenantId || tenantHint;
    const res = authService.smartLogin(identifier, password, tid);

    if (res.success && res.user) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user!, res.tenant?.id, res.targetView);
      }, 350);
    } else if (res.requiresTenantSelection && res.availableTenants) {
      setMultiTenantOptions(res.availableTenants);
      setErrorMsg('');
    } else {
      setErrorMsg(res.message || 'লগইন ব্যর্থ হয়েছে');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin();
  };

  const handleSelectShopAndLogin = (tenantMatch: TenantMatchInfo) => {
    setSelectedTenantId(tenantMatch.tenant.id);
    setMultiTenantOptions(null);
    executeLogin(tenantMatch.tenant.id);
  };

  return (
    <div className="min-h-screen w-full bg-[#0c111d] text-slate-100 flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-lg text-white leading-tight flex items-center gap-2">
              <span>SmartERP Enterprise</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v2.4
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Multi-Tenant Business Management Platform
            </div>
          </div>
        </div>

        {/* Dynamic Tenant / Context Badge */}
        {preselectedTenant ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>দোকান: {preselectedTenant.name}</span>
            <span className="font-mono text-[10px] text-blue-400 font-bold bg-blue-900/40 px-1 rounded">
              {preselectedTenant.code}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>সেন্ট্রাল সিকিউর গেটওয়ে</span>
          </div>
        )}
      </header>

      {/* Main Login Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Left Column: Unified Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>স্মার্ট ইউনিফায়েড লগইন</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {preselectedTenant ? `${preselectedTenant.name}-এ স্বাগতম` : 'প্ল্যাটফর্মে প্রবেশ করুন'}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  আপনার ইউজার আইডি বা মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন। সিস্টেম স্বয়ংক্রিয়ভাবে আপনার একাউন্ট ও দোকান শনাক্ত করবে।
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Multi-Tenant Store Selection Dialog (If same user belongs to multiple shops) */}
              {multiTenantOptions && (
                <div className="mb-5 p-4 rounded-xl bg-slate-800/90 border border-blue-500/40 shadow-lg space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      দোকান নির্বাচন করুন:
                    </span>
                    <button
                      type="button"
                      onClick={() => setMultiTenantOptions(null)}
                      className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {multiTenantOptions.map((opt) => (
                      <button
                        key={opt.tenant.id}
                        type="button"
                        onClick={() => handleSelectShopAndLogin(opt)}
                        className="w-full text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100 group-hover:text-blue-300">
                            {opt.tenant.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            কোড: {opt.tenant.code} • রোল: {opt.user.role}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Unified Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Input 1: Identifier */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ইউজার আইডি, মোবাইল নম্বর বা ইমেইল
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="যেমন: bdyusuf2016 অথবা 017xxxxxxxx"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                    />
                  </div>

                  {/* Real-Time Smart Peek Indicator */}
                  {peekInfo.matched && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                      {peekInfo.isSystemAdmin ? (
                        <div className="px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <span className="font-bold">সিস্টেম অ্যাডমিন রুট এক্সেস:</span>{' '}
                            <span className="text-purple-200">{peekInfo.displayName}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                          <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold">{peekInfo.displayName}</span>{' '}
                            <span className="text-emerald-200 text-[11px]">({peekInfo.subTitle})</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input 2: Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    পাসওয়ার্ড / সিকিউরিটি কোড
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড লিখুন..."
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>লগইন করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Bottom Form Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>সুরক্ষিত 256-Bit SSL এনক্রিপশন</span>
              <span className="font-mono">SmartERP V2.0</span>
            </div>
          </div>

          {/* Right Column: Platform Architecture Highlights */}
          <div className="lg:col-span-5 bg-slate-950/60 p-6 sm:p-7 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  মাল্টি-টেন্যান্ট ক্লাউড আর্কিটেকচার
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">
                সিস্টেম অ্যাডমিন রুট লেভেলে প্রবেশ করবেন এবং প্রতিটি দোকান তাদের স্বাধীন ডোমেন বা টেন্যান্ট লিংকের অধীনে পরিচালিত হয়।
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">রোল-ভিত্তিক অটো ল্যান্ডিং</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      ক্যাশিয়ার সরাসরি POS বিলিং এবং টেকনিশিয়ান সার্ভিসিং বোর্ডে নিয়ে যাবে।
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">রিয়েল-টাইম ক্লাউড সিঙ্ক</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      অফলাইন সাপোর্টসহ Supabase PostgreSQL-এ তাৎক্ষণিক ডেটা পারসিস্টেন্স।
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">আইসোলেটেড টেন্যান্ট ডেটা</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      প্রতিটি দোকানের ইনভেন্টরি, হিসাব, কাস্টমার ও বিক্রয় সম্পূর্ণ সুরক্ষিত ও আলাদা।
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Help Banner */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>সিস্টেম অ্যাডমিন মাস্টার অ্যাকাউন্ট: </span>
              <span className="font-mono font-bold text-purple-300">bdyusuf2016</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800/50 z-10">
        © 2026 SmartERP Enterprise Platform. All rights reserved.
      </footer>
    </div>
  );
};
