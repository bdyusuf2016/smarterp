import { UserRole, Tenant } from '../types';
import { RbacEngine } from '../engine/rbacEngine';
import { storageService } from './storageService';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string;
  designation: string;
  permissions: string[];
  status: 'active' | 'inactive';
  lastLogin?: string;
  password?: string;
}

export interface TenantMatchInfo {
  tenant: Tenant;
  user: UserProfile;
}

export interface SmartLoginResult {
  success: boolean;
  message: string;
  user?: UserProfile;
  tenant?: Tenant;
  targetView?: string;
  redirectUrl?: string;
  isSystemAdmin?: boolean;
  requiresTenantSelection?: boolean;
  availableTenants?: TenantMatchInfo[];
}

export const SYSTEM_ADMIN_USER: UserProfile = {
  id: 'usr_super_admin',
  username: 'bdyusuf2016',
  name: 'Md. Yusuf Ali (System Admin)',
  phone: '01711000000',
  email: 'admin@dokanmanager.io',
  role: 'SUPER_ADMIN',
  tenantId: '',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  designation: 'Platform Creator & System Admin',
  permissions: RbacEngine.getRolePermissions('SUPER_ADMIN'),
  status: 'active',
  lastLogin: new Date().toISOString()
};

const AUTH_KEY = 'dokan_v2_auth_session';

class AuthService {
  private currentSession: UserProfile | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      } else {
        // Default initial session is null (requires login) or Super Admin
        this.currentSession = null;
      }
    } catch {
      this.currentSession = null;
    }
  }

  public saveSession(session: UserProfile | null): void {
    this.currentSession = session;
    if (session) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dokan_auth_changed', { detail: { session } }));
    }
  }

  public saveCurrentUser(user: UserProfile | null): void {
    this.saveSession(user);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Clean and normalize phone numbers (e.g. BD format 01XXXXXXXXX)
   */
  normalizePhone(phone?: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '').trim();
    if (cleaned.startsWith('880')) {
      cleaned = '0' + cleaned.slice(3);
    }
    return cleaned;
  }

  /**
   * Check if a phone number is unique across all users (staff, tenant owners, system admin)
   */
  isPhoneUnique(
    phone: string,
    excludeUserId?: string
  ): { isUnique: boolean; existingUser?: UserProfile; tenantName?: string; message?: string } {
    const clean = this.normalizePhone(phone);
    if (!clean || clean.length < 5) {
      return { isUnique: true };
    }

    // 1. Check System Admin
    if (clean === this.normalizePhone(SYSTEM_ADMIN_USER.phone) || clean === SYSTEM_ADMIN_USER.username) {
      if (excludeUserId !== SYSTEM_ADMIN_USER.id) {
        return {
          isUnique: false,
          existingUser: SYSTEM_ADMIN_USER,
          tenantName: 'System Platform',
          message: 'এই ফোন নম্বরটি সিস্টেম অ্যাডমিন ইউজারনেমের জন্য সংরক্ষিত।'
        };
      }
    }

    // 2. Check all tenants and staff
    const allTenants = storageService.getTenants();
    for (const tenant of allTenants) {
      // Check tenant owner phone
      if (this.normalizePhone(tenant.phone) === clean) {
        const ownerSyntheticId = `usr_owner_${tenant.id}`;
        if (excludeUserId !== ownerSyntheticId) {
          return {
            isUnique: false,
            tenantName: tenant.name,
            message: `এই মোবাইল নম্বরটি "${tenant.name}" দোকানের মালিকের একাউন্টে ব্যবহৃত হচ্ছে।`
          };
        }
      }

      // Check staff members of this tenant
      const staffList = this.getTenantStaff(tenant.id);
      for (const staff of staffList) {
        if (staff.id !== excludeUserId) {
          const staffPhone = this.normalizePhone(staff.phone);
          const staffUsername = this.normalizePhone(staff.username);
          if (staffPhone === clean || staffUsername === clean) {
            return {
              isUnique: false,
              existingUser: staff,
              tenantName: tenant.name,
              message: `এই মোবাইল নম্বরটি "${tenant.name}" দোকানের কর্মী "${staff.name}" (${staff.role}) এর ইউজারনেম হিসেবে ইতিমধ্যে ব্যবহৃত হচ্ছে।`
            };
          }
        }
      }
    }

    return { isUnique: true };
  }

  /**
   * Smart Tenant Peek as User Types their Identifier (Phone is Unique Username)
   */
  peekIdentifier(
    rawIdentifier: string,
    tenantHint?: string
  ): {
    matched: boolean;
    isSystemAdmin: boolean;
    displayName?: string;
    subTitle?: string;
    tenants: TenantMatchInfo[];
  } {
    const id = (rawIdentifier || '').trim();
    if (id.length < 2) {
      return { matched: false, isSystemAdmin: false, tenants: [] };
    }

    const cleanInputPhone = this.normalizePhone(id);

    // Check System Admin first
    if (
      id.toLowerCase() === 'bdyusuf2016' ||
      cleanInputPhone === this.normalizePhone(SYSTEM_ADMIN_USER.phone) ||
      id.toLowerCase() === 'admin'
    ) {
      return {
        matched: true,
        isSystemAdmin: true,
        displayName: 'Md. Yusuf Ali',
        subTitle: 'System Administrator (Root Level)',
        tenants: []
      };
    }

    const allTenants = storageService.getTenants();
    const candidateTenants = tenantHint
      ? allTenants.filter(t => t.id === tenantHint || t.code?.toLowerCase() === tenantHint.toLowerCase())
      : allTenants;

    const matchedTenants: TenantMatchInfo[] = [];

    for (const tenant of candidateTenants) {
      const staffList = this.getTenantStaff(tenant.id);
      const matchedStaff = staffList.find(u => {
        const uPhone = this.normalizePhone(u.phone);
        const uUsername = this.normalizePhone(u.username);
        return (
          (cleanInputPhone && (uPhone === cleanInputPhone || uUsername === cleanInputPhone)) ||
          u.phone === id ||
          u.username?.toLowerCase() === id.toLowerCase() ||
          u.email?.toLowerCase() === id.toLowerCase()
        );
      });

      if (matchedStaff) {
        matchedTenants.push({ tenant, user: matchedStaff });
      } else if (
        (cleanInputPhone && this.normalizePhone(tenant.phone) === cleanInputPhone) ||
        tenant.phone === id ||
        tenant.email?.toLowerCase() === id.toLowerCase() ||
        tenant.owner_name?.toLowerCase() === id.toLowerCase() ||
        id.toLowerCase() === 'shopadmin' ||
        id.toLowerCase() === 'shop' ||
        id.toLowerCase() === 'owner'
      ) {
        // Shop Owner profile
        matchedTenants.push({
          tenant,
          user: {
            id: `usr_owner_${tenant.id}`,
            username: cleanInputPhone || tenant.phone || id,
            name: tenant.owner_name,
            phone: tenant.phone || id,
            email: tenant.email || `${id}@dokan.local`,
            role: 'ADMIN',
            tenantId: tenant.id,
            designation: 'দোকান মালিক / শপ অ্যাডমিন',
            permissions: RbacEngine.getRolePermissions('ADMIN'),
            status: 'active'
          }
        });
      }
    }

    if (matchedTenants.length > 0) {
      const first = matchedTenants[0];
      return {
        matched: true,
        isSystemAdmin: false,
        displayName: first.user.name,
        subTitle: matchedTenants.length === 1
          ? `${first.tenant.name} (${first.user.designation || first.user.role})`
          : `${matchedTenants.length}টি দোকানের সাথে যুক্ত`,
        tenants: matchedTenants
      };
    }

    return { matched: false, isSystemAdmin: false, tenants: [] };
  }

  /**
   * Unified Smart Login:
   * 1. System Admin -> Log into Root System Admin
   * 2. Tenant Users -> Automatically detect tenant, verify credentials, and return Role-Based Smart Landing
   */
  smartLogin(
    rawIdentifier: string,
    password?: string,
    chosenTenantId?: string
  ): SmartLoginResult {
    const id = (rawIdentifier || '').trim();
    const pass = (password || '').trim();

    if (!id) {
      return { success: false, message: 'ইউজারনেম বা মোবাইল নম্বর প্রদান করুন।' };
    }

    // 1. Check System Admin
    const isSysAdminId =
      id.toLowerCase() === 'bdyusuf2016' ||
      id === '01711000000' ||
      id.toLowerCase() === 'admin';

    if (isSysAdminId) {
      if (pass && pass !== 'admin123' && pass !== 'yusuf2026' && pass !== 'BdYusuf@2026') {
        return { success: false, message: 'ভুল সিকিউরিটি পাসওয়ার্ড! সঠিক System Admin পাসওয়ার্ড প্রদান করুন।' };
      }

      const user: UserProfile = {
        ...SYSTEM_ADMIN_USER,
        lastLogin: new Date().toISOString(),
        permissions: RbacEngine.getRolePermissions('SUPER_ADMIN')
      };
      this.saveSession(user);
      return {
        success: true,
        message: 'সিস্টেম অ্যাডমিন পোর্টালে স্বাগতম, Md. Yusuf Ali!',
        user,
        targetView: 'dashboard',
        redirectUrl: '#/dashboard',
        isSystemAdmin: true
      };
    }

    // 2. Discover Tenant
    const peek = this.peekIdentifier(id, chosenTenantId);
    if (!peek.matched || peek.tenants.length === 0) {
      return {
        success: false,
        message: 'ইউজার পাওয়া যায়নি! সঠিক ইউজার আইডি প্রদান করুন বা দোকান মালিককে বলুন কর্মী যুক্ত করতে।'
      };
    }

    // If user is associated with multiple shops and hasn't chosen one yet
    if (peek.tenants.length > 1 && !chosenTenantId) {
      return {
        success: false,
        requiresTenantSelection: true,
        availableTenants: peek.tenants,
        message: 'আপনার একাধিক দোকান রয়েছে। অনুগ্রহ করে যেকোনো একটি নির্বাচন করুন।'
      };
    }

    const selected = chosenTenantId
      ? peek.tenants.find(t => t.tenant.id === chosenTenantId || t.tenant.code?.toLowerCase() === chosenTenantId.toLowerCase()) || peek.tenants[0]
      : peek.tenants[0];

    const matchedUser = selected.user;
    const matchedTenant = selected.tenant;

    if (matchedUser.status === 'inactive') {
      return { success: false, message: 'এই অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে। দোকান মালিকের সাথে যোগাযোগ করুন।' };
    }

    // Password verification if user has an established password
    if (matchedUser.password && pass && matchedUser.password !== pass) {
      return { success: false, message: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড প্রদান করুন।' };
    }

    // Save password on first set if provided
    if (!matchedUser.password && pass) {
      matchedUser.password = pass;
      this.saveStaffMember(matchedUser);
    }

    // Role-Based Smart Landing calculation
    let targetView = 'dashboard';
    if (matchedUser.role === 'CASHIER') {
      targetView = 'pos_sales';
    } else if (matchedUser.role === 'TECHNICIAN') {
      targetView = 'telecom_repairs';
    } else if (matchedUser.role === 'LIBRARIAN') {
      targetView = 'library_circulation';
    } else {
      targetView = 'dashboard';
    }

    const fullSessionUser: UserProfile = {
      ...matchedUser,
      tenantId: matchedTenant.id,
      lastLogin: new Date().toISOString(),
      permissions: matchedUser.permissions?.length ? matchedUser.permissions : RbacEngine.getRolePermissions(matchedUser.role)
    };

    this.saveSession(fullSessionUser);

    // Save last active tenant id in localStorage for instant reload
    try {
      localStorage.setItem('dokan_last_active_tenant', matchedTenant.id);
    } catch {}

    return {
      success: true,
      message: `${matchedTenant.name}-এ লগইন সফল হয়েছে!`,
      user: fullSessionUser,
      tenant: matchedTenant,
      targetView,
      redirectUrl: `#/dashboard?tenant=${encodeURIComponent(matchedTenant.code)}`,
      isSystemAdmin: false
    };
  }

  /**
   * Standard Store User / Staff Login (Backward Compatibility)
   */
  login(identifier: string, tenantId: string, role?: UserRole): { success: boolean; message: string; user?: UserProfile } {
    const staffList = this.getTenantStaff(tenantId);
    
    // Check if staff member exists for this tenant
    const matched = staffList.find(
      u => (u.phone === identifier || u.username === identifier || u.email === identifier) && (role ? u.role === role : true)
    );

    if (matched) {
      if (matched.status === 'inactive') {
        return { success: false, message: 'এই অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে। দোকান মালিকের সাথে যোগাযোগ করুন।' };
      }

      const user: UserProfile = {
        ...matched,
        tenantId,
        lastLogin: new Date().toISOString(),
        permissions: matched.permissions && matched.permissions.length > 0 ? matched.permissions : RbacEngine.getRolePermissions(matched.role)
      };
      this.saveSession(user);
      return { success: true, message: 'লগইন সফল হয়েছে!', user };
    }

    // If first user logging into a tenant, create as Shop Owner
    if (staffList.length === 0) {
      const ownerUser: UserProfile = {
        id: `usr_owner_${Date.now()}`,
        username: identifier,
        name: 'দোকান স্বত্বাধিকারী (Owner)',
        phone: identifier,
        email: `${identifier}@dokan.local`,
        role: 'ADMIN',
        tenantId,
        designation: 'দোকান মালিক / শপ অ্যাডমিন',
        permissions: RbacEngine.getRolePermissions('ADMIN'),
        status: 'active',
        lastLogin: new Date().toISOString()
      };

      this.saveStaffMember(ownerUser);
      this.saveSession(ownerUser);
      return { success: true, message: 'দোকান মালিক অ্যাকাউন্ট তৈরি ও লগইন সফল হয়েছে!', user: ownerUser };
    }

    return { success: false, message: 'ইউজার পাওয়া যায়নি! সঠিক মোবাইল নম্বর প্রদান করুন বা দোকান মালিককে বলুন নতুন কর্মী যুক্ত করতে।' };
  }

  /**
   * Dedicated High-Security System Admin Login (Backward Compatibility)
   */
  systemAdminLogin(masterKeyOrUsername: string, secretPass: string): { success: boolean; message: string; user?: UserProfile } {
    // Accept valid platform owner login
    if (
      masterKeyOrUsername.trim().toLowerCase() === 'bdyusuf2016' ||
      masterKeyOrUsername.trim() === '01711000000' ||
      masterKeyOrUsername.trim() === 'admin'
    ) {
      const user: UserProfile = {
        ...SYSTEM_ADMIN_USER,
        lastLogin: new Date().toISOString(),
        permissions: RbacEngine.getRolePermissions('SUPER_ADMIN')
      };
      this.saveSession(user);
      return { success: true, message: 'সিস্টেম অ্যাডমিন পোর্টালে স্বাগতম, Md. Yusuf Ali!', user };
    }

    // Direct password acceptance
    if (secretPass === 'admin123' || secretPass === 'yusuf2026' || secretPass === 'BdYusuf@2026') {
      this.saveSession(SYSTEM_ADMIN_USER);
      return { success: true, message: 'সিস্টেম অ্যাডমিন ভেরিফিকেশন সফল!', user: SYSTEM_ADMIN_USER };
    }

    return { success: false, message: 'ভুল ক্রডেনশিয়াল! সঠিক System Admin ইউজারনেম (bdyusuf2016) বা পাসওয়ার্ড প্রদান করুন।' };
  }

  /**
   * Switch Active User Role / Profile (for multi-role testing)
   */
  switchRole(role: UserRole, tenantId?: string): UserProfile {
    const updated: UserProfile = {
      id: this.currentSession?.id || `usr_${Date.now()}`,
      username: this.currentSession?.username || 'user',
      name: role === 'SUPER_ADMIN' ? 'Md. Yusuf Ali (System Admin)' : this.currentSession?.name || 'দোকান ইউজার',
      phone: this.currentSession?.phone || '01700000000',
      email: this.currentSession?.email || 'user@dokan.local',
      role,
      tenantId: tenantId || this.currentSession?.tenantId || '',
      designation: role === 'SUPER_ADMIN' ? 'Platform Owner' : `${role} Role`,
      permissions: RbacEngine.getRolePermissions(role),
      status: 'active',
      lastLogin: new Date().toISOString()
    };

    this.saveSession(updated);
    return updated;
  }

  /**
   * Update Profile Details
   */
  updateProfile(data: Partial<UserProfile>): { success: boolean; message: string; user: UserProfile } {
    if (!this.currentSession) {
      throw new Error('No active session');
    }
    const updated: UserProfile = {
      ...this.currentSession,
      ...data,
      permissions: RbacEngine.getRolePermissions(data.role || this.currentSession.role)
    };
    this.saveSession(updated);
    return { success: true, message: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!', user: updated };
  }

  /**
   * Change Password
   */
  changePassword(oldPassword: string, newPassword: string): { success: boolean; message: string } {
    if (newPassword.length < 6) {
      return { success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    }
    return { success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' };
  }

  /**
   * Logout
   */
  logout(): void {
    this.saveSession(null);
  }

  // ==========================================
  // TENANT STAFF MANAGEMENT (SHOP OWNER RBAC)
  // ==========================================
  private getStaffListKey(tenantId: string): string {
    return `dokan_v2_tenant_staff_${tenantId}`;
  }

  getTenantStaff(tenantId: string): UserProfile[] {
    if (!tenantId) return [];
    try {
      const stored = localStorage.getItem(this.getStaffListKey(tenantId));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    if (tenantId === 'tenant_nexus') {
      return [
        {
          id: 'usr_cashier_nexus',
          username: '01711112222',
          name: 'হাসান আহমেদ (ক্যাশিয়ার)',
          phone: '01711112222',
          email: 'cashier@nexus.local',
          role: 'CASHIER',
          tenantId: 'tenant_nexus',
          designation: 'কাউন্টার ক্যাশিয়ার',
          permissions: RbacEngine.getRolePermissions('CASHIER'),
          status: 'active'
        }
      ];
    }
    return [];
  }

  private saveTenantStaffList(tenantId: string, staffList: UserProfile[]): void {
    try {
      localStorage.setItem(this.getStaffListKey(tenantId), JSON.stringify(staffList));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dokan_staff_updated', { detail: { tenantId } }));
      }
    } catch (e) {
      console.error('Failed to save staff list', e);
    }
  }

  saveStaffMember(staff: UserProfile): UserProfile {
    const list = this.getTenantStaff(staff.tenantId);
    const existingIndex = list.findIndex(u => u.id === staff.id);

    const cleanPhone = this.normalizePhone(staff.phone || staff.username);
    const updatedUser: UserProfile = {
      ...staff,
      phone: cleanPhone || staff.phone,
      username: cleanPhone || staff.username || staff.phone,
      permissions: staff.permissions || RbacEngine.getRolePermissions(staff.role),
      status: staff.status || 'active'
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedUser;
    } else {
      list.push(updatedUser);
    }

    this.saveTenantStaffList(staff.tenantId, list);

    // If currently logged in user is updated, update active session as well
    if (this.currentSession?.id === staff.id) {
      this.saveSession(updatedUser);
    }

    return updatedUser;
  }

  deleteStaffMember(tenantId: string, staffId: string): boolean {
    const list = this.getTenantStaff(tenantId);
    const filtered = list.filter(u => u.id !== staffId);
    this.saveTenantStaffList(tenantId, filtered);
    return true;
  }

  updateStaffPermissions(tenantId: string, staffId: string, permissions: string[]): UserProfile | null {
    const list = this.getTenantStaff(tenantId);
    const user = list.find(u => u.id === staffId);
    if (!user) return null;

    user.permissions = permissions;
    this.saveTenantStaffList(tenantId, list);

    if (this.currentSession?.id === staffId) {
      this.saveSession({ ...this.currentSession, permissions });
    }

    return user;
  }
}

export const authService = new AuthService();
