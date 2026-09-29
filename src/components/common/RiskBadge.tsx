import React from 'react';
import { RiskLevel, FindingSeverity } from '../../types';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel | FindingSeverity;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
}) => {
  const isHighOrCritical = level === 'High' || level === 'Critical';
  const isMedium = level === 'Medium';
  const isLow = level === 'Low';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  const colorStyles = isHighOrCritical
    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
    : isMedium
    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';

  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-md whitespace-nowrap tabular-nums ${sizeClasses} ${colorStyles}`}
    >
      {showIcon && (
        <>
          {isHighOrCritical && <ShieldAlert size={iconSize} className="shrink-0 text-rose-600 dark:text-rose-400" />}
          {isMedium && <AlertTriangle size={iconSize} className="shrink-0 text-amber-600 dark:text-amber-400" />}
          {isLow && <CheckCircle2 size={iconSize} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
        </>
      )}
      <span>{level}</span>
    </span>
  );
};
