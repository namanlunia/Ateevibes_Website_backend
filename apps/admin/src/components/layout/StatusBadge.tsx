import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'stock';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  const normalized = status.toLowerCase();

  // Order statuses
  if (type === 'order') {
    switch (normalized) {
      case 'placed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ivory border border-sandstone text-obsidian">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Placed
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ivory border border-sandstone text-obsidian">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Packed
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ivory border border-sandstone text-obsidian">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            In Transit
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-obsidian text-ivory border border-gold/40">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Out for Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ivory border border-sandstone text-obsidian">
            <span className="w-1.5 h-1.5 rounded-full bg-obsidian" />
            Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 border border-red-200 text-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Cancelled
          </span>
        );
    }
  }

  // Payment statuses
  if (type === 'payment') {
    switch (normalized) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30">
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sandstone/30 text-ink-700 border border-sandstone">
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            Failed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sandstone/30 text-ink-600 border border-sandstone">
            Refunded
          </span>
        );
    }
  }

  // Stock statuses
  if (type === 'stock') {
    if (normalized === 'out_of_stock' || normalized === '0') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
          Out of Stock
        </span>
      );
    }
    if (normalized === 'low_stock') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-ivory text-obsidian border border-sandstone">
        In Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-ivory text-obsidian border border-sandstone">
      {status}
    </span>
  );
};
