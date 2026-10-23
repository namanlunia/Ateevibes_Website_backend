import React, { useState, useEffect } from 'react';
import { Search, Users, Mail, Phone, MapPin, ShoppingBag, Eye, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { Customer } from '../types';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchCustomers = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    apiClient<{ items: Customer[] }>(`admin/customers?${params.toString()}`)
      .then((res) => setCustomers(res.items || []))
      .catch((err) => console.error('Failed to load customers:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleViewCustomer = async (id: string) => {
    try {
      const details = await apiClient(`admin/customers/${id}`);
      setSelectedCustomer(details);
    } catch (err: any) {
      alert(`Customer detail error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-obsidian">Customer Profiles</h2>
          <p className="text-xs text-ink-600 mt-0.5">Customer registry, lifetime order values, and delivery address books</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-sandstone shadow-subtle flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold text-obsidian"
          />
        </div>

        <span className="text-xs text-ink-600 font-medium">
          {customers.length} registered profiles
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-sandstone shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-ivory border-b border-sandstone text-ink-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 pl-4">Customer</th>
                <th className="py-3.5">Email</th>
                <th className="py-3.5">Phone</th>
                <th className="py-3.5">Registered</th>
                <th className="py-3.5">Addresses</th>
                <th className="py-3.5 pr-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sandstone/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-ink-500">
                    Loading customer profiles...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-ink-500">
                    No customer records found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory/40 transition-colors">
                    <td className="py-3.5 pl-4 font-semibold text-obsidian">{c.name}</td>
                    <td className="py-3.5 text-ink-700 font-mono text-[11px]">{c.email}</td>
                    <td className="py-3.5 text-ink-600 font-mono text-[11px]">{c.phone || '—'}</td>
                    <td className="py-3.5 text-ink-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 text-ink-600">
                      {c.addresses?.length || 0} saved
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <button
                        onClick={() => handleViewCustomer(c.id)}
                        className="btn-dark px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-sandstone shadow-luxury p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-sandstone">
              <h3 className="font-serif text-xl font-normal text-obsidian">Customer Profile</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-ink-500 hover:text-obsidian rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="font-bold text-base text-obsidian">{selectedCustomer.name}</p>
              <p className="text-xs text-ink-600 font-mono">{selectedCustomer.email}</p>
              {selectedCustomer.phone && (
                <p className="text-xs text-ink-600 font-mono">{selectedCustomer.phone}</p>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-ivory rounded-xl border border-sandstone text-xs">
              <div>
                <span className="text-ink-500 uppercase tracking-wider text-[10px] block">Lifetime Orders</span>
                <span className="font-bold text-lg text-obsidian">{selectedCustomer.totalOrders}</span>
              </div>
              <div>
                <span className="text-ink-500 uppercase tracking-wider text-[10px] block">Total Spent</span>
                <span className="font-bold text-lg text-obsidian">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Saved Addresses */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gold mb-2">Saved Addresses</p>
              <div className="space-y-2">
                {selectedCustomer.addresses?.map((addr: any) => (
                  <div key={addr.id} className="p-3 bg-ivory/50 border border-sandstone rounded-lg text-xs text-ink-700">
                    <p className="font-semibold text-obsidian">{addr.fullName} {addr.isDefault && <span className="text-gold text-[10px] font-bold uppercase">(Default)</span>}</p>
                    <p>{addr.addressLine1}</p>
                    <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
