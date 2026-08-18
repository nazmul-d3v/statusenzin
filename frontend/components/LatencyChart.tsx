'use client';
import React from 'react';

interface CheckItem {
  responseTimeMs: number;
  checkedAt: string;
}

interface LatencyChartProps {
  checks: CheckItem[];
  height?: number;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ checks }) => {
  if (!checks || checks.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center border border-vercel-border rounded-lg bg-neutral-950 text-xs text-vercel-muted font-mono">
        No ping telemetry recorded yet
      </div>
    );
  }

  // Ensure items are ordered chronologically (oldest -> newest) for left-to-right trend line
  const sortedChecks = [...checks].sort(
    (a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime()
  );
  const items = sortedChecks.slice(-30);

  const maxMs = Math.max(...items.map((c) => c.responseTimeMs), 100);
  const minMs = Math.min(...items.map((c) => c.responseTimeMs));

  const points = items
    .map((item, index) => {
      const x = items.length === 1 ? 50 : (index / (items.length - 1)) * 100;
      const y = 100 - ((item.responseTimeMs - 0) / (maxMs * 1.2 || 1)) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-xs text-vercel-muted font-mono">
        <span>Recent Ping Latency (ms)</span>
        <div className="flex gap-3">
          <span>Min: {minMs}ms</span>
          <span>Peak: {maxMs}ms</span>
        </div>
      </div>
      <div className="relative w-full border border-vercel-border rounded-lg bg-neutral-950 p-3 overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-28 overflow-visible">
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#30ff87" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#30ff87" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Fill under graph line */}
          <polygon points={`0,100 ${points} 100,100`} fill="url(#latencyGradient)" />

          {/* Graph line */}
          <polyline
            fill="none"
            stroke="#30ff87"
            strokeWidth="2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
};
