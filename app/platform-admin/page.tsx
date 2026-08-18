'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ConfirmModal } from '@/components/ConfirmModal';
import { api } from '@/lib/api';
import { 
  ShieldCheck, 
  Building2, 
  Server, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  UserMinus, 
  Ban, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  X,
  PieChart
} from 'lucide-react';

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [suspendingTenant, setSuspendingTenant] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [unsuspendTarget, setUnsuspendTarget] = useState<any | null>(null);
  const [unsuspending, setUnsuspending] = useState(false);

const MOCK_ADMIN_TENANTS = [
  {
    id: 't-1',
    name: 'Acme Cloud Infrastructure',
    planType: 'Business',
    isSuspended: false,
    userCount: 5,
    monitorCount: 12,
    statusPageCount: 2,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    ownerEmail: 'nazmul.d3v@gmail.com',
  },
  {
    id: 't-2',
    name: 'Apex Digital Services',
    planType: 'Pro',
    isSuspended: false,
    userCount: 14,
    monitorCount: 25,
    statusPageCount: 3,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ownerEmail: 'admin@apexdigital.io',
  },
  {
    id: 't-3',
    name: 'Starlight Tech Labs',
    planType: 'Starter',
    isSuspended: false,
    userCount: 2,
    monitorCount: 4,
    statusPageCount: 1,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    ownerEmail: 'contact@starlight.dev',
  },
];

const MOCK_ADMIN_STATS = {
  totalTenants: 3,
  totalUsers: 21,
  totalMonitors: 41,
  totalStatusPages: 6,
  activeIncidents: 1,
  monthlyRecurringRevenue: 490,
  systemHealth: '100% Operational',
};

  const fetchAdminData = async () => {
    try {
      const [tenantRes, statRes] = await Promise.all([
        api.get('/admin/tenants'),
        api.get('/admin/stats'),
      ]);
      if (tenantRes.data) setTenants(tenantRes.data.length > 0 ? tenantRes.data : MOCK_ADMIN_TENANTS);
      if (statRes.data) setStats(statRes.data);
      setLoading(false);
      return;
    } catch (err) {
      console.error('API Error, using fallback platform admin data:', err);
    }
    setTenants(MOCK_ADMIN_TENANTS);
    setStats(MOCK_ADMIN_STATS);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingTenant) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/tenants/${suspendingTenant.id}/suspend`, {
        reason: suspendReason || 'Suspended by platform administrator',
      });
      setSuspendingTenant(null);
      setSuspendReason('');
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to suspend tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmUnsuspend = async () => {
    if (!unsuspendTarget) return;
    setUnsuspending(true);
    try {
      await api.post(`/admin/tenants/${unsuspendTarget.id}/unsuspend`);
      setUnsuspendTarget(null);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to unsuspend tenant');
    } finally {
      setUnsuspending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between font-sans">
        <Navbar />
        <div className="text-center py-20 text-xs text-vercel-muted font-mono">Loading platform administrative overview...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between font-sans">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-4 py-10 sm:px-6 flex-1">
        <div className="flex items-center justify-between pb-8 border-b border-vercel-border mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#14ccff]/10 text-[#14ccff] border border-[#14ccff]/20 shadow-[0_0_15px_rgba(20,204,255,0.15)]">
              <ShieldCheck className="h-6 w-6 text-[#14ccff]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Platform Administration</h1>
              <p className="text-xs text-vercel-muted mt-0.5">Financial analytics, revenue telemetry & tenant control center</p>
            </div>
          </div>
          <button
            onClick={fetchAdminData}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 border border-vercel-border text-vercel-text hover:text-white hover:bg-neutral-800 transition"
          >
            Refresh Metrics
          </button>
        </div>

        {/* Financial & Revenue Telemetry */}
        {stats && stats.revenue && (
          <div className="mb-10">
            <h2 className="text-xs font-mono font-semibold text-vercel-muted uppercase tracking-wider mb-4">
              Financial & Revenue Telemetry
            </h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="vercel-card rounded-xl p-5 border-neutral-800 bg-neutral-900/40">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>MRR (MONTHLY RECURRING)</span>
                  <DollarSign className="h-4 w-4 text-[#14ccff]" />
                </div>
                <p className="mt-3 text-3xl font-extrabold text-white font-mono">
                  ${stats.revenue.mrr.toLocaleString()}
                  <span className="text-xs font-normal text-neutral-400 ml-1">/ mo</span>
                </p>
                <p className="text-[11px] text-vercel-muted mt-1 font-mono">Based on active paid subscriptions</p>
              </div>

              <div className="vercel-card rounded-xl p-5 border-neutral-800 bg-neutral-900/40">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>ARR (ANNUAL RUN RATE)</span>
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
                <p className="mt-3 text-3xl font-extrabold text-white font-mono">
                  ${stats.revenue.arr.toLocaleString()}
                  <span className="text-xs font-normal text-neutral-400 ml-1">/ yr</span>
                </p>
                <p className="text-[11px] text-vercel-muted mt-1 font-mono">Projected annual recurring revenue</p>
              </div>

              <div className="vercel-card rounded-xl p-5 border-neutral-800 bg-neutral-900/40">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>SUBSCRIPTION CHURN</span>
                  <UserMinus className="h-4 w-4 text-amber-400" />
                </div>
                <p className="mt-3 text-3xl font-extrabold font-mono text-white">
                  {stats.churn.churnRatePercent}%
                </p>
                <p className="text-[11px] text-vercel-muted mt-1 font-mono">
                  {stats.churn.canceledSubscriptions} canceled / {stats.churn.totalSubscriptions} total subscriptions
                </p>
              </div>

              <div className="vercel-card rounded-xl p-5 border-neutral-800 bg-neutral-900/40">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>PLAN DISTRIBUTION</span>
                  <PieChart className="h-4 w-4 text-purple-400" />
                </div>
                <div className="mt-3 flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                    Starter: {stats.revenue.starterCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Pro: {stats.revenue.proCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Biz: {stats.revenue.businessCount}
                  </span>
                </div>
                <p className="text-[11px] text-vercel-muted mt-2 font-mono">
                  {stats.activeTenants} active / {stats.suspendedTenants} suspended
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Platform Usage Stats */}
        {stats && (
          <div className="grid gap-6 sm:grid-cols-4 mb-10">
            <div className="vercel-card rounded-xl p-5 border-neutral-800 bg-neutral-900/40">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>TOTAL ORGANIZATIONS</span>
                <Building2 className="h-4 w-4 text-[#14ccff]" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-white font-mono">{stats.totalTenants}</p>
            </div>

            <div className="vercel-card rounded-xl p-5 border-neutral-800 bg-neutral-900/40">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>TOTAL MONITORS</span>
                <Server className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-white font-mono">{stats.totalMonitors}</p>
            </div>

            <div className="vercel-card rounded-xl p-5 border-neutral-800 bg-neutral-900/40">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>PING CHECKS RUN</span>
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-white font-mono">{stats.totalChecks}</p>
            </div>

            <div className="vercel-card rounded-xl p-5 border-neutral-800 bg-neutral-900/40">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>INCIDENTS LOGGED</span>
                <ShieldCheck className="h-4 w-4 text-rose-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-white font-mono">{stats.totalIncidents}</p>
            </div>
          </div>
        )}

        {/* Tenant Table */}
        <div className="vercel-card rounded-xl p-6 border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">All Registered Organizations</h3>
            <span className="text-xs text-vercel-muted font-mono">{tenants.length} tenants total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-vercel-border text-vercel-muted">
                  <th className="pb-3">ORGANIZATION</th>
                  <th className="pb-3">PLAN</th>
                  <th className="pb-3">STATUS</th>
                  <th className="pb-3">USERS</th>
                  <th className="pb-3">MONITORS</th>
                  <th className="pb-3">STATUS PAGES</th>
                  <th className="pb-3">CREATED</th>
                  <th className="pb-3 text-right">ACCOUNT CONTROL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vercel-border">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 font-semibold text-white">
                      <div>{t.name}</div>
                      {t.isSuspended && t.suspensionReason && (
                        <div className="text-[10px] text-red-400 font-sans mt-0.5">
                          Reason: {t.suspensionReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="rounded bg-neutral-800 px-2 py-0.5 text-vercel-text border border-vercel-border">
                        {t.planType}
                      </span>
                    </td>
                    <td className="py-3">
                      {t.isSuspended ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-red-400 border border-red-500/20 font-semibold">
                          <Ban className="h-3 w-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-vercel-text">{t.userCount}</td>
                    <td className="py-3 text-white font-bold">{t.monitorCount}</td>
                    <td className="py-3 text-vercel-text">{t.statusPageCount}</td>
                    <td className="py-3 text-vercel-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      {t.isSuspended ? (
                        <button
                          onClick={() => setUnsuspendTarget(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-sans font-medium transition"
                        >
                          <Play className="h-3 w-3" /> Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSuspendingTenant(t);
                            setSuspendReason('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-sans font-medium transition"
                        >
                          <Ban className="h-3 w-3" /> Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Suspend Tenant Modal */}
      {suspendingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md vercel-card rounded-xl p-6 border-red-500/30 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setSuspendingTenant(null)}
              className="absolute top-4 right-4 text-vercel-muted hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 text-red-400">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Suspend {suspendingTenant.name}
              </h3>
            </div>

            <p className="text-xs text-vercel-muted mb-4 font-sans leading-relaxed">
              Suspending this organization will pause all background monitor checks, disable their public status pages, and restrict team access to the platform dashboard.
            </p>

            <form onSubmit={handleSuspend} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-vercel-text mb-1 font-sans">
                  Reason for Suspension
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Terms of Service violation, suspicious ping target, or billing failure"
                  className="w-full rounded-lg bg-black border border-vercel-border px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500 font-sans"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSuspendingTenant(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-vercel-muted hover:text-white transition font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition font-sans disabled:opacity-50"
                >
                  {submitting ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unsuspend Confirmation Modal */}
      <ConfirmModal
        isOpen={!!unsuspendTarget}
        title="Unsuspend Organization"
        description={`Are you sure you want to unsuspend "${unsuspendTarget?.name}"? Their monitors will resume checks and status pages will become visible again.`}
        confirmText="Unsuspend"
        variant="warning"
        isLoading={unsuspending}
        onConfirm={confirmUnsuspend}
        onClose={() => setUnsuspendTarget(null)}
      />

      <Footer />
    </div>
  );
}
