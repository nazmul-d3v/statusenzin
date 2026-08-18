'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <footer className="w-full border-t border-vercel-border bg-black py-12 text-sm text-vercel-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          {logoError ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-[#30ff87] text-black text-sm font-black flex items-center justify-center shadow-[0_0_10px_rgba(48,255,135,0.3)]">
                SE
              </div>
              <span className="font-mono text-sm text-white">
                Status<span className="text-[#30ff87]">Enzin</span>
              </span>
            </div>
          ) : (
            <img
              src="/logo.png"
              alt="StatusEnzin Logo"
              className="h-8 sm:h-10 max-h-10 w-auto object-contain"
              onError={() => setLogoError(true)}
            />
          )}
          <span className="font-mono text-xs text-neutral-500">&copy; 2026</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs">
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};
