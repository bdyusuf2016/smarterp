import React, { useState } from 'react';
import { 
  Layers, 
  Scale, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Tag,
  Percent,
  Search
} from 'lucide-react';
import { 
  Tenant, 
  UserRole, 
  ProductBatch, 
  GenericProduct 
} from '../../types';
import { storageService } from '../../services/storageService';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface GroceryModulesViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  activeTab?: 'batches' | 'scale';
}

export const GroceryModulesView: React.FC<GroceryModulesViewProps> = ({
  activeTenant,
  activeTab: initialTab = 'batches'
}) => {
  const [tab, setTab] = useState<'batches' | 'scale'>(initialTab);
  const batches = storageService.getBatches();
  const products = storageService.getProducts(activeTenant.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [newBatchData, setNewBatchData] = useState<Partial<ProductBatch>>({
    batch_number: `LOT-${Date.now().toString().slice(-4)}`,
    mfg_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    quantity: 20,
    cost_price: 2.5,
    selling_price: 3.99,
    status: 'active'
  });

  // Scale interactive tester state
  const [selectedScaleProduct, setSelectedScaleProduct] = useState<GenericProduct | null>(
    products.find(p => p.tracking_mode === 'TRACKING_WEIGHT') || null
  );
  const [scaleGrams, setScaleGrams] = useState<number>(1450); // 1.450 kg
  const [tareGrams, setTareGrams] = useState<number>(0);
  const [printedStickers, setPrintedStickers] = useState<{
    id: string;
    productName: string;
    weightKg: number;
    totalPrice: number;
    barcode: string;
  }[]>([]);

  const weightProducts = products.filter(p => p.tracking_mode === 'TRACKING_WEIGHT');

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchData.product_id || !newBatchData.batch_number || !newBatchData.expiry_date) return;

    const prod = products.find(p => p.id === newBatchData.product_id);
    const expDate = new Date(newBatchData.expiry_date);
    const today = new Date();
    const diffDays = (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

    let status: ProductBatch['status'] = 'active';
    if (diffDays <= 0) status = 'expired';
    else if (diffDays <= 14) status = 'expiring_soon';

    const batchToSave: ProductBatch = {
      id: `batch_${Date.now()}`,
      product_id: newBatchData.product_id,
      batch_number: newBatchData.batch_number,
      mfg_date: newBatchData.mfg_date || new Date().toISOString().split('T')[0],
      expiry_date: newBatchData.expiry_date,
      quantity: Number(newBatchData.quantity) || 0,
      cost_price: Number(newBatchData.cost_price) || prod?.purchase_price || 0,
      selling_price: Number(newBatchData.selling_price) || prod?.selling_price || 0,
      status
    };

    storageService.saveBatch(batchToSave);
    setIsAddBatchOpen(false);
  };

  const handlePrintScaleLabel = () => {
    if (!selectedScaleProduct) return;
    const netGrams = Math.max(0, scaleGrams - tareGrams);
    const weightKg = netGrams / 1000;
    const totalPrice = Math.round(weightKg * selectedScaleProduct.selling_price * 100) / 100;
    const barcode = `20${selectedScaleProduct.code.replace(/\D/g, '').padEnd(4, '0')}${Math.round(netGrams).toString().padStart(5, '0')}7`;

    setPrintedStickers([
      {
        id: `lbl_${Date.now()}`,
        productName: selectedScaleProduct.name,
        weightKg,
        totalPrice,
        barcode
      },
      ...printedStickers
    ]);
  };

  return (
    <div className="space-y-3.5 pb-8">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-sm font-bold text-[#1a1b1e] flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Grocery & Perishables Industry Suite
          </h1>
          <p className="text-[11px] text-[#868e96] mt-0.5">
            Batch & lot tracking, perishable expiration monitor, and precision scale weight integration.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#f1f3f5] p-0.5 rounded text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('batches')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-xs ${
              tab === 'batches' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-[#495057] hover:text-[#1a1b1e]'
            }`}
          >
            Batch & Expiry Control ({batches.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('scale')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-xs ${
              tab === 'scale' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-[#495057] hover:text-[#1a1b1e]'
            }`}
          >
            Weight Scale & Barcode Hub
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* 1. BATCHES & EXPIRY TAB */}
      {/* ================================================== */}
      {tab === 'batches' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2.5 bg-white p-3 rounded-lg border border-[#dee2e6] shadow-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#868e96] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Lot number, product name, expiry date..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded text-xs text-[#1a1b1e] focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsAddBatchOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Receive New Batch Lot</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-[#dee2e6] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#868e96] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Batch / Lot #</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Manufacture Date</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Stock Quantity</th>
                  <th className="py-2.5 px-3">Shelf Status</th>
                  <th className="py-2.5 px-3 font-mono">Retail Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5]">
                {batches
                  .filter(b => b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(batch => {
                    const prod = products.find(p => p.id === batch.product_id);
                    const today = new Date();
                    const exp = new Date(batch.expiry_date);
                    const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));

                    return (
                      <tr key={batch.id} className="hover:bg-[#f8f9fa]">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1a1b1e]">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{batch.batch_number}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#1a1b1e]">
                          {prod?.name || 'Product SKU'}
                        </td>
                        <td className="py-2.5 px-3 text-[#495057] font-mono">{batch.mfg_date}</td>
                        <td className="py-2.5 px-3 font-mono">
                          <div className="font-bold text-[#1a1b1e]">{batch.expiry_date}</div>
                          <span className={`text-[10px] ${daysLeft <= 0 ? 'text-rose-600 font-bold' : daysLeft <= 14 ? 'text-amber-600 font-bold' : 'text-[#868e96]'}`}>
                            {daysLeft <= 0 ? 'Expired' : `${daysLeft} days remaining`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#1a1b1e]">
                          {batch.quantity} units
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={batch.status === 'expired' ? 'danger' : batch.status === 'expiring_soon' ? 'warning' : 'success'} size="sm">
                            {batch.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1a1b1e]">
                          ${batch.selling_price.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. SCALE & BARCODE HUB TAB */}
      {/* ================================================== */}
      {tab === 'scale' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Left: Interactive Scale Hardware Simulator (6 cols) */}
          <div className="lg:col-span-6 bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#dee2e6] pb-2">
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-[#1a1b1e]">Precision Digital Scale Station</h2>
              </div>
              <Badge variant="success" size="sm">Online / Calibrated</Badge>
            </div>

            {/* Product selection */}
            <div>
              <label className="block text-xs font-semibold text-[#495057] mb-1">Select Weighed Product / Produce</label>
              <select
                value={selectedScaleProduct?.id || ''}
                onChange={e => setSelectedScaleProduct(products.find(p => p.id === e.target.value) || null)}
                className="w-full px-2.5 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded text-xs font-semibold text-[#1a1b1e]"
              >
                {weightProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.selling_price.toFixed(2)}/kg (SKU: {p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Scale Visual Display */}
            <div className="bg-[#1a1b1e] text-emerald-400 p-4 rounded-lg text-center space-y-1.5 border border-[#141517] shadow-inner">
              <p className="text-[10px] text-[#868e96] uppercase tracking-widest font-mono">NET WEIGHT</p>
              <div className="text-3xl font-mono font-bold tracking-tight text-emerald-400">
                {((Math.max(0, scaleGrams - tareGrams)) / 1000).toFixed(3)} <span className="text-lg text-emerald-500">kg</span>
              </div>
              <div className="text-[#adb5bd] text-[11px] font-mono">
                Gross: {(scaleGrams / 1000).toFixed(3)}kg • Tare: {(tareGrams / 1000).toFixed(3)}kg
              </div>
              <div className="pt-1.5 border-t border-[#2c2e33] text-base font-extrabold text-white font-mono">
                Computed Price: ${(((Math.max(0, scaleGrams - tareGrams)) / 1000) * (selectedScaleProduct?.selling_price || 0)).toFixed(2)}
              </div>
            </div>

            {/* Scale Weight Adjuster Sliders & Preset Buttons */}
            <div className="space-y-2.5 pt-1 text-xs">
              <label className="block font-semibold text-[#495057]">Simulate Placed Weight on Platter</label>
              <input
                type="range"
                min="50"
                max="5000"
                step="25"
                value={scaleGrams}
                onChange={e => setScaleGrams(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex items-center justify-between text-[#868e96] text-[10px]">
                <span>50g</span>
                <span>2.500kg</span>
                <span>5.000kg</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTareGrams(scaleGrams)}
                  className="flex-1 py-1.5 bg-[#f1f3f5] hover:bg-[#e9ecef] text-[#495057] font-bold rounded cursor-pointer text-xs"
                >
                  Tare Zero (Container)
                </button>
                <button
                  type="button"
                  onClick={() => setTareGrams(0)}
                  className="px-3 py-1.5 bg-[#f1f3f5] hover:bg-[#e9ecef] text-[#495057] font-bold rounded cursor-pointer text-xs"
                >
                  Reset Tare
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrintScaleLabel}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Scale Price Barcode Sticker</span>
              </button>
            </div>
          </div>

          {/* Right: Printed Scale Stickers Output (6 cols) */}
          <div className="lg:col-span-6 bg-white p-3.5 rounded-lg border border-[#dee2e6] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#dee2e6] pb-2">
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-[#1a1b1e]">Generated Weighing Stickers</h2>
              </div>
              <span className="text-[11px] text-[#868e96]">{printedStickers.length} printed</span>
            </div>

            {printedStickers.length === 0 ? (
              <div className="py-12 text-center text-[#868e96] text-xs">
                <Printer className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                <span>Place an item on the scale and click &quot;Print Scale Price Barcode Sticker&quot;.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {printedStickers.map(stk => (
                  <div key={stk.id} className="p-2.5 bg-[#f8f9fa] border border-dashed border-[#dee2e6] rounded text-xs space-y-1">
                    <div className="flex justify-between font-bold text-[#1a1b1e]">
                      <span>{stk.productName}</span>
                      <span className="text-emerald-700 font-mono">${stk.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#495057] text-[11px]">
                      <span>Weight: {stk.weightKg.toFixed(3)} kg</span>
                      <span className="font-mono text-[10px]">POS Encoded: {stk.barcode}</span>
                    </div>
                    <div className="pt-0.5 text-center font-mono text-[9px] tracking-widest bg-white p-1 rounded border border-[#dee2e6] text-[#495057]">
                      ||| ||||| || |||| ||||| |||
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Batch Lot */}
      <Modal
        isOpen={isAddBatchOpen}
        onClose={() => setIsAddBatchOpen(false)}
        title="Receive Inward Batch Lot"
        subtitle="Grocery & Perishable lot registration with automated expiry trigger"
      >
        <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#495057] mb-1">Product SKU *</label>
            <select
              required
              value={newBatchData.product_id || ''}
              onChange={e => setNewBatchData({ ...newBatchData, product_id: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
            >
              <option value="">-- Choose Grocery Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Batch / Lot Number *</label>
              <input
                type="text"
                required
                value={newBatchData.batch_number || ''}
                onChange={e => setNewBatchData({ ...newBatchData, batch_number: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded font-mono font-bold text-[#1a1b1e]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Lot Quantity Received *</label>
              <input
                type="number"
                required
                value={newBatchData.quantity}
                onChange={e => setNewBatchData({ ...newBatchData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Manufacture Date *</label>
              <input
                type="date"
                required
                value={newBatchData.mfg_date}
                onChange={e => setNewBatchData({ ...newBatchData, mfg_date: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Expiration Date *</label>
              <input
                type="date"
                required
                value={newBatchData.expiry_date}
                onChange={e => setNewBatchData({ ...newBatchData, expiry_date: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-[#dee2e6] rounded text-[#1a1b1e]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-[#dee2e6]">
            <button
              type="button"
              onClick={() => setIsAddBatchOpen(false)}
              className="px-3 py-1.5 text-[#495057] hover:text-[#1a1b1e] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs cursor-pointer"
            >
              Save Batch Lot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
