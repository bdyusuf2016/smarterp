import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  Award, 
  DollarSign, 
  Clock,
  BookOpen,
  Printer,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Tenant, UserRole, CustomerMember } from '../../types';
import { storageService } from '../../services/storageService';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { printLedgerStatement } from '../../shared/utils/printReceipt';

interface CustomersViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ activeTenant }) => {
  const [customers, setCustomers] = useState<CustomerMember[]>(() => storageService.getCustomers(activeTenant.id));
  const sales = storageService.getSales(activeTenant.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState<Partial<CustomerMember>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    membership_card_no: `MEM-${Date.now().toString().slice(-4)}`,
    customer_type: 'individual',
    loyalty_points: 0,
    current_due: 0
  });

  const reloadCustomers = () => {
    setCustomers(storageService.getCustomers(activeTenant.id));
  };

  useEffect(() => {
    reloadCustomers();
  }, [activeTenant.id]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.membership_card_no && c.membership_card_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;

    const customerToSave: CustomerMember = {
      id: `cust_${Date.now()}`,
      tenant_id: activeTenant.id,
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      email: newCustomer.email?.trim() || '',
      address: newCustomer.address?.trim() || '',
      membership_card_no: newCustomer.membership_card_no?.trim() || `MEM-${Date.now().toString().slice(-4)}`,
      customer_type: newCustomer.customer_type || 'individual',
      total_spent: 0,
      loyalty_points: Number(newCustomer.loyalty_points) || 0,
      current_due: Number(newCustomer.current_due) || 0,
      created_at: new Date().toISOString()
    };

    storageService.saveCustomer(customerToSave);
    reloadCustomers();
    setIsAddCustomerOpen(false);
    showToast(`কাস্টমার "${customerToSave.name}" সফলভাবে যুক্ত হয়েছে!`);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      membership_card_no: `MEM-${Date.now().toString().slice(-4)}`,
      customer_type: 'individual',
      loyalty_points: 0,
      current_due: 0
    });
  };

  const handleDeleteCustomer = (customer: CustomerMember) => {
    if (confirm(`আপনি কি নিশ্চিতভাবে "${customer.name}" কাস্টমারটি মুছে ফেলতে চান?`)) {
      storageService.deleteCustomer(customer.id);
      reloadCustomers();
      showToast(`কাস্টমার "${customer.name}" মুছে ফেলা হয়েছে।`);
    }
  };

  const handleClearAllCustomers = () => {
    if (confirm('⚠️ আপনি কি এই দোকানের সকল ডেমো কাস্টমার মুছে প্রোডাকশন লেভেলের জন্য ফ্রেশ করতে চান?')) {
      storageService.clearCustomers(activeTenant.id);
      reloadCustomers();
      showToast('সকল ডেমো কাস্টমার সফলভাবে মুছে ফেলা হয়েছে! এখন আপনি রিয়েল কাস্টমার এন্ট্রি করতে পারবেন।');
    }
  };

  const handlePrintCustomerStatement = (customer: CustomerMember) => {
    const customerSales = sales.filter(s => s.customer_id === customer.id || s.customer_name === customer.name);
    const totalDebits = customerSales.reduce((sum, s) => sum + s.grand_total, 0);
    const totalCredits = customerSales.reduce((sum, s) => sum + s.paid_amount, 0);

    printLedgerStatement({
      shopName: activeTenant.name || 'SmartERP',
      shopPhone: '01700-000000',
      partyType: 'CUSTOMER',
      partyName: customer.name,
      partyPhone: customer.phone,
      partyAddress: customer.address,
      partyId: customer.membership_card_no,
      totalDebits: totalDebits > 0 ? totalDebits : customer.current_due,
      totalCredits: totalCredits,
      netBalance: customer.current_due,
      transactions: customerSales.map(s => ({
        date: new Date(s.created_at).toLocaleDateString('en-GB'),
        type: 'SALE INVOICE',
        ref: s.invoice_no,
        debit: s.grand_total,
        credit: s.paid_amount,
        balance: s.due_amount,
      })),
    });
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>কাস্টমার ও বাকির খাতা (Customer CRM & Ledger)</span>
          </h1>
          <p className="text-xs text-slate-500">
            খুচরা ও পাইকারি কাস্টমার, বাকি হিসাব ও মেম্বারশিপ লেজার ব্যবস্থাপনা
          </p>
        </div>

        <div className="flex items-center gap-2">
          {customers.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllCustomers}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-rose-200 cursor-pointer transition-all"
              title="প্রোডাকশনের জন্য সকল ডেমো কাস্টমার ক্লিয়ার করুন"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>ডেমো কাস্টমার মুছুন</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ নতুন কাস্টমার যোগ</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="কাস্টমারের নাম, ফোন নম্বর অথবা মেম্বারশিপ আইডি দিয়ে খুঁজুন..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">কোনো কাস্টমার নেই (কাস্টমার খাতা সম্পূর্ণ পরিষ্কার)</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                আপনার প্রোডাকশন স্টোরে আসল কাস্টমার যুক্ত করতে নিচের বাটনে চাপুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ প্রথম কাস্টমার যুক্ত করুন</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">কাস্টমারের নাম / আইডি</th>
                <th className="py-3 px-4">যোগাযোগ নম্বর</th>
                <th className="py-3 px-4">ঠিকানা</th>
                <th className="py-3 px-4 font-mono">লয়্যালটি পয়েন্ট</th>
                <th className="py-3 px-4 font-mono">বর্তমান বকেয়া / বাকি</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{cust.name}</div>
                    {cust.membership_card_no && (
                      <span className="font-mono text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                        ID: {cust.membership_card_no}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-800 font-semibold">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                    {cust.email && (
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{cust.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{cust.address || '—'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{cust.loyalty_points} pts</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {cust.current_due > 0 ? (
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ৳{cust.current_due.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        ৳০.০০ (পরিশোধিত)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePrintCustomerStatement(cust)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="কাস্টমার স্টেটমেন্ট প্রিন্ট (A4)"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>স্টেটমেন্ট</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(cust)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="কাস্টমার মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: New Customer */}
      <Modal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        title="Add Customer / Member Account"
        subtitle="Universal CRM profile registration"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newCustomer.name || ''}
                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={newCustomer.phone || ''}
                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newCustomer.email || ''}
                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Membership ID / Card</label>
              <input
                type="text"
                value={newCustomer.membership_card_no || ''}
                onChange={e => setNewCustomer({ ...newCustomer, membership_card_no: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Postal Address</label>
            <input
              type="text"
              value={newCustomer.address || ''}
              onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Category</label>
              <select
                value={newCustomer.customer_type || 'individual'}
                onChange={e => setNewCustomer({ ...newCustomer, customer_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="individual">Retail Customer</option>
                <option value="corporate">Corporate / Wholesale Client</option>
                <option value="library_member">Library Student / Member</option>
                <option value="vip">VIP Cardholder</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Opening Due (৳)</label>
              <input
                type="number"
                value={newCustomer.current_due || 0}
                onChange={e => setNewCustomer({ ...newCustomer, current_due: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs mt-2 cursor-pointer"
          >
            Create Customer Account
          </button>
        </form>
      </Modal>
    </div>
  );
};
