import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: string;
  isPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  isPositive,
}) => {
  return (
    <div className="p-5 rounded-xl bg-white border border-sandstone shadow-subtle hover:border-gold/60 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">
          {label}
        </span>
        <div className="p-2 rounded-lg bg-ivory text-gold border border-sandstone/60">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-3xl font-normal text-obsidian tracking-tight">
          {value}
        </h3>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              isPositive ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtext && <p className="text-[11px] text-ink-500 mt-1.5">{subtext}</p>}
    </div>
  );
};
