import React from 'react';

interface RevenueChartProps {
  data?: { date: string; revenue: number }[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartData = data && data.length > 0 ? data : [
    { date: 'Mon', revenue: 14200 },
    { date: 'Tue', revenue: 19800 },
    { date: 'Wed', revenue: 16400 },
    { date: 'Thu', revenue: 24500 },
    { date: 'Fri', revenue: 31200 },
    { date: 'Sat', revenue: 42800 },
    { date: 'Sun', revenue: 38900 },
  ];

  const maxVal = Math.max(...chartData.map((d) => d.revenue));

  return (
    <div className="p-6 rounded-xl bg-white border border-sandstone shadow-subtle">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-serif text-xl font-normal text-obsidian">Weekly Revenue Cadence</h3>
          <p className="text-xs text-ink-600">Authoritative net sales in INR across all order channels</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
          Last 7 Days
        </span>
      </div>

      {/* SVG Bar Chart */}
      <div className="h-64 flex items-end gap-3 sm:gap-6 pt-4 pb-2 border-b border-sandstone/60">
        {chartData.map((d, i) => {
          const heightPercent = Math.round((d.revenue / maxVal) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-obsidian text-ivory text-[10px] font-bold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-10 border border-gold/40">
                ₹{d.revenue.toLocaleString('en-IN')}
              </div>

              {/* Bar */}
              <div
                className="w-full max-w-[42px] bg-obsidian group-hover:bg-gold rounded-t transition-colors duration-200"
                style={{ height: `${heightPercent}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between items-center pt-3 text-xs text-ink-600 font-medium">
        {chartData.map((d, i) => (
          <span key={i} className="flex-1 text-center">
            {d.date}
          </span>
        ))}
      </div>
    </div>
  );
};
