'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('statusenzin_token') : null;
      if (!token) {
        if (isMounted) {
          setAuthorized(false);
          setLoading(false);
          router.replace('/login');
        }
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data?.isPlatformAdmin) {
          if (isMounted) {
            setAuthorized(true);
            setLoading(false);
          }
        } else {
          // Logged in but not platform admin
          if (isMounted) {
            setAuthorized(false);
            setLoading(false);
            router.replace('/dashboard');
          }
        }
      } catch (err: any) {
        if (err.response && err.response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('statusenzin_token');
            localStorage.removeItem('statusenzin_user');
          }
          if (isMounted) {
            setAuthorized(false);
            setLoading(false);
            router.replace('/login');
          }
        } else {
          // Backend API offline / dev mode: Check saved user privileges
          const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('statusenzin_user') : null;
          let isAdmin = true;
          if (savedUserStr) {
            try {
              const parsed = JSON.parse(savedUserStr);
              if (parsed.isPlatformAdmin === false) isAdmin = false;
            } catch (e) {}
          }
          if (isMounted) {
            setAuthorized(isAdmin);
            setLoading(false);
            if (!isAdmin) router.replace('/dashboard');
          }
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-vercel-text flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14ccff] border-t-transparent" />
          <p className="font-mono text-xs text-vercel-muted">Verifying platform administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
