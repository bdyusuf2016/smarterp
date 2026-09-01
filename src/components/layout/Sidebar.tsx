import React, { useState, useEffect } from 'react';
import { Tenant, UserRole } from '../../types';
import { NavigationEngine, NavItem } from '../../engine/navigationEngine';
import { storageService } from '../../services/storageService';
import { UserProfile } from '../../services/authService';
import { i18n } from '../../services/i18nService';
import { IconRenderer } from '../common/IconRenderer';
import { 
  Store, 
  LogOut, 
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  currentUser: UserProfile;
  activeViewId: string;
  onSelectView: (viewId: string) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTenant,
  activeRole,
  currentUser,
  activeViewId,
  onSelectView,
  onOpenProfile,
  onLogout,
  isMobileDrawer = false,
  onCloseMobileDrawer
}) => {
  const [lang, setLang] = useState<'bn' | 'en'>(() => i18n.getLanguage());
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('dokan_v2_theme') === 'dark';
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (isMobileDrawer) return false;
    return localStorage.getItem('dokan_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    const handleLang = () => setLang(i18n.getLanguage());
    const handleTheme = (e: any) => {
      if (e.detail?.theme) {
        setIsDark(e.detail.theme === 'dark');
      } else {
        setIsDark(document.documentElement.classList.contains('dark') || localStorage.getItem('dokan_v2_theme') === 'dark');
      }
    };

    window.addEventListener('dokan_lang_changed', handleLang);
    window.addEventListener('dokan_theme_changed', handleTheme);
    
    // Also use MutationObserver on html class attribute for instant sync
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('dokan_lang_changed', handleLang);
      window.removeEventListener('dokan_theme_changed', handleTheme);
      observer.disconnect();
    };
  }, []);

  const toggleCollapse = () => {
    if (isMobileDrawer) return;
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('dokan_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navItems = NavigationEngine.getDynamicNavigation(activeTenant, activeRole);
  const categories = storageService.getCategories();
  const primaryCatId = activeTenant?.active_categories?.find(c => c.is_primary)?.business_category_id;
  const primaryCategory = categories.find(c => c.id === primaryCatId)?.name || 'ব্যবসা ও ইনভেন্টরি';

  // Group items by category
  const groups: { [key: string]: NavItem[] } = {};
  navItems.forEach(item => {
    const cat = item.category || 'অন্যান্য';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });

  const translateGroup = (grp: string) => {
    if (grp === 'সার্বিক চিত্র') return i18n.t('group.overview', 'সার্বিক চিত্র', 'OVERVIEW');
    if (grp === 'দৈনিক সেলস ও বিলিং') return i18n.t('group.sales', 'দৈনিক সেলস ও বিলিং', 'SALES & BILLING');
    if (grp === 'ইনভেন্টরি ও স্টক') return i18n.t('group.inventory', 'ইনভেন্টরি ও স্টক', 'INVENTORY & STOCK');
    if (grp === 'হিসাব ও লেজার') return i18n.t('group.ledger', 'হিসাব ও লেজার', 'ACCOUNTS & LEDGERS');
    if (grp === 'দোকান প্রশাসন') return i18n.t('group.admin', 'দোকান প্রশাসন', 'SHOP ADMINISTRATION');
    if (grp === 'সিস্টেম অ্যাডমিন') return i18n.t('group.super_admin', 'সিস্টেম অ্যাডমিন', 'SYSTEM ADMIN');
    return grp;
  };

  const handleItemSelect = (viewId: string) => {
    onSelectView(viewId);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  return (
    <aside 
      className={`relative flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out h-full ${
        isMobileDrawer ? 'w-full' : isCollapsed ? 'w-18' : 'w-64'
      } ${
        isDark 
          ? 'bg-[#101319] border-[#222734] text-slate-300' 
          : 'bg-white border-slate-200 text-slate-700 shadow-xs'
      }`}
    >
      {/* Brand Header */}
      <div className={`border-b flex items-center transition-all ${
        !isMobileDrawer && isCollapsed ? 'p-3 justify-center' : 'p-4 justify-between'
      } ${
        isDark 
          ? 'border-[#222734] bg-[#0c0e12]' 
          : 'border-slate-200 bg-slate-50/80'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ring-2 ring-indigo-500/20">
            <Store className="w-5 h-5" />
          </div>
          
          {(isMobileDrawer || !isCollapsed) && (
            <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
              <span className={`font-bold text-sm leading-tight truncate tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                SmartERP
              </span>
              <span className={`text-[10px] font-semibold tracking-wide uppercase truncate mt-0.5 ${
                isDark ? 'text-blue-400' : 'text-indigo-600'
              }`}>
                {primaryCategory}
              </span>
            </div>
          )}
        </div>

        {/* Close Button for Mobile Drawer or Collapse Button for Desktop */}
        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/70'
            }`}
            title="বন্ধ করুন (Close Menu)"
          >
            <X className="w-5 h-5" />
          </button>
        ) : !isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/70'
            }`}
            title="সাইডবার ছোট করুন (Collapse Sidebar)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* When Collapsed: Quick Expand Button at Top */}
      {!isMobileDrawer && isCollapsed && (
        <div className={`p-2 flex justify-center border-b ${
          isDark ? 'border-[#222734]' : 'border-slate-100'
        }`}>
          <button
            type="button"
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            title="সাইডবার বড় করুন (Expand Sidebar)"
          >
            <PanelLeftOpen className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-indigo-600'}`} />
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-3 overflow-x-hidden">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="space-y-1">
            {!isCollapsed ? (
              <div className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider truncate ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {translateGroup(groupName)}
              </div>
            ) : (
              <div className="px-3 py-1 flex items-center justify-center">
                <div className={`w-4 h-[1px] ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
              </div>
            )}

            <div className="space-y-0.5 px-2">
              {items.map(item => {
                const isActive = activeViewId === item.id;
                const localizedLabel = i18n.t(`nav.${item.id}`, item.label);

                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleItemSelect(item.id)}
                      className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isCollapsed 
                          ? 'justify-center p-2.5' 
                          : 'justify-between px-3 py-2'
                      } ${
                        isActive
                          ? (isDark 
                              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20' 
                              : 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20')
                          : (isDark 
                              ? 'text-slate-400 hover:bg-[#1a1e28] hover:text-slate-100' 
                              : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-700')
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconRenderer
                          name={item.icon}
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive 
                              ? 'text-white' 
                              : (isDark 
                                  ? 'text-slate-400 group-hover:text-white' 
                                  : 'text-slate-500 group-hover:text-indigo-600')
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{localizedLabel}</span>
                        )}
                      </div>
                    </button>

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 border border-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span>{localizedLabel}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className={`border-t transition-all ${
        isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 flex items-center justify-between'
      } ${
        isDark 
          ? 'border-[#222734] bg-[#0c0e14]' 
          : 'border-slate-200 bg-slate-50'
      }`}>
        <button
          type="button"
          onClick={onOpenProfile}
          className={`flex items-center min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer ${
            isCollapsed ? 'justify-center' : 'gap-2.5 flex-1 mr-1'
          }`}
          title="প্রোফাইল ম্যানেজার খুলুন"
        >
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 shadow-2xs ${
            isDark ? 'ring-slate-700' : 'ring-slate-300'
          }`}>
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </div>
          
          {!isCollapsed && (
            <div className="min-w-0 truncate">
              <div className={`text-xs font-bold truncate leading-tight ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {currentUser.name}
              </div>
              <div className={`text-[10px] font-mono flex items-center gap-1 mt-0.5 ${
                isDark ? 'text-blue-400' : 'text-indigo-600'
              }`}>
                <span className="truncate">{currentUser.role}</span>
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('আপনি কি লগআউট করতে চান?')) {
              onLogout();
            }
          }}
          title="লগআউট (Logout)"
          className={`rounded-lg transition-colors cursor-pointer ${
            isCollapsed ? 'p-2' : 'p-1.5'
          } ${
            isDark 
              ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' 
              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
          }`}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
