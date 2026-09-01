import React from 'react';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  Smartphone, 
  Wrench, 
  Layers, 
  BookOpen, 
  BookmarkCheck, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2
} from 'lucide-react';
import { Tenant, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import { RuleEngine } from '../../engine/ruleEngine';
import { Badge } from '../common/Badge';

interface DashboardViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  onNavigate: (viewId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeTenant,
  activeRole,
  onNavigate
}) => {
  const products = storageService.getProducts(activeTenant.id);
  const sales = storageService.getSales(activeTenant.id);
  const customers = storageService.getCustomers(activeTenant.id);
  const auditLogs = storageService.getAuditLogs(activeTenant.id).slice(0, 6);

  // Industry specific datasets
  const devices = storageService.getDevices();
  const availableDevices = devices.filter(d => d.status === 'available');
  const repairs = storageService.getRepairs(activeTenant.id);
  const pendingRepairs = repairs.filter(r => r.status === 'received' || r.status === 'in_progress' || r.status === 'waiting_parts');
  const batches = storageService.getBatches();
  const expiringBatches = batches.filter(b => b.status === 'expiring_soon' || b.status === 'expired');
  const books = storageService.getBooks();
  const borrowRecords = storageService.getBorrowRecords(activeTenant.id);
  const activeBorrows = borrowRecords.filter(b => b.status === 'borrowed' || b.status === 'overdue');
  const overdueBorrows = borrowRecords.filter(b => b.status === 'overdue');
  const recharges = storageService.getRecharges(activeTenant.id);

  // Financial aggregates
  const totalRevenue = sales.reduce((sum, s) => sum + s.grand_total, 0);
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_alert);

  // Enabled modules
  const hasTelecom = RuleEngine.isModuleEnabled(activeTenant, 'IMEI') || RuleEngine.isModuleEnabled(activeTenant, 'REPAIRS');
  const hasGrocery = RuleEngine.isModuleEnabled(activeTenant, 'BATCH') || RuleEngine.isModuleEnabled(activeTenant, 'EXPIRY');
  const hasLibrary = RuleEngine.isModuleEnabled(activeTenant, 'BOOKS') || RuleEngine.isModuleEnabled(activeTenant, 'BORROWING');

  const tenants = storageService.getTenants();

  return (
    <div className="space-y-4 pb-8">
      {/* Super Admin Welcome Banner if 0 tenants */}
      {tenants.length === 0 && activeRole === 'SUPER_ADMIN' && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 rounded-xl border border-purple-700 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">সিস্টেম অ্যাডমিন পোর্টালে স্বাগতম, Md. Yusuf Ali!</h3>
              <p className="text-xs text-purple-200 mt-0.5">
                বর্তমানে কোনো দোকান নিবন্ধিত নেই। নতুন দোকান তৈরি ও ডোমেন কনফিগার করতে নিচে ক্লিক করুন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tenant_provisioning')}
            className="px-4 py-2 bg-white hover:bg-purple-50 text-purple-900 font-bold text-xs rounded-lg shadow cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4 text-purple-700" />
            <span>নতুন দোকান প্রভিশন করুন</span>
          </button>
        </div>
      )}

      {/* Welcome Banner with Tenant Category Badges */}
      <div className="bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-lg font-bold text-[#1a1b1e] tracking-tight">
              {activeTenant?.name || 'দোকান ড্যাশবোর্ড'}
            </h1>
            <Badge variant="primary" size="sm">
              {activeTenant?.code || 'SHOP'}
            </Badge>
          </div>
          <p className="text-xs text-[#868e96]">
            {activeTenant?.address ? `ঠিকানা: ${activeTenant.address} • ` : ''}মাল্টি-টেন্যান্ট বিজনেস ম্যানেজমেন্ট ড্যাশবোর্ড
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {RuleEngine.isModuleEnabled(activeTenant, 'SALES') && (
            <button
              type="button"
              onClick={() => onNavigate('pos_sales')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Open POS Checkout</span>
            </button>
          )}

          {hasLibrary && (
            <button
              type="button"
              onClick={() => onNavigate('library_circulation')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Issue / Return Books</span>
            </button>
          )}

          {hasTelecom && (
            <button
              type="button"
              onClick={() => onNavigate('telecom_repairs')}
              className="px-3 py-1.5 bg-[#212529] hover:bg-[#141517] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Service Center</span>
            </button>
          )}
        </div>
      </div>

      {/* Core Platform KPIs (4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs">
          <div className="flex items-center justify-between text-[#868e96] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#495057]">Total Sales Revenue</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-[#1a1b1e]">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{sales.length} completed transactions</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs">
          <div className="flex items-center justify-between text-[#868e96] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#495057]">Inventory Units</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-[#1a1b1e]">
            {totalStockUnits.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#868e96] mt-1">
            Across {products.length} master SKU catalog
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs">
          <div className="flex items-center justify-between text-[#868e96] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#495057]">
              {hasLibrary ? 'Registered Members' : 'Active Customers'}
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-[#1a1b1e]">
            {customers.length}
          </div>
          <div className="text-[10px] text-[#868e96] mt-1">
            CRM loyalty accounts
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs">
          <div className="flex items-center justify-between text-[#868e96] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#495057]">Stock Alerts</span>
            <div className={`p-1.5 rounded ${lowStockProducts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-400'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-xl font-bold ${lowStockProducts.length > 0 ? 'text-rose-600' : 'text-[#1a1b1e]'}`}>
            {lowStockProducts.length} Items
          </div>
          <div className="text-[10px] text-[#868e96] mt-1">
            Below min stock threshold
          </div>
        </div>
      </div>

      {/* Category-Specific Specialized Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Telecom Specialist Panel */}
        {hasTelecom && (
          <div className="bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#dee2e6] pb-2.5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-[#1a1b1e] uppercase tracking-wider">Telecom & Tech Desk</h2>
              </div>
              <Badge variant="primary">Module Active</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-[#f8f9fa] rounded border border-[#dee2e6]">
                <p className="text-[10px] text-[#868e96] font-bold uppercase">Available IMEIs</p>
                <p className="text-base font-bold text-blue-600 mt-0.5">{availableDevices.length} devices</p>
                <p className="text-[10px] text-[#868e96]">Validated in stock</p>
              </div>

              <div className="p-2.5 bg-[#f8f9fa] rounded border border-[#dee2e6]">
                <p className="text-[10px] text-[#868e96] font-bold uppercase">Repairs In Progress</p>
                <p className="text-base font-bold text-amber-600 mt-0.5">{pendingRepairs.length} tickets</p>
                <p className="text-[10px] text-[#868e96]">Active bench queue</p>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate('telecom_imei')}
                className="w-full py-1.5 px-3 bg-[#f8f9fa] hover:bg-gray-100 text-[#495057] text-xs font-semibold rounded flex items-center justify-center gap-1.5 border border-[#dee2e6] transition-colors cursor-pointer"
              >
                <span>View IMEI Registry & Devices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Grocery & Perishables Specialist Panel */}
        {hasGrocery && (
          <div className="bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#dee2e6] pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-[#1a1b1e] uppercase tracking-wider">Grocery & Batch Monitor</h2>
              </div>
              <Badge variant="success">Module Active</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-[#f8f9fa] rounded border border-[#dee2e6]">
                <p className="text-[10px] text-[#868e96] font-bold uppercase">Expiring Batches</p>
                <p className="text-base font-bold text-rose-600 mt-0.5">{expiringBatches.length} lots</p>
                <p className="text-[10px] text-[#868e96]">Expiring in &lt; 14 days</p>
              </div>

              <div className="p-2.5 bg-[#f8f9fa] rounded border border-[#dee2e6]">
                <p className="text-[10px] text-[#868e96] font-bold uppercase">Weight Scale Items</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {products.filter(p => p.tracking_mode === 'TRACKING_WEIGHT').length} items
                </p>
                <p className="text-[10px] text-[#868e96]">Loose produce & grains</p>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate('grocery_batches')}
                className="w-full py-1.5 px-3 bg-[#f8f9fa] hover:bg-gray-100 text-[#495057] text-xs font-semibold rounded flex items-center justify-center gap-1.5 border border-[#dee2e6] transition-colors cursor-pointer"
              >
                <span>Check Expiry Monitor & Markdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Library & Archive Circulation Panel */}
        {hasLibrary && (
          <div className="bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#dee2e6] pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <h2 className="text-xs font-bold text-[#1a1b1e] uppercase tracking-wider">Library Circulation</h2>
              </div>
              <Badge variant="purple">Module Active</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-[#f8f9fa] rounded border border-[#dee2e6]">
                <p className="text-[10px] text-[#868e96] font-bold uppercase">In Circulation</p>
                <p className="text-base font-bold text-purple-600 mt-0.5">{activeBorrows.length} loans</p>
                <p className="text-[10px] text-[#868e96]">Active member borrowings</p>
              </div>

              <div className="p-2.5 bg-[#f8f9fa] rounded border border-[#dee2e6]">
                <p className="text-[10px] text-[#868e96] font-bold uppercase">Overdue Books</p>
                <p className="text-base font-bold text-rose-600 mt-0.5">{overdueBorrows.length} loans</p>
                <p className="text-[10px] text-[#868e96]">Accruing late fees</p>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate('library_circulation')}
                className="w-full py-1.5 px-3 bg-[#f8f9fa] hover:bg-gray-100 text-[#495057] text-xs font-semibold rounded flex items-center justify-center gap-1.5 border border-[#dee2e6] transition-colors cursor-pointer"
              >
                <span>Process Returns & Collect Fines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity & Real-Time Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <div className="bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#dee2e6] pb-2.5 mb-2.5">
            <h2 className="text-xs font-bold text-[#1a1b1e] uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              Recent Sales & Billing
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              View Reports
            </button>
          </div>

          {sales.length === 0 ? (
            <p className="text-xs text-[#868e96] py-6 text-center">No sales completed yet.</p>
          ) : (
            <div className="divide-y divide-[#f1f3f5]">
              {sales.slice(0, 4).map(sale => (
                <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1a1b1e]">{sale.invoice_no}</span>
                      <Badge variant={sale.payment_status === 'PAID' ? 'success' : 'warning'}>
                        {sale.payment_status}
                      </Badge>
                    </div>
                    <p className="text-[#868e96] text-[11px] mt-0.5">
                      {sale.customer_name} • {sale.items.length} item(s) • {sale.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1a1b1e] text-sm">
                      ${sale.grand_total.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-[#868e96]">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Stream */}
        <div className="bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#dee2e6] pb-2.5 mb-2.5">
            <h2 className="text-xs font-bold text-[#1a1b1e] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#495057]" />
              System Audit Trail
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              All Logs
            </button>
          </div>

          <div className="space-y-2">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-start gap-2.5 text-xs p-2 bg-[#f8f9fa] rounded border border-[#dee2e6]">
                <div className="mt-0.5">
                  {log.severity === 'critical' || log.severity === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[#868e96]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1a1b1e]">{log.action}</span>
                    <span className="text-[10px] text-[#868e96]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#495057] mt-0.5">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
