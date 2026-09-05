import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  KeyRound, 
  Lock, 
  Phone, 
  Mail, 
  User, 
  Search, 
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Building2
} from 'lucide-react';
import { Tenant, UserRole } from '../../types';
import { UserProfile, authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, RbacEngine } from '../../engine/rbacEngine';
import { PinVerificationModal } from '../common/PinVerificationModal';

interface StaffManagementViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  activeTenant,
  activeRole
}) => {
  const [staffList, setStaffList] = useState<UserProfile[]>(() => authService.getTenantStaff(activeTenant.id));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Add / Edit Staff Modal state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  // Permission Configurator Modal state
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permTargetStaff, setPermTargetStaff] = useState<UserProfile | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('CASHIER');
  const [formDesignation, setFormDesignation] = useState('');
  const [formPassword, setFormPassword] = useState('123456');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadStaff = () => {
    setStaffList(authService.getTenantStaff(activeTenant.id));
  };

  useEffect(() => {
    loadStaff();
  }, [activeTenant.id]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormRole('CASHIER');
    setFormDesignation('POS ক্যাশিয়ার');
    setFormPassword('123456');
    setFormStatus('active');
    setIsStaffModalOpen(true);
  };

  // PIN Verification Modal State
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    actionType: 'delete' | 'edit';
    title?: string;
    subtitle?: string;
    itemName?: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    actionType: 'delete',
    onSuccess: () => {}
  });

  const openEditModalDirect = (staff: UserProfile) => {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormPhone(staff.phone);
    setFormEmail(staff.email);
    setFormRole(staff.role);
    setFormDesignation(staff.designation);
    setFormPassword('••••••••');
    setFormStatus(staff.status);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditModal = (staff: UserProfile) => {
    if (storageService.isPinRequired('edit', activeTenant.id)) {
      setPinModalConfig({
        isOpen: true,
        actionType: 'edit',
        title: 'কর্মী তথ্য সম্পাদনায় পিন ভেরিফিকেশন',
        subtitle: `কর্মী "${staff.name}" (${staff.phone}) এর তথ্য এডিট করতে সিকিউরিটি পিন দিন`,
        itemName: staff.name,
        onSuccess: () => openEditModalDirect(staff)
      });
    } else {
      openEditModalDirect(staff);
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formPhone.trim()) {
      showNotification('কর্মচারীর নাম ও মোবাইল নম্বর পূরণ করুন', 'error');
      return;
    }

    const cleanPhone = authService.normalizePhone(formPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      showNotification('অনুগ্রহ করে সঠিক মোবাইল নম্বর লিখুন (যেমন: 017xxxxxxxx)', 'error');
      return;
    }

    // Check unique phone username requirement
    const uniqueCheck = authService.isPhoneUnique(cleanPhone, editingStaff?.id);
    if (!uniqueCheck.isUnique) {
      showNotification(
        uniqueCheck.message || `এই মোবাইল নম্বরটি (${cleanPhone}) ইতিমধ্যে অন্য একজন ব্যবহারকারীর ইউজারনেম হিসেবে নিবন্ধিত আছে।`,
        'error'
      );
      return;
    }

    const newStaff: UserProfile = {
      id: editingStaff ? editingStaff.id : `usr_staff_${Date.now()}`,
      username: cleanPhone,
      name: formName.trim(),
      phone: cleanPhone,
      email: formEmail.trim() || `${cleanPhone}@dokan.local`,
      role: formRole,
      tenantId: activeTenant.id,
      designation: formDesignation.trim(),
      status: formStatus,
      permissions: editingStaff ? editingStaff.permissions : RbacEngine.getRolePermissions(formRole),
      avatarUrl: editingStaff?.avatarUrl || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150&auto=format&fit=crop&q=80`,
      lastLogin: editingStaff?.lastLogin
    };

    authService.saveStaffMember(newStaff);
    loadStaff();
    setIsStaffModalOpen(false);
    showNotification(editingStaff ? 'কর্মচারীর তথ্য সফলভাবে আপডেট হয়েছে!' : 'নতুন কর্মচারী সফলভাবে যুক্ত করা হয়েছে!');
  };

  const confirmDeleteStaff = (staff: UserProfile) => {
    authService.deleteStaffMember(activeTenant.id, staff.id);
    loadStaff();
    showNotification(`কর্মচারী "${staff.name}" সফলভাবে মুছে ফেলা হয়েছে`);
  };

  const handleDeleteStaff = (staff: UserProfile) => {
    if (staff.role === 'ADMIN') {
      showNotification('দোকান মালিকের মূল অ্যাকাউন্ট মুছে ফেলা যাবে না', 'error');
      return;
    }

    if (storageService.isPinRequired('delete', activeTenant.id)) {
      setPinModalConfig({
        isOpen: true,
        actionType: 'delete',
        title: 'কর্মী মুছে ফেলতে সিকিউরিটি পিন',
        subtitle: `কর্মী "${staff.name}" (${staff.phone}) মুছে ফেলার জন্য পিন প্রদান করুন`,
        itemName: staff.name,
        onSuccess: () => confirmDeleteStaff(staff)
      });
    } else {
      if (window.confirm(`আপনি কি "${staff.name}" কে কর্মচারী তালিকা থেকে মুছে ফেলতে চান?`)) {
        confirmDeleteStaff(staff);
      }
    }
  };

  const handleOpenPermissionsModal = (staff: UserProfile) => {
    setPermTargetStaff(staff);
    setSelectedPerms(staff.permissions && staff.permissions.length > 0 ? [...staff.permissions] : RbacEngine.getRolePermissions(staff.role));
    setIsPermModalOpen(true);
  };

  const handleTogglePermission = (permCode: string) => {
    if (selectedPerms.includes(permCode)) {
      setSelectedPerms(selectedPerms.filter(p => p !== permCode));
    } else {
      setSelectedPerms([...selectedPerms, permCode]);
    }
  };

  const handleResetToRoleDefault = () => {
    if (permTargetStaff) {
      const defaultPerms = RbacEngine.getRolePermissions(permTargetStaff.role);
      setSelectedPerms(defaultPerms);
      showNotification(`"${permTargetStaff.role}" রোলের ডিফল্ট পারমিশন সেট করা হয়েছে`);
    }
  };

  const handleSavePermissions = () => {
    if (!permTargetStaff) return;
    authService.updateStaffPermissions(activeTenant.id, permTargetStaff.id, selectedPerms);
    loadStaff();
    setIsPermModalOpen(false);
    showNotification(`"${permTargetStaff.name}" এর জন্য ${selectedPerms.length} টি পারমিশন সফলভাবে সংরক্ষণ করা হয়েছে!`);
  };

  // Filter available permissions for store staff (exclude platform super admin matrix)
  const availablePermissions = ALL_PERMISSIONS.filter(p => p.code !== 'system.super_admin_matrix' && p.code !== 'system.category_studio');

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.phone.includes(searchTerm) ||
                          s.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const rolesList: { role: UserRole; label: string }[] = [
    { role: 'MANAGER', label: 'স্টোর ম্যানেজার' },
    { role: 'CASHIER', label: 'POS ক্যাশিয়ার' },
    { role: 'TECHNICIAN', label: 'টেকনিশিয়ান' },
    { role: 'LIBRARIAN', label: 'বই ও স্টেশনারি ইনচার্জ' },
    { role: 'ADMIN', label: 'সহকারী দোকান মালিক' }
  ];

  return (
    <div className="space-y-5 select-none pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{activeTenant.name} • কর্মচারী প্রশাসন</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">কর্মচারী ব্যবস্থাপনা ও পারমিশন কন্ট্রোল</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকান মালিক হিসেবে আপনার দোকানের কর্মচারীদের রোল নির্ধারণ এবং প্রয়োজন অনুযায়ী পারমিশন কাস্টমাইজ করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন কর্মচারী যুক্ত করুন</span>
        </button>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
          notification.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="কর্মচারীর নাম, পদবী বা মোবাইল দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">রোল ফিল্টার:</span>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">সকল রোল ({staffList.length})</option>
            <option value="MANAGER">স্টোর ম্যানেজার</option>
            <option value="CASHIER">POS ক্যাশিয়ার</option>
            <option value="TECHNICIAN">টেকনিশিয়ান</option>
            <option value="LIBRARIAN">বই ও স্টেশনারি ইনচার্জ</option>
            <option value="ADMIN">দোকান মালিক</option>
          </select>
        </div>
      </div>

      {/* Staff Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              দোকানের রেজিস্টার্ড কর্মচারী তালিকা ({filteredStaff.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            দোকান: <b>{activeTenant.name}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">কর্মচারীর তথ্য</th>
                <th className="py-3 px-4">যোগাযোগ</th>
                <th className="py-3 px-4">অ্যাসাইনকৃত রোল</th>
                <th className="py-3 px-4">অনুমোদিত পারমিশন</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    কোন কর্মচারী পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredStaff.map(staff => {
                  const permCount = staff.permissions ? staff.permissions.length : RbacEngine.getRolePermissions(staff.role).length;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 shadow-xs">
                            {staff.avatarUrl ? (
                              <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                              staff.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{staff.name}</div>
                            <div className="text-[11px] text-slate-500">{staff.designation}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{staff.phone}</span>
                        </div>
                        {staff.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] truncate max-w-[150px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{staff.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          {staff.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenPermissionsModal(staff)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer text-[11px]"
                          title="পারমিশন পরিবর্তন করুন"
                        >
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>{permCount} টি পারমিশন</span>
                          <span className="text-[9px] text-blue-600 font-bold ml-1">কাস্টমাইজ ✎</span>
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        {staff.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            সক্রিয়
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            নিষ্ক্রিয়
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(staff)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="তথ্য এডিট করুন"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {staff.role !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="কর্মচারী মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================== */}
      {/* MODAL 1: ADD / EDIT STAFF MODAL */}
      {/* ================================================== */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-sm">
                  {editingStaff ? 'কর্মচারীর তথ্য সংশোধন করুন' : 'নতুন কর্মচারী যুক্ত করুন'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণ নাম *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="যেমন: মো: তানভীর আহমেদ"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর (ইউজার আইডি) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="staff@dokan.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">কর্মচারীর ভূমিকা (Role) *</label>
                  <select
                    value={formRole}
                    onChange={e => {
                      const newR = e.target.value as UserRole;
                      setFormRole(newR);
                      if (newR === 'MANAGER') setFormDesignation('স্টোর ম্যানেজার');
                      else if (newR === 'CASHIER') setFormDesignation('POS ক্যাশ কাউন্টার অপারেটর');
                      else if (newR === 'TECHNICIAN') setFormDesignation('সার্ভিসিং ও রিপেয়ার টেকনিশিয়ান');
                      else if (newR === 'LIBRARIAN') setFormDesignation('বই-খাতা ও স্টেশনারি ইনচার্জ');
                      else setFormDesignation('সহকারী দোকান মালিক');
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {rolesList.map(r => (
                      <option key={r.role} value={r.role}>
                        {r.label} ({r.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পদবী / পদমর্যাদা *</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={e => setFormDesignation(e.target.value)}
                    placeholder="যেমন: সিনিয়র ক্যাশিয়ার"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingStaff ? 'পাসওয়ার্ড রিসেট (পরিবর্তন না করতে চাইলে ফাঁকা রাখুন)' : 'লগইন পাসওয়ার্ড *'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">অ্যাকাউন্ট স্ট্যাটাস</label>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formStatus === 'active'}
                      onChange={() => setFormStatus('active')}
                      className="text-blue-600"
                    />
                    <span>সক্রিয় (Active)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formStatus === 'inactive'}
                      onChange={() => setFormStatus('inactive')}
                      className="text-blue-600"
                    />
                    <span>নিষ্ক্রিয় (Inactive)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingStaff ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL 2: CUSTOM PERMISSIONS CONFIGURATOR MODAL */}
      {/* ================================================== */}
      {isPermModalOpen && permTargetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {permTargetStaff.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {permTargetStaff.name} — পারমিশন কনফিগারেশন
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    রোল: <b className="text-blue-300 font-mono">{permTargetStaff.role}</b> • পদবী: {permTargetStaff.designation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPermModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  নির্বাচিত পারমিশন: <b className="text-blue-600">{selectedPerms.length}</b> / {availablePermissions.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToRoleDefault}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>রোল ডিফল্ট রিসেট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms(availablePermissions.map(p => p.code))}
                  className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                >
                  সব দিন
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms([])}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                >
                  সব মুছুন
                </button>
              </div>
            </div>

            {/* Permission Checkbox List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availablePermissions.map(p => {
                  const isChecked = selectedPerms.includes(p.code);

                  return (
                    <label
                      key={p.code}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 opacity-80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(p.code)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <span>{p.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                            {p.module}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
                          {p.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                পারমিশন সংরক্ষণ করলে কর্মচারী পরবর্তী লগইন বা অ্যাকশনে তাৎক্ষণিক নতুন অনুমতি পাবে।
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPermModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>পারমিশন সংরক্ষণ করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security PIN Verification Modal */}
      <PinVerificationModal
        isOpen={pinModalConfig.isOpen}
        onClose={() => setPinModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSuccess={pinModalConfig.onSuccess}
        actionType={pinModalConfig.actionType}
        title={pinModalConfig.title}
        subtitle={pinModalConfig.subtitle}
        itemName={pinModalConfig.itemName}
        tenantId={activeTenant.id}
      />
    </div>
  );
};
