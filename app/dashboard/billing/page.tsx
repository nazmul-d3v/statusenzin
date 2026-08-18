'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api';
import {
  CreditCard,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowRight,
  Building2,
} from 'lucide-react';

type SubscriptionInfo = {
  planType: string;
  billingCycle: string;
  status: string;
  currentPeriodEnd: string | null;
  pendingPlanType: string | null;
  pendingDowngradeAt: string | null;
  usage?: {
    monitorsUsed: number;
    monitorsLimit: number;
    statusPagesUsed: number;
    statusPagesLimit: number;
  };
};

const PLAN_FEATURES: Record<string, string[]> = {
  Pro: [
    '25 High-frequency Monitors',
    '1-Minute Ping Interval',
    '3 Public Status Pages',
    '1 Year History Retention',
    'Instant Real-time Email Alerts',
  ],
  Business: [
    '100 High-frequency Monitors',
    '30-Second Ping Interval',
    '10 Public Status Pages',
    '2 Years History Retention',
    'Priority 24/7 SLA Support',
  ],
};

export default function BillingDashboard() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');

  const fetchSubscription = () => {
    api
      .get('/billing/subscription')
      .then((res) => {
        setSub(res.data);
        if (res.data?.billingCycle === 'annual') setCycle('annual');
      })
      .catch(() => setSub(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleOpenPortal = async () => {
    setPortalBusy(true);
    setPortalError('');
    try {
      const res = await api.post('/billing/portal');
      const url = res.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        setPortalError('Could not open the billing portal. Please try again.');
      }
    } catch (err: any) {
      setPortalError(err.response?.data?.message || 'Could not open the billing portal.');
    } finally {
      setPortalBusy(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusColor =
    sub?.status === 'active'
      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
      : sub?.status === 'past_due'
        ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
        : 'text-rose-400 border-rose-500/20 bg-rose-500/10';

  const currentPlan = sub?.planType ?? 'Starter';

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-4 py-10 sm:px-6 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-vercel-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Billing &amp; Plans</h1>
            <p className="text-sm text-vercel-muted mt-1.5">Manage your subscription, payment method, and upgrades</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSubscription}
              className="vercel-button-secondary rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition hover:bg-neutral-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={handleOpenPortal}
              disabled={portalBusy}
              className="vercel-button-primary rounded-lg px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-4 w-4" />
              {portalBusy ? 'Opening...' : 'Manage Billing'}
            </button>
          </div>
        </div>

        {portalError && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{portalError}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-xs text-vercel-muted">Loading billing information...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 items-start mt-8">
            {/* Current Plan Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="vercel-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-vercel-muted uppercase tracking-wider">CURRENT SUBSCRIPTION</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase ${statusColor}`}>
                    {sub?.status ?? 'n/a'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight capitalize">{currentPlan}</h2>
                  <span className="text-xs font-mono text-[#30ff87] capitalize">{sub?.billingCycle ?? 'monthly'}</span>
                </div>

                <dl className="mt-6 space-y-3 text-xs font-mono text-vercel-muted border-t border-vercel-border pt-5">
                  <div className="flex justify-between">
                    <dt>Next Renewal / Period End</dt>
                    <dd className="text-white">{formatDate(sub?.currentPeriodEnd)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Renewal Method</dt>
                    <dd className="text-white">Automatic (Stripe)</dd>
                  </div>
                  {sub?.pendingPlanType && (
                    <div className="flex justify-between text-amber-400">
                      <dt>Pending Downgrade</dt>
                      <dd>
                        {sub.pendingPlanType} ({formatDate(sub.pendingDowngradeAt)})
                      </dd>
                    </div>
                  )}
                </dl>

                {sub?.usage && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-neutral-900/70 border border-vercel-border p-3">
                      <p className="text-[10px] font-mono text-vercel-muted">MONITORS</p>
                      <p className="text-lg font-bold text-white mt-1">
                        {sub.usage.monitorsUsed}
                        <span className="text-xs text-vercel-muted font-mono"> / {sub.usage.monitorsLimit}</span>
                      </p>
                    </div>
                    <div className="rounded-lg bg-neutral-900/70 border border-vercel-border p-3">
                      <p className="text-[10px] font-mono text-vercel-muted">STATUS PAGES</p>
                      <p className="text-lg font-bold text-white mt-1">
                        {sub.usage.statusPagesUsed}
                        <span className="text-xs text-vercel-muted font-mono"> / {sub.usage.statusPagesLimit}</span>
                      </p>
                    </div>
                  </div>
                )}

                <p className="mt-5 text-[11px] text-vercel-muted leading-relaxed flex items-start gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#30ff87]" />
                  Use <span className="text-white">Manage Billing</span> to update your card, download invoices, or
                  cancel — it opens Stripe's secure billing portal.
                </p>
              </div>
            </div>

            {/* Plan Options */}
            <div className="lg:col-span-7 space-y-6">
              <div className="vercel-card rounded-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-white">Upgrade or change plan</h3>
                    <p className="text-xs text-vercel-muted mt-1">Save 20% on annual plans. Upgrades apply instantly.</p>
                  </div>
                  <div className="flex items-center rounded-lg bg-neutral-900 p-1 border border-vercel-border">
                    <button
                      onClick={() => setCycle('monthly')}
                      className={`rounded px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                        cycle === 'monthly' ? 'bg-[#30ff87] text-black font-bold' : 'text-vercel-muted'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setCycle('annual')}
                      className={`rounded px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                        cycle === 'annual' ? 'bg-[#30ff87] text-black font-bold' : 'text-vercel-muted'
                      }`}
                    >
                      Annual (-20%)
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {(['Pro', 'Business'] as const).map((plan) => {
                    const isCurrent = plan === currentPlan;
                    const isDowngrade =
                      (currentPlan === 'Business' && plan === 'Pro') ||
                      (currentPlan !== 'Starter' && plan === 'Pro');
                    const checkoutHref = `/checkout?plan=${plan.toLowerCase()}&cycle=${cycle}`;
                    return (
                      <div
                        key={plan}
                        className={`rounded-xl border p-5 transition ${
                          isCurrent
                            ? 'border-[#30ff87]/40 bg-[#30ff87]/5'
                            : 'border-vercel-border bg-neutral-950/60 hover:border-neutral-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-lg font-bold text-white">{plan}</h4>
                          {isCurrent && (
                            <span className="rounded-full border border-[#30ff87]/30 bg-[#30ff87]/10 px-2 py-0.5 text-[10px] font-mono text-[#30ff87]">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-vercel-muted mb-4">
                          {cycle === 'annual' ? 'Billed annually' : 'Billed monthly'} · see live price at checkout
                        </p>
                        <ul className="space-y-2 text-xs text-neutral-300 mb-5">
                          {PLAN_FEATURES[plan].map((feat) => (
                            <li key={feat} className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-[#30ff87] shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                        {isDowngrade ? (
                          <span className="block w-full text-center rounded-lg border border-vercel-border px-4 py-2.5 text-xs font-semibold text-vercel-muted cursor-not-allowed">
                            Downgrade scheduled from current plan
                          </span>
                        ) : isCurrent ? (
                          <span className="block w-full text-center rounded-lg border border-vercel-border px-4 py-2.5 text-xs font-semibold text-vercel-muted cursor-not-allowed">
                            You are on this plan
                          </span>
                        ) : (
                          <Link
                            href={checkoutHref}
                            className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#30ff87] px-4 py-2.5 text-xs font-bold text-black hover:bg-[#00cc5e] transition shadow-[0_0_15px_rgba(48,255,135,0.25)]"
                          >
                            Upgrade
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-lg bg-neutral-900/50 border border-vercel-border p-3 flex items-center gap-2 text-[11px] text-vercel-muted">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#30ff87]" />
                  <span>
                    Promo codes: <span className="font-mono text-white">SAVE20</span>,{' '}
                    <span className="font-mono text-white">WELCOME20</span> (20%),{' '}
                    <span className="font-mono text-white">PROMO10</span> (10%),{' '}
                    <span className="font-mono text-white">HALFPRICE</span> (50%). Apply at checkout.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
