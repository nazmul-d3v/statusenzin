'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';
import { User, Lock, Building, CreditCard, Check, AlertCircle, Save, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SettingsDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const data = res.data;
      setUser(data);
      setFirstName(data.firstName || (data.fullName ? data.fullName.split(' ')[0] : ''));
      setLastName(data.lastName || (data.fullName && data.fullName.split(' ').length > 1 ? data.fullName.split(' ').slice(1).join(' ') : ''));
      setEmail(data.email || '');
      if (typeof window !== 'undefined') {
        localStorage.setItem('statusenzin_user', JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);

    try {
      const res = await api.put('/auth/profile', {
        firstName,
        lastName,
        email,
      });

      setUser(res.data);
      if (typeof window !== 'undefined') {
        localStorage.setItem('statusenzin_user', JSON.stringify(res.data));
      }
      setProfileMsg({ type: 'success', text: 'Profile information updated successfully!' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setProfileMsg({ type: 'error', text: errorMsg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordUpdating(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update password. Check your current password and try again.';
      setPasswordMsg({ type: 'error', text: errorMsg });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const passwordChecks = [
    { label: 'At least 8 characters long', valid: newPassword.length >= 8 },
    { label: 'At least 1 uppercase letter (A-Z)', valid: /[A-Z]/.test(newPassword) },
    { label: 'At least 1 lowercase letter (a-z)', valid: /[a-z]/.test(newPassword) },
    { label: 'At least 1 number (0-9)', valid: /[0-9]/.test(newPassword) },
    { label: 'At least 1 special character (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-20 text-xs text-vercel-muted">Loading account settings...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto max-w-5xl w-full px-4 py-10 sm:px-6 flex-1">
        {/* Header Title */}
        <div className="pb-8 border-b border-vercel-border mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-[#30ff87]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Account Settings</h1>
              <p className="text-xs text-vercel-muted mt-0.5">Manage your personal profile details, security credentials, and organization context</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Forms Section */}
          <div className="md:col-span-2 space-y-8">

            {/* Profile Info Form */}
            <div className="vercel-card rounded-xl p-6 sm:p-7 relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-neutral-800/80">
                <User className="h-5 w-5 text-[#30ff87]" />
                <div>
                  <h2 className="text-base font-semibold text-white">Personal Profile</h2>
                  <p className="text-xs text-vercel-muted">Update your display name and primary account email address</p>
                </div>
              </div>

              {profileMsg && (
                <div
                  className={`mb-6 p-4 rounded-lg text-xs flex items-center gap-3 border ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Jane"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#30ff87] focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#30ff87] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#30ff87] focus:outline-none transition"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="vercel-button-primary px-5 py-2.5 text-xs font-bold rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="vercel-card rounded-xl p-6 sm:p-7 relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-neutral-800/80">
                <Lock className="h-5 w-5 text-[#30ff87]" />
                <div>
                  <h2 className="text-base font-semibold text-white">Security & Password</h2>
                  <p className="text-xs text-vercel-muted">Change your current account password to maintain security</p>
                </div>
              </div>

              {passwordMsg && (
                <div
                  className={`mb-6 p-4 rounded-lg text-xs flex items-center gap-3 border ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#30ff87] focus:outline-none transition"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#30ff87] focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#30ff87] focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Password Requirements */}
                {newPassword.length > 0 && (
                  <div className="rounded-lg bg-neutral-950/80 border border-neutral-800 p-3.5 space-y-2">
                    <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Password Complexity Criteria</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {passwordChecks.map((chk, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              chk.valid ? 'bg-[#30ff87]' : 'bg-neutral-600'
                            }`}
                          />
                          <span className={chk.valid ? 'text-neutral-200' : 'text-neutral-500'}>
                            {chk.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="vercel-button-primary px-5 py-2.5 text-xs font-bold rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {passwordUpdating ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Sidebar Summary Card */}
          <div className="space-y-6">
            <div className="vercel-card rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                  <span className="text-xs font-mono text-vercel-muted uppercase tracking-wider">ORGANIZATION CONTEXT</span>
                  <Building className="h-4 w-4 text-neutral-400" />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 block uppercase">Organization Name</label>
                    <p className="text-base font-bold text-white mt-0.5">{user?.tenantName || 'My Organization'}</p>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 block uppercase">Subscription Plan</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="rounded-full bg-[#30ff87]/10 px-3 py-1 text-xs font-mono font-semibold text-[#30ff87] border border-[#30ff87]/30">
                        {user?.planType || 'Starter'} Plan
                      </span>
                    </div>
                  </div>

                  {user?.isPlatformAdmin && (
                    <div className="pt-2">
                      <div className="flex items-center gap-1.5 rounded-lg border border-[#14ccff]/30 bg-[#14ccff]/10 px-3 py-2 text-xs font-mono text-[#14ccff]">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Platform Super Admin</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-vercel-border mt-6">
                <Link
                  href="/dashboard/billing"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-4 py-2.5 text-xs font-medium text-white transition flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-neutral-400" />
                    Manage Billing & Plans
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="vercel-card rounded-xl p-5 text-xs text-vercel-muted space-y-2">
              <div className="flex items-center gap-2 font-medium text-white">
                <KeyRound className="h-4 w-4 text-[#30ff87]" />
                Security Tip
              </div>
              <p className="leading-relaxed">
                Always ensure your password uses a combination of letters, numbers, and special symbols to keep your monitoring environment protected.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
