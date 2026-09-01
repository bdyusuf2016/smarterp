import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  RotateCcw, 
  SlidersHorizontal,
  User,
  Shield,
  LogOut,
  KeyRound,
  Lock,
  Sparkles,
  Users,
  ExternalLink,
  Settings,
  Sun,
  Moon,
  Globe,
  Menu
} from 'lucide-react';
import { Tenant, UserRole, BusinessCategory } from '../../types';
import { storageService } from '../../services/storageService';
import { UserProfile, authService } from '../../services/authService';
import { i18n } from '../../services/i18nService';
import { IconRenderer } from '../common/IconRenderer';
import { Badge } from '../common/Badge';

interface HeaderProps {
  activeTenant: Tenant;
  onTenantChange: (tenant: Tenant) => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  categories: BusinessCategory[];
  onOpenCategoryStudio: () => void;
  onOpenProfileModal: () => void;
  onOpenRbacMatrix: () => void;
  onOpenStaffManagement?: () => void;
  onOpenTenantProvisioning?: () => void;
  onOpenGlobalSettings?: () => void;
  onToggleMobileMenu?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTenant,
  onTenantChange,
  currentUser,
  onUserChange,
  categories,
  onOpenCategoryStudio,
  onOpenProfileModal,
  onOpenRbacMatrix,
  onOpenStaffManagement,
  onOpenTenantProvisioning,
  onOpenGlobalSettings,
  onToggleMobileMenu,
  onLogout
}) => {
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const tenants = storageService.getTenants();

  const getCategoryDetails = (catId: string) => {
    return categories.find(c => c.id === catId);
  };

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('dokan_v2_theme') as 'light' | 'dark') || 'light';
  });
  const [currentLang, setCurrentLang] = useState<'bn' | 'en'>(() => {
    return i18n.getLanguage();
  });

  useEffect(() => {
    const handleLang = () => setCurrentLang(i18n.getLanguage());
    const handleTheme = () => {
      const t = (localStorage.getItem('dokan_v2_theme') as 'light' | 'dark') || 'light';
      setCurrentTheme(t);
    };
    window.addEventListener('dokan_lang_changed', handleLang);
    window.addEventListener('dokan_theme_changed', handleTheme);
    return () => {
      window.removeEventListener('dokan_lang_changed', handleLang);
      window.removeEventListener('dokan_theme_changed', handleTheme);
    };
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(nextTheme);
    localStorage.setItem('dokan_v2_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('dokan_theme_changed', { detail: { theme: nextTheme } }));
  };

  const handleToggleLanguage = () => {
    const nextLang = currentLang === 'bn' ? 'en' : 'bn';
    setCurrentLang(nextLang);
    i18n.setLanguage(nextLang);
  };

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white border-b border-[#dee2e6] px-2.5 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Hamburger (Mobile) + Brand & Tenant Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-4">
        {/* Mobile Menu Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="মেনু খুলুন (Open Navigation Menu)"
        >
          <Menu className="w-5 h-5 text-indigo-600" />
        </button>

        {/* Tenant Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setTenantDropdownOpen(!tenantDropdownOpen);
              setUserDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[#f8f9fa] hover:bg-gray-100 border border-[#dee2e6] rounded-lg text-left transition-colors cursor-pointer max-w-[140px] sm:max-w-xs"
          >
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1a1b1e] leading-tight truncate">
                {activeTenant?.name || (currentLang === 'en' ? 'No Shop Connected' : 'কোনো দোকান সংযুক্ত নেই')}
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#868e96] font-mono">
                <span>TENANT: {activeTenant?.code || 'N/A'}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#868e96] ml-0.5 shrink-0" />
          </button>

          {/* Tenant Menu Dropdown */}
          {tenantDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-[#dee2e6] py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-[#dee2e6] bg-[#f8f9fa]">
                <p className="text-[10px] font-bold uppercase text-[#495057] tracking-widest">
                  {currentLang === 'en' ? 'Switch Shop Profile' : 'দোকান প্রোফাইল পরিবর্তন করুন'}
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {tenants.map(t => {
                  const isCurrent = t.id === activeTenant.id;
                  
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onTenantChange(t);
                        setTenantDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isCurrent ? 'bg-blue-50/70 font-bold text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold truncate text-[#1a1b1e]">{t.name}</div>
                        <div className="text-[10px] text-[#868e96] font-mono flex items-center gap-2 mt-0.5">
                          <span>{t.code}</span>
                          <span>•</span>
                          <span>{t.owner_name || (currentLang === 'en' ? 'Owner' : 'মালিক')}</span>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Store Active Category Badges */}
        <div className="hidden md:flex items-center gap-1.5 overflow-hidden">
          {activeTenant?.active_categories?.filter(ac => ac.is_active).map(ac => {
            const cat = getCategoryDetails(ac.business_category_id);
            if (!cat) return null;

            return (
              <Badge
                key={ac.business_category_id}
                variant="primary"
                size="sm"
                className="flex items-center gap-1 font-semibold text-[11px] py-0.5"
              >
                <IconRenderer name={cat.icon} className="w-3 h-3" />
                <span>{cat.name}</span>
                {ac.is_primary && <span className="text-[8px] uppercase font-bold opacity-80">(Primary)</span>}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Right: Actions, Theme & Lang Toggles & User Profile */}
      <div className="flex items-center gap-2">
        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="p-2 rounded-xl bg-[#f8f9fa] hover:bg-slate-200 text-slate-700 border border-[#dee2e6] transition-all cursor-pointer shadow-2xs"
          title={currentTheme === 'light' ? 'ডার্ক মোড সক্রিয় করুন' : 'লাইট মোড সক্রিয় করুন'}
        >
          {currentTheme === 'light' ? (
            <Moon className="w-4 h-4 text-indigo-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Language Toggle Button (বাংলা / EN) */}
        <button
          type="button"
          onClick={handleToggleLanguage}
          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          title="ভাষা পরিবর্তন করুন (Switch Language)"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{currentLang === 'bn' ? 'বাংলা' : 'EN'}</span>
        </button>

        {/* Category Studio CTA (Visible to Super Admin Platform Owner only) */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={onOpenCategoryStudio}
            className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentLang === 'en' ? 'Category Studio' : 'ক্যাটাগরি স্টুডিও'}</span>
          </button>
        )}

        {/* System Admin Portal quick badge for Super Admin */}
        {isSuperAdmin && (
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-xs font-bold font-mono">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>ID: bdyusuf2016</span>
          </div>
        )}

        {/* User Profile & Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setTenantDropdownOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-[#dee2e6] hover:bg-slate-50 rounded-lg text-xs font-semibold text-[#212529] transition-colors cursor-pointer shadow-xs"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] overflow-hidden shrink-0">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>

            <div className="text-left hidden md:block">
              <div className="font-bold text-[#1a1b1e] leading-tight max-w-[120px] truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-blue-600 font-bold leading-none">
                {currentUser.role}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-[#868e96]" />
          </button>

          {/* User Account Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-2xl border border-[#dee2e6] py-2 z-50 animate-in fade-in zoom-in-95 divide-y divide-slate-100">
              {/* User Header Summary */}
              <div className="px-4 py-2.5 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-800 truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{currentUser.phone}</div>
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenProfileModal();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>প্রোফাইল ম্যানেজার (Profile Manager)</span>
                </button>

                {onOpenGlobalSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenGlobalSettings();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span>গ্লোবাল সেটিংস (Global Settings)</span>
                  </button>
                )}

                {(isSuperAdmin || isAdmin) && onOpenStaffManagement && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenStaffManagement();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>দোকানের কর্মচারী ও পারমিশন</span>
                  </button>
                )}

                {isSuperAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onOpenTenantProvisioning) onOpenTenantProvisioning();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>দোকান ও ডোমেন প্রভিশনিং</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenRbacMatrix();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-purple-600" />
                      <span>রোল ও পারমিশন ম্যাট্রিক্স (RBAC)</span>
                    </button>
                  </>
                )}
              </div>

              {/* Logout Button */}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    if (window.confirm('আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?')) {
                      onLogout();
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>লগআউট (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset State */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all demo data back to clean initial state?')) {
              storageService.resetAll();
            }
          }}
          title="Reset Demo Data"
          className="p-2 text-[#868e96] hover:text-[#212529] hover:bg-gray-100 rounded-lg border border-[#dee2e6] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
