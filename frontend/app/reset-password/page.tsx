'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Check } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(res.data?.message || 'Your password has been reset successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="vercel-card rounded-xl p-8 shadow-2xl text-center">
        <p className="text-sm text-vercel-muted">This password reset link is invalid or incomplete. Please request a new one.</p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#30ff87] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#00cc5e]"
        >
          Request a new link
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="vercel-card rounded-xl p-8 shadow-2xl">
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {success ? (
        <Link
          href="/login"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#30ff87] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#00cc5e]"
        >
          Sign in with your new password
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-vercel-muted mb-1">NEW PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-vercel-subtle" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="vercel-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
              />
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

          <div>
            <label className="block text-xs font-mono text-vercel-muted mb-1">CONFIRM NEW PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-vercel-subtle" />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="vercel-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="vercel-button-primary w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Set a New Password</h1>
            <p className="mt-2 text-sm text-vercel-muted">Choose a strong password for your account</p>
          </div>

          <Suspense fallback={
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#30ff87] border-t-transparent" />
              <p className="font-mono text-xs text-vercel-muted">Loading...</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
