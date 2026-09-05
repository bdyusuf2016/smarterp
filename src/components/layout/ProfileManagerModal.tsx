import React, { useState } from 'react';
import { 
  X, 
  User, 
  Shield, 
  KeyRound, 
  Building2, 
  Phone, 
  Mail, 
  Check, 
  AlertCircle, 
  LogOut,
  Save,
  CheckCircle2,
  Lock,
  Boxes,
  Sparkles,
  SlidersHorizontal,
  Store
} from 'lucide-react';
import { UserProfile, authService } from '../../services/authService';
import { Tenant, Module } from '../../types';
import { ALL_PERMISSIONS } from '../../engine/rbacEngine';
import { RuleEngine } from '../../engine/ruleEngine';
import { storageService } from '../../services/storageService';
import { useConfirm } from '../../context/ConfirmationContext';

interface ProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  activeTenant: Tenant;
  onProfileUpdated: (user: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileManagerModal: React.FC<ProfileManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTenant,
  onProfileUpdated,
  onLogout,
}) => {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'security'>('profile');
  const [permissionSubTab, setPermissionSubTab] = useState<'modules' | 'actions'>('modules');
  
  // Profile form state
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);
  const [designation, setDesignation] = useState(currentUser.designation);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  // Retrieve freshest tenant state to avoid stale props
  const currentTenant = storageService.getTenants().find(t => t.id === activeTenant.id) || activeTenant;
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // System Admin configured modules for this tenant
  const allModules = storageService.getModules();
  const moduleStatusList = allModules.map(mod => {
    const isEnabled = isSuperAdmin ? true : RuleEngine.isModuleEnabled(currentTenant, mod.code);
    return {
      ...mod,
      isEnabled
    };
  });
  const enabledModulesCount = moduleStatusList.filter(m => m.isEnabled).length;

  // Evaluated action permissions
  const evaluatedPermissions = ALL_PERMISSIONS.map(p => {
    const isModuleAllowed = isSuperAdmin ? true : RuleEngine.isModuleEnabled(currentTenant, p.module);
    const hasRolePermission = isSuperAdmin ? true : (currentUser.permissions || []).includes(p.code);
    const isEffective = isModuleAllowed && hasRolePermission;
    return {
      ...p,
      isModuleAllowed,
      hasRolePermission,
      isEffective
    };
  });
  const activePermissionsCount = evaluatedPermissions.filter(p => p.isEffective).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = authService.updateProfile({
        name,
        phone,
        email,
        designation
      });
      onProfileUpdated(res.user);
      setSuccessMsg('প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }

    const res = authService.changePassword(oldPassword, newPassword);
    if (res.success) {
      setSuccessMsg(res.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600/30 border-2 border-blue-400/50 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow-inner">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{currentUser.name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {currentUser.role}
                </span>
                {isSuperAdmin ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    👑 Root Platform
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    🏢 {currentTenant.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{currentUser.designation}</span>
                <span>•</span>
                <span className="font-mono text-slate-400">ID: {currentUser.username}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>প্রোফাইল তথ্য</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>অনুমোদিত মডিউল ও পারমিশন</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-bold">
              {enabledModulesCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>সিকিউরিটি ও পাসওয়ার্ড</span>
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণ নাম</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পদবী / ডেজিগনেশন</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল ফোন নম্বর</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Organization Profile Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>বর্তমান দোকান ও ব্রাঞ্চ সংযোগ</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">দোকানের নাম:</span>
                    <span className="font-semibold text-slate-800">{currentTenant.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">টেন্যান্ট কোড:</span>
                    <span className="font-mono font-semibold text-slate-800">{currentTenant.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ঠিকানা:</span>
                    <span className="font-semibold text-slate-800">{currentTenant.address || 'বাংলাদেশ'}</span>
                  </div>
                  {currentTenant.phone && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">মোবাইল:</span>
                      <span className="font-mono font-semibold text-slate-800">{currentTenant.phone}</span>
                    </div>
                  )}
                  {currentTenant.tin_number && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">TIN নম্বর:</span>
                      <span className="font-mono font-semibold text-emerald-700">{currentTenant.tin_number}</span>
                    </div>
                  )}
                  {(currentTenant.bin_number || currentTenant.vat_number) && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">BIN / VAT নম্বর:</span>
                      <span className="font-mono font-semibold text-blue-700">{currentTenant.bin_number || currentTenant.vat_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>তথ্য সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              {/* Contextual Banner */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold">
                    <Store className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>দোকান: {currentTenant.name} ({currentTenant.code})</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 font-mono text-[10px]">
                      {enabledModulesCount} টি মডিউল অনুমোদিত
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 mt-1">
                    সিস্টেম অ্যাডমিন কর্তৃক এই দোকানের জন্য যে সকল মডিউল সক্রিয় করা হয়েছে, শুধুমাত্র সেই মডিউলগুলোর ফিচার ও পারমিশন Shop Admin ব্যবহার করতে পারবেন।
                  </p>
                </div>
              </div>

              {/* Sub Navigation Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPermissionSubTab('modules')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    permissionSubTab === 'modules'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5 text-blue-600" />
                  <span>১. সিস্টেম অ্যাডমিন অনুমোদিত মডিউলসমূহ ({enabledModulesCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionSubTab('actions')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    permissionSubTab === 'actions'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>২. রোল অ্যাকশন পারমিশন তালিকা ({activePermissionsCount})</span>
                </button>
              </div>

              {/* SUBTAB 1: System Admin Configured Modules */}
              {permissionSubTab === 'modules' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {moduleStatusList.map(mod => (
                      <div 
                        key={mod.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                          mod.isEnabled 
                            ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs' 
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-slate-900">{mod.name}</div>
                            <div className="font-mono text-[10px] text-slate-500 mt-0.5">{mod.code}</div>
                          </div>
                          {mod.isEnabled ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>অনুমোদিত</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center gap-1 shrink-0">
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>বন্ধ</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 line-clamp-2">
                          {mod.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: Role Action Permissions */}
              {permissionSubTab === 'actions' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evaluatedPermissions.map(p => (
                      <div 
                        key={p.code} 
                        className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 ${
                          p.isEffective 
                            ? 'bg-white border-emerald-200 shadow-2xs' 
                            : !p.isModuleAllowed 
                            ? 'bg-slate-50/80 border-slate-200 opacity-70' 
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {p.isEffective ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : !p.isModuleAllowed ? (
                            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-bold text-xs text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.description}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {p.code}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400">
                                • {p.module}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {p.isEffective ? (
                            <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              সক্রিয়
                            </span>
                          ) : !p.isModuleAllowed ? (
                            <span className="inline-block text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded" title="সিস্টেম অ্যাডমিন কর্তৃক এই মডিউলটি বন্ধ রয়েছে">
                              মডিউল বন্ধ
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              রোলে অননুমোদিত
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                পাসওয়ার্ড পরিবর্তন করলে পরবর্তী লগইনে নতুন পাসওয়ার্ড প্রযোজ্য হবে।
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পুরাতন পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড দিন..."
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর..."
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="পুনরায় পাসওয়ার্ড লিখুন..."
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  পাসওয়ার্ড পরিবর্তন করুন
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer with Logout */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={async () => {
              const ok = await confirm({
                title: 'লগআউট করতে চান?',
                message: 'আপনি কি নিশ্চিত যে বর্তমান সেশন থেকে লগআউট করতে চান?',
                confirmText: 'হ্যাঁ, লগআউট করুন',
                cancelText: 'বাতিল',
                type: 'info',
                icon: 'logout'
              });
              if (ok) {
                onLogout();
                onClose();
              }
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            অ্যাকাউন্ট লগআউট (Logout)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
