'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data?.message || 'If an account exists for this email, a password reset link has been sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Forgot your password?</h1>
            <p className="mt-2 text-sm text-vercel-muted">Enter your email and we'll send you a link to reset it</p>
          </div>

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

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-vercel-muted mb-1">EMAIL ADDRESS</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-vercel-subtle" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="vercel-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="vercel-button-primary w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="vercel-button-primary w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  Back to Sign In
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-vercel-muted">
            Remembered your password?{' '}
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
