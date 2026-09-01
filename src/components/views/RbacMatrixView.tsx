import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Lock, 
  SlidersHorizontal,
  Info,
  Layers,
  Search,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, RbacEngine } from '../../engine/rbacEngine';

interface RbacMatrixViewProps {
  activeRole: UserRole;
}

export const RbacMatrixView: React.FC<RbacMatrixViewProps> = ({ activeRole }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const roles: { role: UserRole; label: string; desc: string; color: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Md. Yusuf Ali (System Admin)', desc: 'প্ল্যাটফর্ম ওয়ানার ও গ্লোবাল সিস্টেম এডমিন (ID: bdyusuf2016)', color: 'border-purple-500 bg-purple-50 text-purple-800' },
    { role: 'ADMIN', label: 'দোকান মালিক (Shop Owner)', desc: 'দোকানের অভ্যন্তরীণ সকল ক্রয়-বিক্রয়, লেজার, রিপোর্ট ও সেটিংস', color: 'border-blue-500 bg-blue-50 text-blue-800' },
    { role: 'MANAGER', label: 'স্টোর ম্যানেজার', desc: 'ক্যাটালগ, ইনভেন্টরি, রিপোর্ট ও কাস্টমার লেজার', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
    { role: 'CASHIER', label: 'POS ক্যাশিয়ার', desc: 'কুইক সেলস বিলিং, কালেকশন ও দৈনিক বিক্রয়', color: 'border-amber-500 bg-amber-50 text-amber-800' },
    { role: 'TECHNICIAN', label: 'টেকনিশিয়ান', desc: 'মোবাইল মেরামত সার্ভিস টিকেট ও IMEI স্টক চেক', color: 'border-orange-500 bg-orange-50 text-orange-800' },
    { role: 'LIBRARIAN', label: 'বই ও স্টেশনারি ইনচার্জ', desc: 'বই-খাতা ক্যাটালগ, প্রকাশনী ও স্টেশনারি বিক্রয় ডেস্ক', color: 'border-indigo-500 bg-indigo-50 text-indigo-800' },
  ];

  const categories = [
    { id: 'ALL', label: 'সকল ক্যাটাগরি' },
    { id: 'CORE', label: 'ড্যাশবোর্ড ও কোর' },
    { id: 'SALES', label: 'সেলস ও POS' },
    { id: 'INVENTORY', label: 'প্রোডাক্ট ও স্টক' },
    { id: 'TELECOM', label: 'টেলিকম ও সার্ভিস' },
    { id: 'GROCERY', label: 'গ্রোসারি কন্ট্রোল' },
    { id: 'STATIONERY', label: 'বই-খাতা, ফটোকপি ও অনলাইন' },
    { id: 'FINANCE', label: 'হিসাব ও ক্যাশ লেজার' },
    { id: 'SYSTEM', label: 'সিস্টেম ও অডিট' },
  ];

  const filteredPermissions = ALL_PERMISSIONS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Security & RBAC Matrix</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">রোল ও পারমিশন কন্ট্রোল ম্যাট্রিক্স</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            প্রতিটি ইউজারের রোল অনুযায়ী কোন কোন মডিউল এবং ফিচার এক্সেস করতে পারবে তা নির্ধারণ করা হয়েছে।
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-slate-700">মোট পারমিশন: <b>{ALL_PERMISSIONS.length} টি</b></span>
        </div>
      </div>

      {/* Role Cards Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roles.map(r => {
          const isSelected = selectedRole === r.role;
          const permCount = r.role === 'SUPER_ADMIN' ? ALL_PERMISSIONS.length : ROLE_PERMISSIONS[r.role].length;

          return (
            <button
              key={r.role}
              type="button"
              onClick={() => setSelectedRole(r.role)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-800">{r.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.color}`}>
                    {r.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{r.desc}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500">অনুমোদিত পারমিশন:</span>
                <span className="font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  {permCount} / {ALL_PERMISSIONS.length}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="পারমিশন বা মডিউল খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCategory(c.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterCategory === c.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-800">
              {roles.find(r => r.role === selectedRole)?.label} — পারমিশন তালিকা ({filteredPermissions.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {selectedRole === 'SUPER_ADMIN' ? 'সিস্টেম অ্যাডমিনের জন্য সকল পারমিশন স্বয়ংক্রিয়ভাবে সক্রিয়' : 'কনফিগারকৃত ভূমিকা'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">মডিউল ও কোড</th>
                <th className="py-3 px-4">পারমিশনের নাম</th>
                <th className="py-3 px-4">কার্যপরিধি / বিবরণ</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস ({selectedRole})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermissions.map(p => {
                const isAllowed = RbacEngine.hasPermission(selectedRole, p.code);

                return (
                  <tr key={p.code} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {p.code}
                      </span>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                        {p.module}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md">
                      {p.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isAllowed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          অনুমোদিত
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 opacity-70">
                          <X className="w-3 h-3" />
                          অনুপস্থিত
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
