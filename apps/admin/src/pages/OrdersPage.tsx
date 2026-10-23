import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Eye, Truck, CheckCircle2, XCircle, Package, ArrowRight, X } from 'lucide-react';
import { StatusBadge } from '../components/layout/StatusBadge';
import { apiClient } from '../api/client';
import { Order } from '../types';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Dispatch shipment modal state
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [courier, setCourier] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (search) params.append('search', search);
    params.append('limit', '50');

    apiClient<{ items: Order[] }>(`orders/admin/all?${params.toString()}`)
      .then((res) => setOrders(res.items || []))
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const handleUpdateStatus = async (orderId: string, newStatus: string, note?: string) => {
    setIsUpdating(true);
    try {
      await apiClient(`orders/admin/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, note }),
      });
      fetchOrders();
      if (selectedOrder) {
        const refreshed = await apiClient<Order>(`orders/${orderId}`);
        setSelectedOrder(refreshed);
      }
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedOrder || !trackingNumber.trim()) return;
    setIsUpdating(true);
    try {
      await apiClient('shipments', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder.id,
          courier,
          trackingNumber: trackingNumber.trim(),
        }),
      });
      setIsShippingModalOpen(false);
      setTrackingNumber('');
      fetchOrders();
      const refreshed = await apiClient<Order>(`orders/${selectedOrder.id}`);
      setSelectedOrder(refreshed);
    } catch (err: any) {
      alert(`Dispatch error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-obsidian">Orders & Fulfilment</h2>
          <p className="text-xs text-ink-600 mt-0.5">Authoritative order queue, customer delivery snapshots, and status transitions</p>
        </div>
      </div>

      {/* Toolbar & Filter Pills */}
      <div className="p-4 rounded-xl bg-white border border-sandstone shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, customer, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian"
            />
          </div>

          <span className="text-xs text-ink-600 font-medium whitespace-nowrap">
            {orders.length} orders listed
          </span>
        </div>

        {/* Filter status buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-sandstone/40">
          {[
            { label: 'All Orders', value: '' },
            { label: 'Placed (New)', value: 'placed' },
            { label: 'Packed', value: 'packed' },
            { label: 'In Transit', value: 'shipped' },
            { label: 'Delivered', value: 'delivered' },
            { label: 'Cancelled', value: 'cancelled' },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                statusFilter === pill.value
                  ? 'bg-obsidian text-ivory'
                  : 'bg-ivory border border-sandstone text-ink-700 hover:text-obsidian'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-sandstone shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-ivory border-b border-sandstone text-ink-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 pl-4">Order ID</th>
                <th className="py-3.5">Placed On</th>
                <th className="py-3.5">Customer & City</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5">Payment</th>
                <th className="py-3.5">Grand Total</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sandstone/40">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-ink-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-ink-500">
                    No orders found matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-ivory/40 transition-colors">
                    <td className="py-3.5 pl-4 font-mono font-bold text-obsidian">{o.id}</td>
                    <td className="py-3.5 text-ink-600 font-mono text-[11px]">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-obsidian">{o.shippingAddress?.fullName || 'Customer'}</p>
                      <p className="text-[11px] text-ink-500">{o.shippingAddress?.city || '—'}, {o.shippingAddress?.state || ''}</p>
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={o.status} type="order" />
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={o.paymentStatus} type="payment" />
                    </td>
                    <td className="py-3.5 font-bold text-obsidian">
                      ₹{Number(o.grandTotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="btn-dark px-3 py-1.5 text-xs inline-flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-sandstone shadow-luxury p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-sandstone">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold block">
                  Order Management
                </span>
                <h3 className="font-serif text-2xl font-normal text-obsidian">{selectedOrder.id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-ink-500 hover:text-obsidian rounded-lg hover:bg-sandstone/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Actions Control Bar */}
            <div className="p-4 rounded-xl bg-ivory border border-sandstone flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedOrder.status} type="order" />
                <StatusBadge status={selectedOrder.paymentStatus} type="payment" />
              </div>

              {/* Status Action Transitions */}
              <div className="flex items-center gap-2">
                {selectedOrder.status === 'placed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'packed', 'Items picked and packed in atelier')}
                    disabled={isUpdating}
                    className="btn-dark px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5 text-gold" />
                    <span>Mark Packed</span>
                  </button>
                )}

                {selectedOrder.status === 'packed' && (
                  <button
                    onClick={() => setIsShippingModalOpen(true)}
                    disabled={isUpdating}
                    className="btn-gold px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch via Courier</span>
                  </button>
                )}

                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered', 'Confirmed carrier delivery')}
                    disabled={isUpdating}
                    className="btn-dark px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Confirm Delivered</span>
                  </button>
                )}

                {['placed', 'packed'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      if (confirm('Cancel this order? This will release reserved inventory back to available stock.')) {
                        handleUpdateStatus(selectedOrder.id, 'cancelled', 'Customer cancellation');
                      }
                    }}
                    disabled={isUpdating}
                    className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg border border-red-200"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Shipping Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-sandstone/80 bg-white">
                <p className="font-bold text-obsidian uppercase tracking-wider text-[10px] text-gold mb-1.5">
                  Shipping Destination
                </p>
                <p className="font-semibold text-obsidian">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-ink-600">{selectedOrder.shippingAddress?.addressLine1}</p>
                {selectedOrder.shippingAddress?.addressLine2 && (
                  <p className="text-ink-600">{selectedOrder.shippingAddress.addressLine2}</p>
                )}
                <p className="text-ink-600">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} — {selectedOrder.shippingAddress?.pincode}
                </p>
                <p className="text-ink-600 pt-1 font-mono">{selectedOrder.shippingAddress?.phone}</p>
              </div>

              <div className="p-4 rounded-xl border border-sandstone/80 bg-white">
                <p className="font-bold text-obsidian uppercase tracking-wider text-[10px] text-gold mb-1.5">
                  Payment & Delivery Schedule
                </p>
                <p className="text-ink-700">Method: <span className="font-semibold uppercase text-obsidian">{selectedOrder.paymentMethod}</span></p>
                <p className="text-ink-700">Estimated Delivery: <span className="font-semibold text-obsidian">{selectedOrder.estimatedDeliveryDate}</span></p>
                {selectedOrder.promoCode && (
                  <p className="text-gold font-semibold pt-1">Promo Applied: {selectedOrder.promoCode}</p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-sandstone rounded-xl overflow-hidden">
              <div className="p-3 bg-ivory border-b border-sandstone text-[10px] font-bold uppercase tracking-wider text-ink-700">
                Purchased Garments Snapshot ({selectedOrder.items?.length || 0})
              </div>
              <div className="divide-y divide-sandstone/40 p-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || '/brand/tshirt-silhouette.svg'}
                        alt={item.productName}
                        className="w-12 h-14 object-cover rounded bg-ivory border border-sandstone shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-obsidian">{item.productName}</p>
                        <p className="text-ink-600">{item.colourName} • Size {item.size}</p>
                        <p className="text-[11px] font-mono text-ink-500">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-obsidian">₹{Number(item.subtotal).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-ink-500">{item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="p-4 bg-ivory rounded-xl border border-sandstone space-y-1.5 text-xs text-ink-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{Number(selectedOrder.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {Number(selectedOrder.discount) > 0 && (
                <div className="flex justify-between text-gold font-semibold">
                  <span>Discount</span>
                  <span>-₹{Number(selectedOrder.discount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{Number(selectedOrder.shippingFee) === 0 ? 'FREE' : `₹${selectedOrder.shippingFee}`}</span>
              </div>
              {Number(selectedOrder.codFee) > 0 && (
                <div className="flex justify-between">
                  <span>COD Handling Fee</span>
                  <span>₹{selectedOrder.codFee}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-obsidian pt-2 border-t border-sandstone">
                <span>Grand Total</span>
                <span>₹{Number(selectedOrder.grandTotal).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Shipment Modal */}
      {isShippingModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-sandstone shadow-luxury p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sandstone">
              <h3 className="font-serif text-xl font-normal text-obsidian">Dispatch Courier Shipment</h3>
              <button onClick={() => setIsShippingModalOpen(false)} className="p-1 text-ink-500 hover:text-obsidian rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                Courier Carrier
              </label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold"
              >
                <option value="Delhivery Express">Delhivery Express</option>
                <option value="Blue Dart Express">Blue Dart Express</option>
                <option value="DTDC Air">DTDC Air</option>
                <option value="Shadowfax">Shadowfax</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                AWB / Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. DEL-779812401IN"
                className="w-full px-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-sandstone">
              <button
                onClick={() => setIsShippingModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-sandstone/30 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShipment}
                disabled={isUpdating || !trackingNumber.trim()}
                className="btn-gold px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Recording...' : 'Record Dispatch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
