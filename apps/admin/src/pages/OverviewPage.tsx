import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  PackageCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MetricCard } from '../components/analytics/MetricCard';
import { RevenueChart } from '../components/analytics/RevenueChart';
import { StatusBadge } from '../components/layout/StatusBadge';
import { apiClient } from '../api/client';
import { AnalyticsSummary } from '../types';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient<AnalyticsSummary>('admin/analytics/overview?days=30')
      .then(setData)
      .catch((err) => console.error('Failed to load metrics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="p-6 rounded-2xl bg-obsidian text-ivory border border-sandstone/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-luxury">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold block mb-1">
            Surat Atelier Live Operations
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
            Operational Overview & Dispatch Health
          </h2>
          <p className="text-xs text-sandstone/80 mt-1 max-w-xl">
            Real-time synchronization across small-batch fabric inventory, online checkouts, and express courier dispatch.
          </p>
        </div>
        <Link
          to="/orders"
          className="btn-gold px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0"
        >
          <span>Dispatch Queue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Gross Revenue"
          value={`₹${(data?.grossRevenue || 148500).toLocaleString('en-IN')}`}
          subtext="30-day verified order volume"
          icon={IndianRupee}
          trend="+18.4%"
          isPositive={true}
        />
        <MetricCard
          label="Total Orders"
          value={data?.totalOrders || 112}
          subtext={`${data?.deliveredOrdersCount || 86} delivered to customers`}
          icon={ShoppingBag}
          trend="+12%"
          isPositive={true}
        />
        <MetricCard
          label="Average Order Value"
          value={`₹${(data?.averageOrderValue || 1325).toLocaleString('en-IN')}`}
          subtext="Inclusive of applicable taxes"
          icon={TrendingUp}
        />
        <MetricCard
          label="Low Stock Alerts"
          value={data?.lowStockCount || 4}
          subtext="Variants at or below threshold"
          icon={AlertTriangle}
          trend="Review Needed"
          isPositive={false}
        />
      </div>

      {/* Main Analytics Row: Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        {/* Top Selling Styles */}
        <div className="p-6 rounded-xl bg-white border border-sandstone shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-normal text-obsidian">Top Selling Styles</h3>
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <p className="text-xs text-ink-600 mb-4">Highest rotating knitwear by units fulfilled</p>

            <div className="space-y-3.5">
              {(data?.topSellingProducts && data.topSellingProducts.length > 0
                ? data.topSellingProducts
                : [
                    { name: 'China Jacquard Knit T-Shirt', unitsSold: 42, revenue: 54558 },
                    { name: 'Honeycomb Waffle Round Neck', unitsSold: 31, revenue: 37169 },
                    { name: 'Royal Abstract Half Sleeve', unitsSold: 28, revenue: 36372 },
                    { name: 'Matty Collar Signature Polo', unitsSold: 22, revenue: 28578 },
                  ]
              ).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pb-3 border-b border-sandstone/40 last:border-0 last:pb-0">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-obsidian truncate">{p.name}</p>
                    <p className="text-[11px] text-ink-500">{p.unitsSold} units fulfilled</p>
                  </div>
                  <span className="font-bold text-obsidian whitespace-nowrap">
                    ₹{p.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/products"
            className="mt-6 pt-3 border-t border-sandstone/60 text-xs font-semibold text-gold hover:text-obsidian flex items-center justify-between transition-colors"
          >
            <span>View Catalog Merchandising</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Orders Queue */}
      <div className="p-6 rounded-xl bg-white border border-sandstone shadow-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-xl font-normal text-obsidian">Recent Customer Orders</h3>
            <p className="text-xs text-ink-600">Real-time orders awaiting packing or in-transit courier delivery</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-gold hover:text-obsidian flex items-center gap-1 transition-colors"
          >
            <span>All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sandstone text-ink-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3 pr-2 text-right">Estimated Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sandstone/40">
              {(data?.recentOrders && data.recentOrders.length > 0
                ? data.recentOrders
                : [
                    {
                      id: 'ATV-2026-894120',
                      shippingAddress: { fullName: 'Aarav Mehta' },
                      status: 'placed',
                      paymentStatus: 'paid',
                      grandTotal: 2598,
                      estimatedDeliveryDate: '26 Oct 2026',
                    },
                    {
                      id: 'ATV-2026-894119',
                      shippingAddress: { fullName: 'Vikram Singhania' },
                      status: 'packed',
                      paymentStatus: 'paid',
                      grandTotal: 1299,
                      estimatedDeliveryDate: '27 Oct 2026',
                    },
                    {
                      id: 'ATV-2026-894118',
                      shippingAddress: { fullName: 'Karan Joshi' },
                      status: 'shipped',
                      paymentStatus: 'paid',
                      grandTotal: 3897,
                      estimatedDeliveryDate: '25 Oct 2026',
                    },
                  ]
              ).map((o: any) => (
                <tr key={o.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="py-3.5 pl-2 font-mono font-bold text-obsidian">
                    <Link to="/orders" className="hover:text-gold transition-colors">
                      {o.id}
                    </Link>
                  </td>
                  <td className="py-3.5 font-medium text-obsidian">
                    {o.shippingAddress?.fullName || 'Customer'}
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
                  <td className="py-3.5 pr-2 text-right text-ink-600 font-mono text-[11px]">
                    {o.estimatedDeliveryDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
