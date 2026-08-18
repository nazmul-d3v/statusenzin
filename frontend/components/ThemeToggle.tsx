'use client';
import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('statusenzin_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('statusenzin_theme', nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-900/60 ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all duration-200 active:scale-95 shadow-sm ${
        theme === 'dark'
          ? 'border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white'
          : 'border-slate-300 bg-slate-100/90 text-slate-700 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          <span className="hidden sm:inline-block">Day</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-indigo-500 transition-transform duration-300 hover:-rotate-12" />
          <span className="hidden sm:inline-block">Night</span>
        </>
      )}
    </button>
  );
};
