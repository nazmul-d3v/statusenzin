'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, CreditCard, LayoutDashboard, Globe, LogOut, ShieldCheck, User as UserIcon, Settings, ChevronDown, Building } from 'lucide-react';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Navbar: React.FC = () => {
  const demoSlug = process.env.NEXT_PUBLIC_DEMO_SLUG || 'acme';
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('statusenzin_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [hasToken, setHasToken] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('statusenzin_token');
    }
    return false;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const tokenExists = typeof window !== 'undefined' && !!localStorage.getItem('statusenzin_token');
    setHasToken(tokenExists);

    if (!tokenExists) {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('statusenzin_user');
      }
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('statusenzin_user', JSON.stringify(res.data));
        }
      } catch (err) {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('statusenzin_user');
          localStorage.removeItem('statusenzin_token');
        }
        setHasToken(false);
      }
    };
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('statusenzin_token');
        localStorage.removeItem('statusenzin_user');
      }
      setUser(null);
      setHasToken(false);
      router.push('/login');
    }
  };

  const isStatusPage = pathname.startsWith('/status/');
  if (isStatusPage) return null;

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : (user?.email ? user.email[0].toUpperCase() : 'U');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-vercel-border bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href={user || hasToken ? '/dashboard' : '/'} className="flex items-center gap-3 font-bold tracking-tight text-white transition hover:opacity-90 py-1">
          <img
            src="/logo.png"
            alt="StatusEnzin Logo"
            className="h-10 sm:h-12 md:h-14 max-h-14 w-auto object-contain transition-transform duration-200 hover:scale-105"
          />
        </Link>
        {user ? (
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 text-sm font-medium transition px-2.5 py-1.5 rounded-lg ${pathname === '/dashboard' ? 'text-[#30ff87] bg-[#30ff87]/10 font-semibold' : 'text-vercel-muted hover:text-white hover:bg-neutral-900'
                }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Monitors
            </Link>
            <Link
              href="/dashboard/status-pages"
              className={`flex items-center gap-2 text-sm font-medium transition px-2.5 py-1.5 rounded-lg ${pathname === '/dashboard/status-pages' ? 'text-[#30ff87] bg-[#30ff87]/10 font-semibold' : 'text-vercel-muted hover:text-white hover:bg-neutral-900'
                }`}
            >
              <Globe className="h-4 w-4" />
              Status Pages
            </Link>
            <Link
              href="/dashboard/incidents"
              className={`flex items-center gap-2 text-sm font-medium transition px-2.5 py-1.5 rounded-lg ${pathname === '/dashboard/incidents' ? 'text-[#30ff87] bg-[#30ff87]/10 font-semibold' : 'text-vercel-muted hover:text-white hover:bg-neutral-900'
                }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Incidents
            </Link>
            <div className="ml-2 sm:ml-4 flex items-center gap-2 sm:gap-3 border-l border-vercel-border pl-3 sm:pl-4">
              <ThemeToggle />
              {/* Profile Avatar Button & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 p-1 sm:px-2.5 sm:py-1.5 text-xs font-medium text-white hover:border-neutral-700 hover:bg-neutral-800 transition active:scale-95 shadow-sm"
                  aria-expanded={dropdownOpen}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#30ff87] to-emerald-400 font-bold text-black text-xs shadow-inner">
                    {userInitials}
                  </div>
                  <span className="hidden md:inline-block max-w-[110px] truncate text-xs font-medium text-neutral-200">
                    {user.fullName || user.email}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-white' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 rounded-xl border border-neutral-800 bg-neutral-950/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User / Tenant Summary Header */}
                    <div className="px-3 py-2.5 border-b border-neutral-800/80 mb-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white truncate">{user.fullName || 'User Account'}</p>
                        <span className="rounded bg-[#30ff87]/10 border border-[#30ff87]/30 px-1.5 py-0.5 text-[10px] font-mono text-[#30ff87]">
                          {user.planType || 'Starter'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 bg-neutral-900/80 border border-neutral-800/60 rounded-md px-2 py-1">
                        <Building className="h-3 w-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{user.tenantName || 'Organization'}</span>
                      </div>
                    </div>

                    {/* Menu Navigation Links */}
                    <div className="space-y-0.5 py-1">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${pathname === '/dashboard/settings'
                            ? 'bg-[#30ff87]/10 text-[#30ff87] font-semibold'
                            : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                          }`}
                      >
                        <Settings className="h-4 w-4 text-neutral-400" />
                        <span>Profile & Settings</span>
                      </Link>

                      <Link
                        href="/dashboard/billing"
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${pathname === '/dashboard/billing'
                            ? 'bg-[#30ff87]/10 text-[#30ff87] font-semibold'
                            : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                          }`}
                      >
                        <CreditCard className="h-4 w-4 text-neutral-400" />
                        <span>Billing & Plans</span>
                      </Link>

                      {user.isPlatformAdmin && (
                        <Link
                          href="/platform-admin"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${pathname === '/platform-admin'
                              ? 'bg-[#14ccff]/10 text-[#14ccff] font-semibold'
                              : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                            }`}
                        >
                          <ShieldCheck className="h-4 w-4 text-[#14ccff]" />
                          <span>Platform Admin</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-neutral-800/80 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
                      >
                        <LogOut className="h-4 w-4 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>
        ) : hasToken ? (
          <nav className="flex items-center gap-3 sm:gap-6 opacity-0 pointer-events-none">
            {/* Invisible placeholder while validating session */}
            <div className="h-8 w-24 rounded bg-neutral-900" />
          </nav>
        ) : (
          <nav className="flex items-center gap-3 sm:gap-6">
            <ThemeToggle />
            <Link
              href={`/status/${demoSlug}`}
              className="rounded-full border border-white/15 bg-neutral-900/80 px-3.5 py-1.5 text-xs font-mono text-neutral-300 hover:text-[#30ff87] hover:border-[#30ff87]/50 hover:bg-neutral-900 transition flex items-center gap-2 backdrop-blur-sm"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#30ff87] animate-pulse" />
              Demo
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-white/5"
            >
              Log In
            </Link>
            <Link
              href="/login?role=admin"
              className="text-xs font-semibold text-[#14ccff] hover:text-white transition px-2.5 py-1.5 rounded-lg border border-[#14ccff]/30 bg-[#14ccff]/10 hover:bg-[#14ccff]/20 hover:border-[#14ccff]/60 flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#30ff87] px-5 py-2 text-sm font-bold text-black transition hover:bg-[#00cc5e] shadow-[0_0_20px_rgba(48,255,135,0.35)] hover:shadow-[0_0_25px_rgba(0,204,94,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};
