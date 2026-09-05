import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wrench, 
  RefreshCw, 
  Zap, 
  Plus, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Tag,
  Printer,
  Trash2,
  Phone,
  User,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  Sparkles,
  Check,
  FileText
} from 'lucide-react';
import { 
  Tenant, 
  UserRole, 
  DeviceItem, 
  RepairTicket, 
  TradeInRecord, 
  RechargeRecord,
  GenericProduct
} from '../../types';
import { storageService } from '../../services/storageService';
import { Modal } from '../common/Modal';
import { printRepairToken } from '../../shared/utils/printReceipt';
import { useConfirm } from '../../context/ConfirmationContext';

interface TelecomModulesViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  activeTab?: 'imei' | 'repairs' | 'trade_in' | 'recharge';
}

export const TelecomModulesView: React.FC<TelecomModulesViewProps> = ({
  activeTenant,
  activeTab: initialTab = 'repairs'
}) => {
  const { confirm } = useConfirm();
  const [tab, setTab] = useState<'imei' | 'repairs' | 'trade_in' | 'recharge'>(initialTab);

  // Sync tab with initialTab prop when navigated from sidebar
  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const [products, setProducts] = useState<GenericProduct[]>(() => storageService.getProducts(activeTenant.id));
  const [devices, setDevices] = useState<DeviceItem[]>(() => storageService.getDevices());
  const [repairs, setRepairs] = useState<RepairTicket[]>(() => storageService.getRepairs(activeTenant.id));
  const [tradeIns, setTradeIns] = useState<TradeInRecord[]>(() => storageService.getTradeIns(activeTenant.id));
  const [recharges, setRecharges] = useState<RechargeRecord[]>(() => storageService.getRecharges(activeTenant.id));
  const [customers, setCustomers] = useState(() => storageService.getCustomers(activeTenant.id));

  const reloadData = () => {
    setProducts(storageService.getProducts(activeTenant.id));
    setDevices(storageService.getDevices());
    setRepairs(storageService.getRepairs(activeTenant.id));
    setTradeIns(storageService.getTradeIns(activeTenant.id));
    setRecharges(storageService.getRecharges(activeTenant.id));
    setCustomers(storageService.getCustomers(activeTenant.id));
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [repairStatusFilter, setRepairStatusFilter] = useState<string>('all');
  const [rechargeOperatorFilter, setRechargeOperatorFilter] = useState<string>('all');

  // IMEI Modal
  const [isAddImeiOpen, setIsAddImeiOpen] = useState(false);
  const [newImeiData, setNewImeiData] = useState<Partial<DeviceItem>>({
    imei: '',
    serial_number: '',
    model: '',
    color: 'Black',
    storage: '128GB',
    battery_health: 100,
    status: 'available',
    warranty_months: 12,
    cost_price: 15000,
    selling_price: 18500
  });

  // Repair Modal
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [repairData, setRepairData] = useState<Partial<RepairTicket>>({
    customer_name: '',
    customer_phone: '',
    device_name: '',
    imei_or_serial: '',
    problem_description: '',
    technician_name: 'প্রধান টেকনিশিয়ান',
    estimated_cost: 500,
    status: 'received',
    warranty_period_days: 30
  });

  // Recharge / MFS Modal
  const [isNewRechargeOpen, setIsNewRechargeOpen] = useState(false);
  const [rechargeData, setRechargeData] = useState<{
    operator: string;
    recharge_type: 'Airtime Topup' | 'Data Bundle' | 'Postpaid Bill' | 'Utility';
    phone_number: string;
    amount: number;
    commission_rate: number;
    transaction_ref: string;
  }>({
    operator: 'Grameenphone',
    recharge_type: 'Airtime Topup',
    phone_number: '',
    amount: 100,
    commission_rate: 0.027, // 2.7%
    transaction_ref: ''
  });

  // Trade-In Modal
  const [isNewTradeInOpen, setIsNewTradeInOpen] = useState(false);
  const [tradeInData, setTradeInData] = useState<Partial<TradeInRecord>>({
    customer_name: '',
    customer_phone: '',
    device_model: '',
    imei: '',
    condition_grade: 'B - Good',
    evaluated_value: 8000,
    offered_credit: 7500,
    notes: 'ডিসপ্লে ও ব্যাটারি চেক করা হয়েছে। কন্ডিশন ভালো।'
  });

  // Handlers: IMEI
  const handleCreateImei = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImeiData.imei?.trim()) return;

    let targetProductId = newImeiData.product_id;
    const modelName = newImeiData.model?.trim() || 'Smart Handset';

    // If product doesn't exist in catalog yet, auto-create master product!
    if (!targetProductId) {
      const existing = products.find(p => p.name.toLowerCase() === modelName.toLowerCase());
      if (existing) {
        targetProductId = existing.id;
      } else {
        const newProd: GenericProduct = {
          id: `prod_tel_${Date.now()}`,
          tenant_id: activeTenant.id,
          name: modelName,
          code: `TEL-${Date.now().toString().slice(-4)}`,
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          barcode: `20${Date.now().toString().slice(-10)}`,
          business_category_id: 'cat_telecom',
          category_name: 'মোবাইল ও স্মার্টফোন',
          unit: 'পিস',
          purchase_price: Number(newImeiData.cost_price) || 0,
          selling_price: Number(newImeiData.selling_price) || 0,
          stock_quantity: 1,
          min_stock_alert: 2,
          tracking_mode: 'TRACKING_IMEI',
          is_active: true,
          created_at: new Date().toISOString()
        };
        storageService.saveProduct(newProd);
        targetProductId = newProd.id;
      }
    }

    const device: DeviceItem = {
      id: `dev_${Date.now()}`,
      product_id: targetProductId,
      imei: newImeiData.imei.trim(),
      serial_number: newImeiData.serial_number?.trim(),
      model: modelName,
      color: newImeiData.color || 'Black',
      storage: newImeiData.storage || '128GB',
      battery_health: Number(newImeiData.battery_health) || 100,
      status: 'available',
      warranty_months: Number(newImeiData.warranty_months) || 12,
      cost_price: Number(newImeiData.cost_price) || 0,
      selling_price: Number(newImeiData.selling_price) || 0
    };

    storageService.saveDevice(device);
    reloadData();
    setIsAddImeiOpen(false);
    setNewImeiData({
      imei: '',
      serial_number: '',
      model: '',
      color: 'Black',
      storage: '128GB',
      battery_health: 100,
      status: 'available',
      warranty_months: 12,
      cost_price: 15000,
      selling_price: 18500
    });
  };

  // Handlers: Repair Ticket
  const handleCreateRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairData.customer_name?.trim() || !repairData.device_name?.trim()) return;
    
    const ticket: RepairTicket = {
      id: `rep_${Date.now()}`,
      ticket_number: `SRV-${Date.now().toString().slice(-5)}`,
      tenant_id: activeTenant.id,
      customer_id: customers.find(c => c.name.toLowerCase() === repairData.customer_name?.toLowerCase())?.id || `cust_${Date.now()}`,
      customer_name: repairData.customer_name.trim(),
      customer_phone: repairData.customer_phone?.trim() || '',
      device_name: repairData.device_name.trim(),
      imei_or_serial: repairData.imei_or_serial?.trim(),
      problem_description: repairData.problem_description?.trim() || 'সাধারণ সার্ভিসিং',
      technician_name: repairData.technician_name?.trim() || 'স্টাফ',
      estimated_cost: Number(repairData.estimated_cost) || 0,
      status: 'received',
      warranty_period_days: Number(repairData.warranty_period_days) || 30,
      created_at: new Date().toISOString()
    };
    
    storageService.saveRepair(ticket);
    reloadData();
    setIsNewRepairOpen(false);
    setRepairData({
      customer_name: '',
      customer_phone: '',
      device_name: '',
      imei_or_serial: '',
      problem_description: '',
      technician_name: 'প্রধান টেকনিশিয়ান',
      estimated_cost: 500,
      status: 'received',
      warranty_period_days: 30
    });
  };

  const handleUpdateRepairStatus = (ticket: RepairTicket, nextStatus: RepairTicket['status']) => {
    const updated: RepairTicket = {
      ...ticket,
      status: nextStatus
    };
    if (nextStatus === 'completed' || nextStatus === 'delivered') {
      updated.completed_at = new Date().toISOString();
      updated.final_cost = ticket.estimated_cost;
    }
    storageService.saveRepair(updated);
    reloadData();
  };

  const handleDeleteRepair = async (id: string) => {
    const ticket = repairs.find(r => r.id === id);
    const ok = await confirm({
      title: 'সার্ভিসিং টিকেট মুছে ফেলতে চান?',
      message: 'আপনি কি নিশ্চিত যে এই সার্ভিসিং ও রিপেয়ার টিকেটটি মুছে ফেলতে চান?',
      itemName: ticket ? `${ticket.device_name} (${ticket.customer_name})` : undefined,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      cancelText: 'বাতিল',
      type: 'danger',
      icon: 'trash'
    });
    if (ok) {
      storageService.deleteRepair(id);
      reloadData();
    }
  };

  // Handlers: Recharge & MFS
  const handleCreateRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeData.phone_number?.trim() || !rechargeData.amount) return;

    const amount = Number(rechargeData.amount) || 0;
    const rate = Number(rechargeData.commission_rate) || 0;
    const commissionEarned = parseFloat(((amount * rate)).toFixed(2));
    const ref = rechargeData.transaction_ref?.trim() || `TRX-${Date.now().toString().slice(-6)}`;

    const newRecord: RechargeRecord = {
      id: `rec_${Date.now()}`,
      tenant_id: activeTenant.id,
      operator: rechargeData.operator,
      recharge_type: rechargeData.recharge_type,
      phone_number: rechargeData.phone_number.trim(),
      amount,
      commission_rate: rate,
      commission_earned: commissionEarned,
      transaction_ref: ref,
      created_at: new Date().toISOString()
    };

    storageService.saveRecharge(newRecord);
    reloadData();
    setIsNewRechargeOpen(false);
    setRechargeData({
      operator: 'Grameenphone',
      recharge_type: 'Airtime Topup',
      phone_number: '',
      amount: 100,
      commission_rate: 0.027,
      transaction_ref: ''
    });
  };

  const handleDeleteRecharge = async (id: string) => {
    const record = recharges.find(r => r.id === id);
    const ok = await confirm({
      title: 'রিচার্জ/MFS রেকর্ড মুছে ফেলতে চান?',
      message: 'আপনি কি নিশ্চিত যে এই রিচার্জ বা মোবাইল ব্যাংকিং লেনদেন রেকর্ডটি মুছে ফেলতে চান?',
      itemName: record ? `${record.operator}: ${record.phone_number} (৳${record.amount})` : undefined,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      cancelText: 'বাতিল',
      type: 'danger',
      icon: 'trash'
    });
    if (ok) {
      storageService.deleteRecharge(id);
      reloadData();
    }
  };

  // Handlers: Trade-In
  const handleCreateTradeIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeInData.device_model?.trim() || !tradeInData.imei?.trim()) return;
    const record: TradeInRecord = {
      id: `tr_${Date.now()}`,
      tenant_id: activeTenant.id,
      customer_id: customers.find(c => c.name === tradeInData.customer_name)?.id || `cust_${Date.now()}`,
      customer_name: tradeInData.customer_name || 'সাধারণ ক্রেতা',
      customer_phone: tradeInData.customer_phone || '',
      device_model: tradeInData.device_model.trim(),
      imei: tradeInData.imei.trim(),
      condition_grade: tradeInData.condition_grade || 'B - Good',
      evaluated_value: Number(tradeInData.evaluated_value) || 0,
      offered_credit: Number(tradeInData.offered_credit) || 0,
      status: 'accepted',
      notes: tradeInData.notes,
      created_at: new Date().toISOString()
    };
    storageService.saveTradeIn(record);
    reloadData();
    setIsNewTradeInOpen(false);
  };

  // Summary Metrics for Recharge
  const totalRechargeAmount = recharges.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalCommissionEarned = recharges.reduce((sum, r) => sum + (r.commission_earned || 0), 0);

  // Status Badge Colors for Repairs
  const getStatusBadge = (status: RepairTicket['status']) => {
    switch (status) {
      case 'received':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">📥 রিসিভড (Received)</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">⚙️ কাজ চলছে (In Progress)</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✓ সম্পন্ন (Ready)</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">🤝 ডেলিভারি সম্পন্ন</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">✕ বাতিল</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12 text-xs">
      {/* Module Title Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <span>টেলিকম, মোবাইল সার্ভিসিং ও রিচার্জ সেন্টার (Telecom Suite)</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            মোবাইল হ্যান্ডসেট IMEI ট্র্যাকিং, সার্ভিসিং টিকেট, ফ্লেক্সিলোড/MFS কমিশন ও এক্সচেঞ্জ খাতা
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('repairs')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
              tab === 'repairs' 
                ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>মোবাইল সার্ভিসিং ({repairs.length})</span>
          </button>
          
          <button
            type="button"
            onClick={() => setTab('recharge')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
              tab === 'recharge' 
                ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>রিচার্জ ও MFS ({recharges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('imei')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
              tab === 'imei' 
                ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>IMEI হ্যান্ডসেট স্টক ({devices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('trade_in')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
              tab === 'trade_in' 
                ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>পুরাতন এক্সচেঞ্জ ({tradeIns.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MOBILE REPAIRING & SERVICING TICKETS                               */}
      {/* ========================================================================= */}
      {tab === 'repairs' && (
        <div className="space-y-3.5">
          {/* Action Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="গ্রাহকের নাম, ফোন নম্বর, ডিভাইসের মডেল বা টিকেট নং দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <select
                value={repairStatusFilter}
                onChange={e => setRepairStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                <option value="all">সকল স্ট্যাটাস</option>
                <option value="received">রিসিভড (Received)</option>
                <option value="in_progress">কাজ চলছে (In Progress)</option>
                <option value="completed">সম্পন্ন (Ready)</option>
                <option value="delivered">ডেলিভারি সম্পন্ন</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsNewRepairOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন সার্ভিসিং টিকেট তৈরি</span>
            </button>
          </div>

          {/* Repairs List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">টিকেট নং</th>
                    <th className="py-3 px-3.5">গ্রাহকের নাম ও ফোন</th>
                    <th className="py-3 px-3.5">ডিভাইস মডেল ও IMEI</th>
                    <th className="py-3 px-3.5">সমস্যা / ত্রুটি বিবরণ</th>
                    <th className="py-3 px-3.5 text-right">আনুমানিক বিল</th>
                    <th className="py-3 px-3.5 text-center">বর্তমান অবস্থা</th>
                    <th className="py-3 px-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repairs
                    .filter(r => {
                      const matchSearch = 
                        r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.customer_phone?.includes(searchTerm) ||
                        r.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchStatus = repairStatusFilter === 'all' || r.status === repairStatusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map(ticket => (
                      <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-indigo-600">
                          {ticket.ticket_number}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">{ticket.customer_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{ticket.customer_phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-800">{ticket.device_name}</div>
                          {ticket.imei_or_serial && (
                            <div className="text-[10px] font-mono text-slate-500">
                              IMEI: {ticket.imei_or_serial}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate">
                          {ticket.problem_description}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                          ৳{ticket.estimated_cost}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Status Changer Actions */}
                            {ticket.status === 'received' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateRepairStatus(ticket, 'in_progress')}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold text-[11px] cursor-pointer"
                                title="কাজ শুরু করুন"
                              >
                                কাজ শুরু ➔
                              </button>
                            )}

                            {ticket.status === 'in_progress' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateRepairStatus(ticket, 'completed')}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-bold text-[11px] cursor-pointer"
                                title="সার্ভিসিং সম্পন্ন"
                              >
                                ✓ সম্পন্ন
                              </button>
                            )}

                            {ticket.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateRepairStatus(ticket, 'delivered')}
                                className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded font-bold text-[11px] cursor-pointer"
                                title="কাস্টমারকে বুঝিয়ে দিন"
                              >
                                🤝 ডেলিভারি
                              </button>
                            )}

                            {/* Print Token Receipt */}
                            <button
                              type="button"
                              onClick={() => printRepairToken({
                                shopName: activeTenant.name,
                                shopPhone: activeTenant.phone || '',
                                tokenNo: ticket.ticket_number,
                                customerName: ticket.customer_name,
                                customerPhone: ticket.customer_phone || '',
                                deviceModel: ticket.device_name,
                                imei: ticket.imei_or_serial,
                                problem: ticket.problem_description,
                                estimatedCost: ticket.estimated_cost,
                                advancePaid: 0,
                                date: ticket.created_at
                              })}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                              title="সার্ভিসিং টোকেন প্রিন্ট"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteRepair(ticket.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {repairs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        কোনো সক্রিয় মোবাইল সার্ভিসিং টিকেট নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MOBILE RECHARGE & MFS REGISTER                                     */}
      {/* ========================================================================= */}
      {tab === 'recharge' && (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-xs">
              <div className="flex items-center justify-between opacity-80 mb-1">
                <span className="text-[11px] font-semibold uppercase">মোট রিচার্জ / MFS লেনদেন</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold font-mono">৳{totalRechargeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] opacity-80 mt-1">ফ্লেক্সিলোড, বিকাশ, নগদ ও রকেট</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-xs">
              <div className="flex items-center justify-between opacity-80 mb-1">
                <span className="text-[11px] font-semibold uppercase">অর্জিত মোট কমিশন (Net Income)</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold font-mono">৳{totalCommissionEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] opacity-80 mt-1">অপারেটর ভিত্তিক লাভ</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-800 text-white rounded-xl shadow-xs">
              <div className="flex items-center justify-between opacity-80 mb-1">
                <span className="text-[11px] font-semibold uppercase">মোট সম্পন্ন লেনদেন</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold font-mono">{recharges.length} টি</div>
              <div className="text-[10px] opacity-80 mt-1">সফল ট্রানজেকশন কাউন্ট</div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর, অপারেটর বা TrxID দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <select
                value={rechargeOperatorFilter}
                onChange={e => setRechargeOperatorFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                <option value="all">সকল অপারেটর/MFS</option>
                <option value="Grameenphone">Grameenphone</option>
                <option value="Banglalink">Banglalink</option>
                <option value="Robi">Robi</option>
                <option value="Airtel">Airtel</option>
                <option value="Teletalk">Teletalk</option>
                <option value="bKash Cash In">bKash Cash In</option>
                <option value="bKash Cash Out">bKash Cash Out</option>
                <option value="Nagad Cash In">Nagad Cash In</option>
                <option value="Nagad Cash Out">Nagad Cash Out</option>
                <option value="Rocket">Rocket</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsNewRechargeOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন রিচার্জ / MFS লেনদেন</span>
            </button>
          </div>

          {/* Recharge Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">TrxID / রেফারেন্স</th>
                    <th className="py-3 px-3.5">অপারেটর / মাধ্যম</th>
                    <th className="py-3 px-3.5">গ্রাহকের মোবাইল নম্বর</th>
                    <th className="py-3 px-3.5">ধরন</th>
                    <th className="py-3 px-3.5 text-right">পরিমাণ (Amount)</th>
                    <th className="py-3 px-3.5 text-right">অর্জিত কমিশন</th>
                    <th className="py-3 px-3.5 text-right">তারিখ ও সময়</th>
                    <th className="py-3 px-3.5 text-center">মুছুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recharges
                    .filter(rec => {
                      const matchSearch = 
                        rec.phone_number?.includes(searchTerm) ||
                        rec.operator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        rec.transaction_ref?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchOperator = rechargeOperatorFilter === 'all' || rec.operator === rechargeOperatorFilter;
                      return matchSearch && matchOperator;
                    })
                    .map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-indigo-600">
                          {rec.transaction_ref}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{rec.operator}</span>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                          {rec.phone_number}
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 text-[11px]">
                          {rec.recharge_type}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                          ৳{rec.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600">
                          +৳{rec.commission_earned.toFixed(2)}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({(rec.commission_rate * 100).toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right text-[11px] text-slate-500">
                          {new Date(rec.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRecharge(rec.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                  {recharges.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        কোনো রিচার্জ বা MFS লেনদেনের রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMEI HARDWARE REGISTRY                                             */}
      {/* ========================================================================= */}
      {tab === 'imei' && (
        <div className="space-y-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="IMEI, মডেল বা সিরিয়াল নং দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddImeiOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন IMEI ডিভাইস এন্ট্রি</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">15-Digit IMEI</th>
                  <th className="py-3 px-3.5">হ্যান্ডসেট মডেল</th>
                  <th className="py-3 px-3.5">রং ও স্টোরেজ</th>
                  <th className="py-3 px-3.5">ওয়ারেন্টি</th>
                  <th className="py-3 px-3.5 text-right">বিক্রয় মূল্য</th>
                  <th className="py-3 px-3.5 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices
                  .filter(d => d.imei.includes(searchTerm) || d.model.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(dev => (
                    <tr key={dev.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 font-mono font-bold text-indigo-600">{dev.imei}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{dev.model}</td>
                      <td className="py-3 px-3.5 text-slate-600">{dev.color} • {dev.storage}</td>
                      <td className="py-3 px-3.5 text-slate-600">{dev.warranty_months} মাস</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">৳{dev.selling_price}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          dev.status === 'available' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {dev.status === 'available' ? 'স্টকে আছে' : 'বিক্রিত'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TRADE-IN USED DEVICE EXCHANGE                                      */}
      {/* ========================================================================= */}
      {tab === 'trade_in' && (
        <div className="space-y-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
            <span className="font-bold text-slate-900">পুরাতন ফোন এক্সচেঞ্জ ও বাইব্যাক খাতা</span>
            <button
              type="button"
              onClick={() => setIsNewTradeInOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ পুরাতন ডিভাইস মূল্যায়ন ও ক্রয়</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">ডিভাইস মডেল ও IMEI</th>
                  <th className="py-3 px-3.5">কাস্টমার</th>
                  <th className="py-3 px-3.5">কন্ডিশন গ্রেড</th>
                  <th className="py-3 px-3.5 text-right">মূল্যায়ন মূল্য</th>
                  <th className="py-3 px-3.5 text-right">প্রদত্ত ক্রেডিট/টাকা</th>
                  <th className="py-3 px-3.5">তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tradeIns.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3.5 font-bold text-slate-900">{tr.device_model} ({tr.imei})</td>
                    <td className="py-3 px-3.5 text-slate-700">{tr.customer_name} ({tr.customer_phone})</td>
                    <td className="py-3 px-3.5"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">{tr.condition_grade}</span></td>
                    <td className="py-3 px-3.5 text-right font-mono">৳{tr.evaluated_value}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600">৳{tr.offered_credit}</td>
                    <td className="py-3 px-3.5 text-slate-500 text-[11px]">{new Date(tr.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW REPAIR SERVICE TICKET                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewRepairOpen}
        onClose={() => setIsNewRepairOpen(false)}
        title="নতুন মোবাইল সার্ভিসিং টিকেট তৈরি"
        subtitle="গ্রাহকের হ্যান্ডসেট গ্রহণ, সমস্যা লিপিবদ্ধ ও টোকেন প্রদান"
      >
        <form onSubmit={handleCreateRepair} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">গ্রাহকের নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: মোঃ করিম"
                value={repairData.customer_name || ''}
                onChange={e => setRepairData({ ...repairData, customer_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
              <input
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={repairData.customer_phone || ''}
                onChange={e => setRepairData({ ...repairData, customer_phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ডিভাইস মডেল *</label>
              <input
                type="text"
                required
                placeholder="যেমন: Samsung Galaxy A52 / Redmi Note 11"
                value={repairData.device_name || ''}
                onChange={e => setRepairData({ ...repairData, device_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IMEI / সিরিয়াল নম্বর</label>
              <input
                type="text"
                placeholder="354891098..."
                value={repairData.imei_or_serial || ''}
                onChange={e => setRepairData({ ...repairData, imei_or_serial: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">সমস্যা / ত্রুটির বিবরণ *</label>
            <textarea
              rows={2}
              required
              placeholder="যেমন: ডিসপ্লে ভাঙা, চার্জিং পোর্ট লুজ, পানি ঢুকেছে..."
              value={repairData.problem_description || ''}
              onChange={e => setRepairData({ ...repairData, problem_description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">দায়িত্বপ্রাপ্ত টেকনিশিয়ান</label>
              <input
                type="text"
                value={repairData.technician_name || ''}
                onChange={e => setRepairData({ ...repairData, technician_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">আনুমানিক বিল (৳)</label>
              <input
                type="number"
                value={repairData.estimated_cost}
                onChange={e => setRepairData({ ...repairData, estimated_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ওয়ারেন্টি (দিন)</label>
              <input
                type="number"
                value={repairData.warranty_period_days}
                onChange={e => setRepairData({ ...repairData, warranty_period_days: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewRepairOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>সার্ভিসিং টিকেট তৈরি করুন</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NEW RECHARGE / MFS TRANSACTION                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewRechargeOpen}
        onClose={() => setIsNewRechargeOpen(false)}
        title="নতুন মোবাইল রিচার্জ / MFS লেনদেন এন্ট্রি"
        subtitle="ফ্লেক্সিলোড, বিকাশ, নগদ বা রকেট ক্যাশ লেনদেন রেকর্ড ও কমিশন হিসাব"
      >
        <form onSubmit={handleCreateRecharge} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">অপারেটর / MFS মাধ্যম *</label>
              <select
                value={rechargeData.operator}
                onChange={e => {
                  const op = e.target.value;
                  let rate = 0.027; // Default 2.7%
                  if (op.includes('bKash') || op.includes('Nagad') || op.includes('Rocket')) {
                    rate = 0.004; // 0.4% agent commission
                  }
                  setRechargeData({ ...rechargeData, operator: op, commission_rate: rate });
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                <option value="Grameenphone">Grameenphone (GP)</option>
                <option value="Banglalink">Banglalink (BL)</option>
                <option value="Robi">Robi</option>
                <option value="Airtel">Airtel</option>
                <option value="Teletalk">Teletalk</option>
                <option value="bKash Cash In">bKash Cash In</option>
                <option value="bKash Cash Out">bKash Cash Out</option>
                <option value="bKash Send Money">bKash Send Money</option>
                <option value="Nagad Cash In">Nagad Cash In</option>
                <option value="Nagad Cash Out">Nagad Cash Out</option>
                <option value="Rocket">Rocket DBBL</option>
                <option value="Upay">Upay</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">লেনদেনের ধরন *</label>
              <select
                value={rechargeData.recharge_type}
                onChange={e => setRechargeData({ ...rechargeData, recharge_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Airtime Topup">ফ্লেক্সিলোড / টপ-আপ (Airtime)</option>
                <option value="Data Bundle">ডাটা / মিনিট বান্ডেল (Bundle)</option>
                <option value="Postpaid Bill">পোস্টপেইড বিল / বিল পে</option>
                <option value="Utility">MFS ক্যাশ ইন / ক্যাশ আউট</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">গ্রাহকের মোবাইল নম্বর *</label>
              <input
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={rechargeData.phone_number}
                onChange={e => setRechargeData({ ...rechargeData, phone_number: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
              <input
                type="number"
                required
                min="10"
                placeholder="100"
                value={rechargeData.amount}
                onChange={e => setRechargeData({ ...rechargeData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">কমিশন হার (%)</label>
              <input
                type="number"
                step="0.001"
                value={(rechargeData.commission_rate * 100).toFixed(2)}
                onChange={e => setRechargeData({ ...rechargeData, commission_rate: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">স্বয়ংক্রিয় অর্জিত কমিশন (৳)</label>
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg font-mono font-bold text-emerald-800">
                +৳{((rechargeData.amount || 0) * (rechargeData.commission_rate || 0)).toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">TrxID / রেফারেন্স কোড (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="যেমন: BL-89418293 / bKash TrxID"
              value={rechargeData.transaction_ref}
              onChange={e => setRechargeData({ ...rechargeData, transaction_ref: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewRechargeOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>লেনদেন নিশ্চিত করুন</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: REGISTER IMEI DEVICE                                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddImeiOpen}
        onClose={() => setIsAddImeiOpen(false)}
        title="নতুন হ্যান্ডসেট IMEI রেজিস্ট্রেশন"
        subtitle="মোবাইল ফোন ইউনিক ১৫-ডিজিট IMEI ট্র্যাকিং ও ক্যাটালগ লিঙ্ক"
      >
        <form onSubmit={handleCreateImei} className="space-y-3.5 text-xs">
          {/* Master Product / Category Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              মাস্টার প্রোডাক্ট নির্বাচন বা তৈরি * (Select Master Model)
            </label>
            <select
              value={newImeiData.product_id || ''}
              onChange={e => {
                const selectedVal = e.target.value;
                const prod = products.find(p => p.id === selectedVal);
                if (prod) {
                  setNewImeiData({
                    ...newImeiData,
                    product_id: prod.id,
                    model: prod.name,
                    cost_price: prod.purchase_price || 0,
                    selling_price: prod.selling_price || 0
                  });
                } else {
                  setNewImeiData({
                    ...newImeiData,
                    product_id: ''
                  });
                }
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
            >
              <option value="">-- বিদ্যমান ক্যাটালগ থেকে নির্বাচন করুন --</option>
              
              {/* Existing Handset Products */}
              <optgroup label="📱 বর্তমান দোকানের মোবাইল হ্যান্ডসেট ও গ্যাজেট">
                {products
                  .filter(p => p.business_category_id === 'cat_telecom' || p.tracking_mode === 'TRACKING_IMEI' || p.name.toLowerCase().includes('phone') || p.name.toLowerCase().includes('samsung') || p.name.toLowerCase().includes('redmi') || p.name.toLowerCase().includes('vivo') || p.name.toLowerCase().includes('realme') || p.name.toLowerCase().includes('iphone'))
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — (মূল্য: ৳{p.selling_price}, কোড: {p.code})
                    </option>
                  ))}
              </optgroup>

              {/* Other Products */}
              {products.length > 0 && (
                <optgroup label="📦 অন্যান্য সাধারণ পণ্য ক্যাটালগ">
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Quick-Click Preset Smartphone Models */}
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
            <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>জনপ্রিয় স্মার্টফোন মডেল দ্রুত নির্বাচন (১-ক্লিক অটোফিল):</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { name: 'Samsung Galaxy A54 5G', cost: 34000, sell: 38500, storage: '128GB', color: 'Awesome Lime' },
                { name: 'Xiaomi Redmi Note 13', cost: 20000, sell: 22999, storage: '128GB', color: 'Midnight Black' },
                { name: 'Realme C55', cost: 16500, sell: 18999, storage: '64GB', color: 'Sunshower' },
                { name: 'Vivo Y27 4G', cost: 17500, sell: 19999, storage: '128GB', color: 'Sea Blue' },
                { name: 'iPhone 15 Pro Max', cost: 135000, sell: 145000, storage: '256GB', color: 'Natural Titanium' },
                { name: 'Walton Primo R10', cost: 10500, sell: 12500, storage: '64GB', color: 'Dark Blue' },
                { name: 'Symphony B12 (Feature)', cost: 1250, sell: 1450, storage: '32MB', color: 'Black' }
              ].map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setNewImeiData({
                      ...newImeiData,
                      model: preset.name,
                      cost_price: preset.cost,
                      selling_price: preset.sell,
                      storage: preset.storage,
                      color: preset.color,
                      warranty_months: 12
                    });
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                    newImeiData.model === preset.name
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100/60'
                  }`}
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Model Name Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              হ্যান্ডসেটের পূর্ণাঙ্গ নাম / মডেল * (Product Title)
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: Samsung Galaxy A54 5G 8GB/128GB"
              value={newImeiData.model || ''}
              onChange={e => setNewImeiData({ ...newImeiData, model: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">15-Digit ইউনিক IMEI *</label>
              <input
                type="text"
                required
                maxLength={18}
                placeholder="354891098492000"
                value={newImeiData.imei || ''}
                onChange={e => setNewImeiData({ ...newImeiData, imei: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">সিরিয়াল নম্বর (S/N)</label>
              <input
                type="text"
                placeholder="FK2X9A4H0M"
                value={newImeiData.serial_number || ''}
                onChange={e => setNewImeiData({ ...newImeiData, serial_number: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ক্রয় মূল্য (৳)</label>
              <input
                type="number"
                value={newImeiData.cost_price || 0}
                onChange={e => setNewImeiData({ ...newImeiData, cost_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">বিক্রয় মূল্য (৳)</label>
              <input
                type="number"
                value={newImeiData.selling_price || 0}
                onChange={e => setNewImeiData({ ...newImeiData, selling_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">কালার / ফিনিশ</label>
              <input
                type="text"
                placeholder="Black"
                value={newImeiData.color || ''}
                onChange={e => setNewImeiData({ ...newImeiData, color: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">স্টোরেজ / RAM</label>
              <input
                type="text"
                placeholder="128GB"
                value={newImeiData.storage || ''}
                onChange={e => setNewImeiData({ ...newImeiData, storage: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddImeiOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>হ্যান্ডসেট IMEI যুক্ত করুন</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NEW TRADE-IN                                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewTradeInOpen}
        onClose={() => setIsNewTradeInOpen(false)}
        title="পুরাতন ডিভাইস মূল্যায়ন ও এক্সচেঞ্জ"
        subtitle="ব্যবহৃত হ্যান্ডসেটের অবস্থা যাচাই ও ক্রেডিট ভাউচার প্রদান"
      >
        <form onSubmit={handleCreateTradeIn} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">গ্রাহকের নাম</label>
              <input
                type="text"
                value={tradeInData.customer_name || ''}
                onChange={e => setTradeInData({ ...tradeInData, customer_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর</label>
              <input
                type="tel"
                value={tradeInData.customer_phone || ''}
                onChange={e => setTradeInData({ ...tradeInData, customer_phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ডিভাইস মডেল *</label>
              <input
                type="text"
                required
                placeholder="যেমন: iPhone 13 128GB"
                value={tradeInData.device_model || ''}
                onChange={e => setTradeInData({ ...tradeInData, device_model: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ডিভাইস IMEI *</label>
              <input
                type="text"
                required
                placeholder="359981048..."
                value={tradeInData.imei || ''}
                onChange={e => setTradeInData({ ...tradeInData, imei: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">কন্ডিশন গ্রেড</label>
            <select
              value={tradeInData.condition_grade}
              onChange={e => setTradeInData({ ...tradeInData, condition_grade: e.target.value as TradeInRecord['condition_grade'] })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
            >
              <option value="A - Pristine">Grade A - নিখুঁত (নতুনের মতো)</option>
              <option value="B - Good">Grade B - ভালো (সামান্য দাগ)</option>
              <option value="C - Fair">Grade C - মোটামুটি (ব্যাটারি &lt;80%)</option>
              <option value="D - Damaged">Grade D - ড্যামেজ (গ্লাস ফাটা/সমস্যা)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">বাজার মূল্যায়ন মূল্য (৳)</label>
              <input
                type="number"
                value={tradeInData.evaluated_value}
                onChange={e => setTradeInData({ ...tradeInData, evaluated_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">প্রদত্ত ক্রেডিট / টাকা (৳)</label>
              <input
                type="number"
                value={tradeInData.offered_credit}
                onChange={e => setTradeInData({ ...tradeInData, offered_credit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTradeInOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              ট্রেড-ইন ভাউচার ইস্যু করুন
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
