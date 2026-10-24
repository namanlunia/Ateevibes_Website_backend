import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, UserPlus, Key, User, History, Check, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { AdminUser } from '../types';

export const SettingsPage: React.FC = () => {
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New staff modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('PRODUCT_MANAGER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaffAndLogs = () => {
    setIsLoading(true);
    Promise.all([
      apiClient<AdminUser[]>('admin/users').catch(() => []),
      apiClient<any[]>('settings/admin/audit-logs').catch(() => []),
    ])
      .then(([staffData, logsData]) => {
        setStaff(staffData || []);
        setAuditLogs(logsData || []);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStaffAndLogs();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient('admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
        }),
      });
      setIsAddStaffOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      fetchStaffAndLogs();
    } catch (err: any) {
      alert(`Error creating staff: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-obsidian">Store Settings & Staff</h2>
        <p className="text-xs text-ink-600 mt-0.5">Ateevibes configuration, policy statements, and role-based staff management</p>
      </div>

      {/* Store Parameters Card */}
      <div className="p-6 rounded-2xl bg-white border border-sandstone shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-sandstone">
          <Settings className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-xl font-normal text-obsidian">Authoritative Store Parameters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-ivory rounded-lg border border-sandstone">
            <span className="text-[10px] uppercase font-bold text-ink-500 block">Brand & Label</span>
            <span className="font-semibold text-obsidian text-sm">Ateevibes Apparels</span>
          </div>

          <div className="p-3 bg-ivory rounded-lg border border-sandstone">
            <span className="text-[10px] uppercase font-bold text-ink-500 block">Ateevibes Origin</span>
            <span className="font-semibold text-obsidian text-sm">Mumbai, Maharashtra, India</span>
          </div>

          <div className="p-3 bg-ivory rounded-lg border border-sandstone">
            <span className="text-[10px] uppercase font-bold text-ink-500 block">Free Shipping Threshold</span>
            <span className="font-semibold text-obsidian text-sm">₹1,499 (Flat ₹79 otherwise)</span>
          </div>

          <div className="p-3 bg-ivory rounded-lg border border-sandstone">
            <span className="text-[10px] uppercase font-bold text-ink-500 block">COD Handling Fee</span>
            <span className="font-semibold text-obsidian text-sm">₹49 (Across 25,000+ PIN Codes)</span>
          </div>

          <div className="p-3 bg-ivory rounded-lg border border-sandstone sm:col-span-2">
            <span className="text-[10px] uppercase font-bold text-ink-500 block">Return Policy Rule</span>
            <span className="font-semibold text-obsidian text-xs">
              Ateevibes batch production. Sales final upon delivery unless transit damage is verified within 48 hours. No 7-day return policy.
            </span>
          </div>
        </div>
      </div>

      {/* Staff Management */}
      <div className="p-6 rounded-2xl bg-white border border-sandstone shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-sandstone">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <h3 className="font-serif text-xl font-normal text-obsidian">Authorized Staff & Roles</h3>
          </div>
          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="btn-gold px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-ivory border-b border-sandstone text-ink-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 pl-3">Staff Name</th>
                <th className="py-3">Email</th>
                <th className="py-3">Role</th>
                <th className="py-3 pr-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sandstone/40">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-ivory/30">
                  <td className="py-3 pl-3 font-semibold text-obsidian">{s.name}</td>
                  <td className="py-3 text-ink-700 font-mono text-[11px]">{s.email}</td>
                  <td className="py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateStaff} className="bg-white rounded-2xl border border-sandstone shadow-luxury p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sandstone">
              <h3 className="font-serif text-xl font-normal text-obsidian">Add Authorized Staff</h3>
              <button type="button" onClick={() => setIsAddStaffOpen(false)} className="p-1 text-ink-500 hover:text-obsidian rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                Temporary Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1">
                Assigned Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory border border-sandstone rounded-lg focus:outline-none focus:border-gold"
              >
                <option value="ADMIN">Administrator</option>
                <option value="PRODUCT_MANAGER">Product Manager</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="FULFILMENT_STAFF">Fulfilment & Dispatch Staff</option>
                <option value="SUPPORT_STAFF">Customer Support Staff</option>
                <option value="ANALYST">Read-Only Analyst</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-sandstone">
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-sandstone/30 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gold px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Creating...' : 'Grant Access'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
