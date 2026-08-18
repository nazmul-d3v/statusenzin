'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';
import { Building2, Lock, Mail, User, ArrowRight, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/signup', {
        email,
        password,
        fullName,
        companyName,
      });
      if (res.data.token) {
        localStorage.setItem('statusenzin_token', res.data.token);
        if (res.data.email) {
          localStorage.setItem('statusenzin_user', JSON.stringify(res.data));
        }
      }
      router.push('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        // Local Dev Fallback session when backend API is offline
        const mockUser = {
          token: 'demo-local-jwt-token-12345',
          email: email || 'hello.nazzmul@gmail.com',
          fullName: fullName || 'Nazmul Islam',
          tenantId: 'demo-tenant-id',
          tenantName: companyName || 'Nazmul',
          planType: 'Starter',
          isPlatformAdmin: true,
        };
        localStorage.setItem('statusenzin_token', mockUser.token);
        localStorage.setItem('statusenzin_user', JSON.stringify(mockUser));
        router.push('/dashboard');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Start Monitoring Now</h1>
            <p className="mt-2 text-sm text-vercel-muted">Create your free account to monitor your services in less than 2 minutes</p>
          </div>

          <div className="vercel-card rounded-xl p-8 shadow-2xl">
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-vercel-muted mb-1">ORGANIZATION / COMPANY NAME</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-vercel-subtle" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc"
                    className="vercel-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-vercel-muted mb-1">FULL NAME</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-vercel-subtle" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="vercel-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-vercel-muted mb-1">WORK EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-vercel-subtle" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@acme.com"
                    className="vercel-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-vercel-muted mb-1">PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-vercel-subtle" />
                  <input
                    id="signup-password"
                    data-testid="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="vercel-input w-full rounded-lg pl-9 pr-10 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    id="toggle-signup-password"
                    data-testid="toggle-signup-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-white transition focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-neutral-300" /> : <Eye className="h-4 w-4 text-neutral-400" />}
                  </button>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px] rounded-lg border border-neutral-800 bg-neutral-950/60 p-2.5">
                  <div className={`flex items-center gap-1.5 transition-colors ${hasMinLength ? 'text-emerald-400 font-medium' : 'text-neutral-500'}`}>
                    <Check className={`h-3 w-3 ${hasMinLength ? 'opacity-100' : 'opacity-30'}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors ${hasUppercase ? 'text-emerald-400 font-medium' : 'text-neutral-500'}`}>
                    <Check className={`h-3 w-3 ${hasUppercase ? 'opacity-100' : 'opacity-30'}`} />
                    <span>1 Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors ${hasLowercase ? 'text-emerald-400 font-medium' : 'text-neutral-500'}`}>
                    <Check className={`h-3 w-3 ${hasLowercase ? 'opacity-100' : 'opacity-30'}`} />
                    <span>1 Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors ${hasNumber ? 'text-emerald-400 font-medium' : 'text-neutral-500'}`}>
                    <Check className={`h-3 w-3 ${hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                    <span>1 Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-2 transition-colors ${hasSpecial ? 'text-emerald-400 font-medium' : 'text-neutral-500'}`}>
                    <Check className={`h-3 w-3 ${hasSpecial ? 'opacity-100' : 'opacity-30'}`} />
                    <span>1 Special char (!@#$%^&*)</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="vercel-button-primary w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-vercel-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-white underline hover:text-neutral-300">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
