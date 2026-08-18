'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { UptimeBar } from '@/components/UptimeBar';
import {
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
  Check,
  Bell,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('statusenzin_token');
      if (token) {
        router.replace('/dashboard');
        return;
      }
    }
    setCheckingAuth(false);
  }, [router]);

  const demoSlug = process.env.NEXT_PUBLIC_DEMO_SLUG || 'acme';
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      annualPrice: '$0',
      period: 'forever',
      annualBilledAs: '',
      description: 'Essential uptime monitoring for developers & personal side projects.',
      features: [
        '5 High-frequency Monitors',
        '5-Minute Ping Interval',
        '1 Public Status Page',
        '90 Days History Retention',
        'Real-time Email Alerts',
      ],
      buttonText: 'Get Started Free',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$15',
      annualPrice: '$144',
      period: 'per month',
      annualBilledAs: '$12/mo billed annually',
      description: 'High-frequency pings & custom branding built for fast-moving tech teams.',
      features: [
        '25 High-frequency Monitors',
        '1-Minute Ping Interval',
        '3 Public Status Pages',
        '1 Year History Retention',
        'Real-time Email Alerts',
      ],
      buttonText: 'Get Started with Pro',
      href: '/signup?plan=pro',
      highlighted: true,
    },
    {
      name: 'Business',
      price: '$49',
      annualPrice: '$470',
      period: 'per month',
      annualBilledAs: '$39.16/mo billed annually',
      description: 'Ultra-low latency check frequency for enterprise apps.',
      features: [
        '100 High-frequency Monitors',
        '30-Second Ping Interval',
        '10 Public Status Pages',
        '2 Years History Retention',
        'Real-time Email Alerts',
        'Priority 24/7 SLA Support',
      ],
      buttonText: 'Deploy Business Plan',
      href: '/signup?plan=business',
      highlighted: false,
    },
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#30ff87] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between selection:bg-[#30ff87] selection:text-[#042713]">
      <Navbar />

      <main className="relative overflow-hidden">
        {/* Glow Mesh Background */}
        <div className="absolute inset-0 bg-vercel-mesh pointer-events-none opacity-80" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#30ff87]/10 blur-[120px] pointer-events-none rounded-full" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-5xl px-4 pt-20 pb-20 text-center sm:px-6 sm:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#30ff87]/30 bg-[#30ff87]/10 px-4 py-1.5 text-xs font-mono text-[#30ff87] backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(48,255,135,0.15)]">
            <span className="h-2 w-2 rounded-full bg-[#30ff87] animate-pulse shadow-[0_0_8px_#30ff87]" />
            <Sparkles className="h-3.5 w-3.5 text-[#30ff87]" />
            <span>StatusEnzin • Multi-Tenant Telemetry Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
            Real-Time Uptime Telemetry.{' '}
            <span className="bg-gradient-to-r from-white via-[#30ff87] to-[#65ffaa] bg-clip-text text-transparent">
              Unshakeable Trust.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-vercel-muted leading-relaxed font-normal">
            Execute 30-second multi-region checks for APIs, cloud services, and edge workers. Deliver blazingly fast, custom-branded public status pages that keep your users informed and build customer trust.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-[#30ff87] px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-[#00cc5e] shadow-[0_0_25px_rgba(48,255,135,0.35)] hover:shadow-[0_0_30px_rgba(0,204,94,0.4)]"
            >
              Start Monitoring Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/status/${demoSlug}`}
              className="inline-flex items-center gap-2 rounded-lg border border-vercel-border bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-900 hover:border-[#00cc5e]/50"
            >
              Explore Live Demo
            </Link>
          </div>

          {/* Interactive Live Status Widget Preview */}
          <div className="mt-16 text-left rounded-xl border border-vercel-border bg-neutral-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl hover:border-[#30ff87]/40 transition duration-300">
            <div className="flex flex-wrap items-center justify-between border-b border-vercel-border pb-4 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#30ff87]" />
                  <h3 className="font-mono text-sm font-bold text-white tracking-wide">Acme Cloud Production Services</h3>
                </div>
                <p className="text-xs text-vercel-muted mt-0.5">Live Telemetry Dashboard Preview • Sub-second Latency Edge</p>
              </div>
              <StatusBadge status="All Systems Operational" size="md" />
            </div>

            <div className="space-y-5">
              <div className="rounded-lg border border-neutral-900 bg-neutral-900/40 p-4 transition hover:bg-neutral-900/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">Global Edge API Gateway</span>
                    <span className="rounded bg-[#30ff87]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#30ff87] border border-[#30ff87]/20">HTTP/2</span>
                  </div>
                  <span className="font-mono text-xs text-[#30ff87]">14ms • 99.99% Uptime</span>
                </div>
                <UptimeBar />
              </div>

              <div className="rounded-lg border border-neutral-900 bg-neutral-900/40 p-4 transition hover:bg-neutral-900/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">Authentication & Identity Service</span>
                    <span className="rounded bg-[#30ff87]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#30ff87] border border-[#30ff87]/20">Active</span>
                  </div>
                  <span className="font-mono text-xs text-[#30ff87]">22ms • 100.0% Uptime</span>
                </div>
                <UptimeBar />
              </div>

              <div className="rounded-lg border border-neutral-900 bg-neutral-900/40 p-4 transition hover:bg-neutral-900/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">Primary PostgreSQL Cluster</span>
                    <span className="rounded bg-[#30ff87]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#30ff87] border border-[#30ff87]/20">Replica Sync</span>
                  </div>
                  <span className="font-mono text-xs text-[#30ff87]">8ms • 99.98% Uptime</span>
                </div>
                <UptimeBar />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: Engineered for Dev Teams */}
        <section className="border-t border-vercel-border bg-neutral-950/60 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Engineered for Dev Teams. Built for Scale.
              </h2>
              <p className="mt-4 text-vercel-muted text-base">
                From sub-minute ping intervals to instant incident timelines, StatusEnzin equips modern engineering orgs with enterprise operational transparency.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="vercel-card rounded-xl p-8 hover:border-[#00cc5e]/50 transition group">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#30ff87] group-hover:border-[#30ff87]/40 group-hover:shadow-[0_0_15px_rgba(48,255,135,0.2)] transition">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">30-Second Ping Engine</h3>
                <p className="mt-2.5 text-sm text-vercel-muted leading-relaxed">
                  Continuous multi-protocol checks across HTTP, HTTPS, and API endpoints with instant latency measuring and status code tracking.
                </p>
              </div>

              <div className="vercel-card rounded-xl p-8 hover:border-[#00cc5e]/50 transition group">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#30ff87] group-hover:border-[#30ff87]/40 group-hover:shadow-[0_0_15px_rgba(48,255,135,0.2)] transition">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Branded Status Pages</h3>
                <p className="mt-2.5 text-sm text-vercel-muted leading-relaxed">
                  Publish high-contrast public status pages with tenant logos, component grouping, and status banner customization.
                </p>
              </div>

              <div className="vercel-card rounded-xl p-8 hover:border-[#00cc5e]/50 transition group">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#30ff87] group-hover:border-[#30ff87]/40 group-hover:shadow-[0_0_15px_rgba(48,255,135,0.2)] transition">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Multi-Tenant Isolation</h3>
                <p className="mt-2.5 text-sm text-vercel-muted leading-relaxed">
                  Strict tenant data isolation via EF Core query filters ensures complete privacy, org boundaries, and zero data leakage.
                </p>
              </div>

              <div className="vercel-card rounded-xl p-8 hover:border-[#00cc5e]/50 transition group">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#30ff87] group-hover:border-[#30ff87]/40 group-hover:shadow-[0_0_15px_rgba(48,255,135,0.2)] transition">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Automated Incident Workflow</h3>
                <p className="mt-2.5 text-sm text-vercel-muted leading-relaxed">
                  Publish real-time incident updates, post-mortems, and system status overrides effortlessly to keep customers informed during outages.
                </p>
              </div>

              <div className="vercel-card rounded-xl p-8 hover:border-[#00cc5e]/50 transition group">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#30ff87] group-hover:border-[#30ff87]/40 group-hover:shadow-[0_0_15px_rgba(48,255,135,0.2)] transition">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Sub-Second Edge Telemetry</h3>
                <p className="mt-2.5 text-sm text-vercel-muted leading-relaxed">
                  Granular uptime metrics, historic response latency trends, and 90-day interactive status bars rendered with sub-second page loads.
                </p>
              </div>

              <div className="vercel-card rounded-xl p-8 hover:border-[#00cc5e]/50 transition group">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#30ff87] group-hover:border-[#30ff87]/40 group-hover:shadow-[0_0_15px_rgba(48,255,135,0.2)] transition">
                  <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Instant Alert Dispatch</h3>
                <p className="mt-2.5 text-sm text-vercel-muted leading-relaxed">
                  Receive instant notifications via email the moment an endpoint experiences degradation or total downtime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section (In Home Page right below Engineered for Dev Teams) */}
        <section id="pricing" className="border-t border-vercel-border bg-black py-24 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#30ff87]/30 bg-[#30ff87]/10 px-3 py-1 text-xs font-mono text-[#30ff87] mb-4">
                <span>Transparent Pricing</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Predictable plans for teams of any size
              </h2>
              <p className="mt-4 text-base sm:text-lg text-vercel-muted">
                Start with our generous free tier and upgrade as your monitoring infrastructure grows.
              </p>
            </div>

            {/* Monthly / Annual Billing Cycle Toggler */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
              <div className="inline-flex items-center rounded-lg bg-neutral-900 p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    billingCycle === 'monthly' ? 'bg-[#30ff87] text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`rounded px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    billingCycle === 'annual' ? 'bg-[#30ff87] text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Annual (-20%)
                </button>
              </div>
              <span className="text-xs font-mono text-[#30ff87]">Save 20% on Annual Plans</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col justify-between rounded-2xl border p-8 transition duration-300 ${plan.highlighted
                    ? 'border-[#30ff87] bg-neutral-950 shadow-[0_0_40px_rgba(48,255,135,0.15)] ring-1 ring-[#30ff87]/40'
                    : 'border-vercel-border bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#30ff87] px-3.5 py-1 text-[11px] font-bold text-black uppercase tracking-wider shadow-[0_0_10px_#30ff87]">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {plan.name}
                      {plan.highlighted && <Sparkles className="h-4 w-4 text-[#30ff87]" />}
                    </h3>
                    <p className="mt-2 text-xs text-vercel-muted h-10 leading-relaxed">{plan.description}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white tracking-tight">
                        {billingCycle === 'annual' ? plan.annualPrice : plan.price}
                      </span>
                      <span className="text-xs text-vercel-muted">
                        /{billingCycle === 'annual' && plan.name !== 'Starter' ? 'per year' : plan.period}
                      </span>
                    </div>
                    {billingCycle === 'annual' && plan.annualBilledAs && (
                      <p className="mt-1 text-xs font-mono text-[#30ff87]">{plan.annualBilledAs}</p>
                    )}

                    <ul className="mt-8 space-y-3.5 text-xs border-t border-vercel-border pt-6">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-3 text-vercel-text">
                          <Check className="h-4 w-4 text-[#30ff87] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={billingCycle === 'annual' ? `${plan.href}${plan.href.includes('?') ? '&' : '?'}cycle=annual` : plan.href}
                    className={`mt-8 w-full rounded-lg py-3 text-center text-xs font-semibold flex items-center justify-center gap-2 transition duration-200 ${plan.highlighted
                      ? 'bg-[#30ff87] text-black hover:bg-[#00cc5e] shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)]'
                      : 'bg-neutral-900 border border-vercel-border text-white hover:border-neutral-700 hover:bg-neutral-850'
                      }`}
                  >
                    {plan.buttonText}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conversion CTA Banner */}
        <section className="border-t border-vercel-border bg-neutral-950 py-20 relative overflow-hidden">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to elevate your infrastructure transparency?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-vercel-muted">
              Set up your first automated endpoint monitor and public status page in under 60 seconds.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-[#30ff87] px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-[#00cc5e] shadow-[0_0_20px_rgba(48,255,135,0.3)] hover:shadow-[0_0_25px_rgba(0,204,94,0.4)]"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
