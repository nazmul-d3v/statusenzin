import React from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const isOperational = status === 'Operational' || status === 'All Systems Operational';
  const isDegraded = status === 'Degraded' || status === 'Degraded Performance' || status === 'Monitoring';
  const isDown = status === 'Down' || status === 'Major Outage' || status === 'Critical';

  let colorClasses = 'bg-[#30ff87]/10 text-[#30ff87] border-[#30ff87]/30 shadow-[0_0_12px_rgba(48,255,135,0.15)]';
  let dotClasses = 'bg-[#30ff87] pulse-operational';
  let Icon = CheckCircle;

  if (isDegraded) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    dotClasses = 'bg-amber-500';
    Icon = AlertTriangle;
  } else if (isDown) {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    dotClasses = 'bg-rose-500';
    Icon = XCircle;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-2 text-base font-medium' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border ${colorClasses} ${sizeClasses} font-mono tracking-tight`}>
      <span className={`h-2 w-2 rounded-full ${dotClasses}`} />
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{status}</span>
    </span>
  );
};
