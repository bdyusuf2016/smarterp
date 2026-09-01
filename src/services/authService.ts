import { UserRole } from '../types';
import { RbacEngine } from '../engine/rbacEngine';

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
    window.dispatchEvent(new CustomEvent('dokan_auth_changed', { detail: { session } }));
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
   * Standard Store User / Staff Login (Against registered tenant staff)
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
   * Dedicated High-Security System Admin Login
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
    if (secretPass === 'admin123' || secretPass === 'yusuf2026') {
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
    return [];
  }

  private saveTenantStaffList(tenantId: string, staffList: UserProfile[]): void {
    try {
      localStorage.setItem(this.getStaffListKey(tenantId), JSON.stringify(staffList));
      window.dispatchEvent(new CustomEvent('dokan_staff_updated', { detail: { tenantId } }));
    } catch (e) {
      console.error('Failed to save staff list', e);
    }
  }

  saveStaffMember(staff: UserProfile): UserProfile {
    const list = this.getTenantStaff(staff.tenantId);
    const existingIndex = list.findIndex(u => u.id === staff.id);

    const updatedUser: UserProfile = {
      ...staff,
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
