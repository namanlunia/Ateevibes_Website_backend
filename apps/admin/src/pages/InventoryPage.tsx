import { ReceiveStockModal } from "../components/inventory/ReceiveStockModal";
import React, { useState, useEffect } from 'react';
import { Search, Boxes, AlertTriangle, ArrowUpDown, History, Plus, Minus, X, Check } from 'lucide-react';
import { apiClient } from '../api/client';
import { InventoryLevel, InventoryMovement } from '../types';

export const InventoryPage: React.FC = () => {
  const [levels, setLevels] = useState<InventoryLevel[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'levels' | 'movements'>('levels');
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  // Adjustment Modal State
  const [selectedStock, setSelectedStock] = useState<InventoryLevel | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<string>('ADJUSTMENT');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (lowStockOnly) params.append('lowStockOnly', 'true');

    Promise.all([
      apiClient<InventoryLevel[]>(`admin/inventory?${params.toString()}`),
      apiClient<InventoryMovement[]>('admin/inventory/movements?limit=40'),
    ])
      .then(([levelsData, movementsData]) => {
        setLevels(levelsData || []);
        setMovements(movementsData || []);
      })
      .catch((err) => console.error('Failed to load inventory data:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, [search, lowStockOnly]);

  const handleOpenAdjust = (item: InventoryLevel) => {
    setSelectedStock(item);
    setQuantityChange(0);
    setAdjustType('ADJUSTMENT');
    setNotes('');
  };

  const handleSaveAdjust = async () => {
    if (!selectedStock || quantityChange === 0) return;
    setIsSubmitting(true);
    try {
      await apiClient('admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          variantId: selectedStock.variantId,
          size: selectedStock.size,
          quantityChange: Number(quantityChange),
          type: adjustType,
          notes: notes.trim() || 'Manual atelier audit adjustment',
        }),
      });
      setSelectedStock(null);
      fetchInventory();
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-obsidian">Inventory & Stock Ledger</h2>
          <p className="text-xs text-ink-600 mt-0.5">
            Variant-level physical on-hand, open reservation holds, and available-to-sell quotas
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReceiveModalOpen(true)}
            className="btn-gold px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-subtle shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Receive Shipment</span>
          </button>
          <div className="flex items-center bg-white border border-sandstone rounded-lg p-1 shadow-subtle">
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'levels'
                ? 'bg-obsidian text-ivory'
                : 'text-ink-600 hover:text-obsidian'
            }`}
          >
            Variant Levels
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'movements'
                ? 'bg-obsidian text-ivory'
                : 'text-ink-600 hover:text-obsidian'
            }`}
          >
            Movement Audit
          </button>
        </div>
      </div>

      {activeTab === 'levels' && (
        <>
          {/* Toolbar */}
          <div className="p-4 rounded-xl bg-white border border-sandstone shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by SKU, style, or color..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-obsidian cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="accent-gold rounded"
                />
                <span>Low stock only</span>
              </label>
            </div>

            <span className="text-xs text-ink-600 font-medium">
              {levels.length} SKU sizes tracked
            </span>
          </div>

          {/* Table */}
          <div className="rounded-xl bg-white border border-sandstone shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-ivory border-b border-sandstone text-ink-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 pl-4">SKU Code</th>
                    <th className="py-3.5">Garment & Color</th>
                    <th className="py-3.5">Size</th>
                    <th className="py-3.5 text-center">Physical On-Hand</th>
                    <th className="py-3.5 text-center">Reserved Hold</th>
                    <th className="py-3.5 text-center">Available to Sell</th>
                    <th className="py-3.5">Status</th>
                    <th className="py-3.5 pr-4 text-right">Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sandstone/40">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-ink-500">
                        Synchronizing variant stock quotas...
                      </td>
                    </tr>
                  ) : levels.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-ink-500">
                        No inventory records found.
                      </td>
                    </tr>
                  ) : (
                    levels.map((item) => (
                      <tr key={item.id} className="hover:bg-ivory/40 transition-colors">
                        <td className="py-3.5 pl-4 font-mono font-bold text-obsidian">
                          {item.sku}
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-obsidian line-clamp-1">{item.productName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-sandstone shrink-0"
                              style={{ backgroundColor: item.hex }}
                            />
                            <span className="text-[11px] text-ink-500">{item.colourName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-bold text-obsidian">{item.size}</td>
                        <td className="py-3.5 text-center font-bold text-obsidian">
                          {item.onHand}
                        </td>
                        <td className="py-3.5 text-center font-medium text-amber-700">
                          {item.reserved > 0 ? `-${item.reserved}` : '0'}
                        </td>
                        <td className="py-3.5 text-center font-bold text-base text-obsidian">
                          {item.availableToSell}
                        </td>
                        <td className="py-3.5">
                          {item.isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                              Out of Stock
                            </span>
                          ) : item.isLowStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                              Low Stock ({item.availableToSell})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Optimal
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            className="btn-dark px-3 py-1.5 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <ArrowUpDown className="w-3 h-3 text-gold" />
                            <span>Adjust</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'movements' && (
        <div className="rounded-xl bg-white border border-sandstone shadow-subtle overflow-hidden">
          <div className="p-4 bg-ivory border-b border-sandstone">
            <h3 className="font-serif text-lg font-normal text-obsidian">Movement Audit Trail</h3>
            <p className="text-xs text-ink-600">Tamper-evident record of stock additions, orders, reservations, and damages</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-ivory/60 border-b border-sandstone text-ink-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 pl-4">Timestamp</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">SKU & Size</th>
                  <th className="py-3">Quantity Delta</th>
                  <th className="py-3">Reference</th>
                  <th className="py-3 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sandstone/40">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-ivory/30">
                    <td className="py-3 pl-4 text-ink-500 font-mono text-[11px]">
                      {new Date(m.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-obsidian text-gold">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-obsidian">
                      {m.variant?.sku || 'SKU'} • {m.size}
                    </td>
                    <td
                      className={`py-3 font-bold ${
                        m.quantity > 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-ink-600">
                      {m.referenceOrderId || m.referencePOId || '—'}
                    </td>
                    <td className="py-3 pr-4 text-ink-600 line-clamp-1">{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-sandstone shadow-luxury p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sandstone">
              <h3 className="font-serif text-xl font-normal text-obsidian">Stock Reconciliation</h3>
              <button onClick={() => setSelectedStock(null)} className="p-1 text-ink-500 hover:text-obsidian rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-obsidian">{selectedStock.productName}</p>
              <p className="text-xs text-ink-600">
                {selectedStock.colourName} • Size {selectedStock.size} (Current On-Hand: {selectedStock.onHand})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                Quantity Delta (e.g. +5 or -2)
              </label>
              <input
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                Reason / Classification
              </label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold"
              >
                <option value="ADJUSTMENT">Physical Audit Adjustment</option>
                <option value="RETURN_RESTOCK">Verified Return Restock</option>
                <option value="DAMAGED">Damaged in Transit / Scrap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                Audit Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adjustment, bin location, inspection notes..."
                className="w-full px-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-sandstone">
              <button
                onClick={() => setSelectedStock(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-sandstone/30 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjust}
                disabled={isSubmitting || quantityChange === 0}
                className="btn-gold px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Recording...' : 'Record Adjustment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      <ReceiveStockModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        onSuccess={fetchInventory}
      />
    </div>
  );
};
