'use client';
import React, { useState } from 'react';

interface CheckHistoryItem {
  isSuccess: boolean;
  responseTimeMs: number;
  checkedAt: string;
}

interface UptimeBarProps {
  checks?: CheckHistoryItem[];
  barsCount?: number;
  uptimePercentage?: number;
}

export type BarStatus = 'Operational' | 'Partial Outage' | 'Major Outage';

interface BarData {
  status: BarStatus;
  colorClass: string;
  badgeColorClass: string;
  date: string;
  uptime: string;
  avgLatency: number;
  totalChecks: number;
  isPlaceholder: boolean;
}

export const UptimeBar: React.FC<UptimeBarProps> = ({
  checks = [],
  barsCount = 90,
  uptimePercentage,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group real checks by local date string (YYYY-MM-DD)
  const checksByDate = new Map<string, CheckHistoryItem[]>();
  for (const check of checks) {
    if (!check.checkedAt) continue;
    const dateObj = new Date(check.checkedAt);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!checksByDate.has(dateKey)) {
      checksByDate.set(dateKey, []);
    }
    checksByDate.get(dateKey)!.push(check);
  }

  // Generate bars for past 90 days: i = 0 (barsCount - 1 days ago) -> i = barsCount - 1 (Today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bars: BarData[] = Array.from({ length: barsCount }).map((_, i) => {
    const dayOffset = (barsCount - 1) - i;
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - dayOffset);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const formattedDate = targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const dayChecks = checksByDate.get(dateKey);

    if (dayChecks && dayChecks.length > 0) {
      const totalChecks = dayChecks.length;
      const successCount = dayChecks.filter((c) => c.isSuccess).length;
      const successRate = successCount / totalChecks;
      const totalLatency = dayChecks.reduce((sum, c) => sum + c.responseTimeMs, 0);
      const avgLatency = Math.round(totalLatency / totalChecks);

      let status: BarStatus = 'Operational';
      let colorClass = 'bg-[#30ff87]/80 hover:bg-[#30ff87] hover:shadow-[0_0_10px_#30ff87]';
      let badgeColorClass = 'text-[#30ff87]';

      if (successRate < 0.5) {
        status = 'Major Outage';
        colorClass = 'bg-rose-500 hover:bg-rose-400 hover:shadow-[0_0_10px_#f43f5e]';
        badgeColorClass = 'text-rose-400';
      } else if (successRate < 1.0) {
        status = 'Partial Outage';
        colorClass = 'bg-amber-400 hover:bg-amber-300 hover:shadow-[0_0_10px_#fbbf24]';
        badgeColorClass = 'text-amber-400';
      }

      const uptimeStr = `${(successRate * 100).toFixed(1)}%`;

      return {
        status,
        colorClass,
        badgeColorClass,
        date: formattedDate,
        uptime: uptimeStr,
        avgLatency,
        totalChecks,
        isPlaceholder: false,
      };
    }

    // Historical fallback if no checks exist for that calendar day
    return {
      status: 'Operational',
      colorClass: 'bg-[#30ff87]/70 hover:bg-[#30ff87] hover:shadow-[0_0_8px_#30ff87]',
      badgeColorClass: 'text-[#30ff87]',
      date: formattedDate,
      uptime: '100%',
      avgLatency: 20,
      totalChecks: 0,
      isPlaceholder: true,
    };
  });

  const displayUptime =
    uptimePercentage !== undefined
      ? `${uptimePercentage.toFixed(2)}% uptime`
      : '100.00% uptime';

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-vercel-muted">
        <span>{barsCount} days ago</span>
        <span className="text-[#30ff87] font-mono font-medium drop-shadow-[0_0_6px_rgba(48,255,135,0.3)]">
          {displayUptime}
        </span>
        <span>Today</span>
      </div>

      <div className="relative flex items-center gap-1 h-8 w-full">
        {bars.map((bar, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`h-full flex-1 rounded-sm cursor-pointer transition-all duration-150 ${bar.colorClass} hover:scale-y-110`}
          />
        ))}

        {hoveredIndex !== null && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 bg-neutral-900/95 border border-vercel-border rounded-lg shadow-2xl text-xs whitespace-nowrap backdrop-blur-md">
            <p className="font-semibold text-white mb-1">{bars[hoveredIndex].date}</p>
            <div className="space-y-0.5 font-mono text-[11px]">
              <p className="flex items-center gap-1.5">
                <span className="text-vercel-muted">Status:</span>
                <span className={`font-bold ${bars[hoveredIndex].badgeColorClass}`}>
                  {bars[hoveredIndex].status}
                </span>
              </p>
              <p className="text-vercel-muted">
                Daily Uptime:{' '}
                <span className="text-white font-medium">{bars[hoveredIndex].uptime}</span>
              </p>
              {bars[hoveredIndex].isPlaceholder ? (
                <p className="text-vercel-subtle text-[10px] italic">No outages recorded (Historical)</p>
              ) : (
                <p className="text-vercel-muted">
                  Avg Latency:{' '}
                  <span className="text-white font-medium">{bars[hoveredIndex].avgLatency} ms</span>{' '}
                  <span className="text-vercel-subtle text-[10px]">({bars[hoveredIndex].totalChecks} checks)</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
