'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { UptimeBar } from '@/components/UptimeBar';
import { api, PublicStatusData, IncidentItem, IncidentUpdateItem } from '@/lib/api';
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Check, Clock, ChevronDown, ChevronUp, AlertCircle, Radio } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const getImpactBadge = (impact: string) => {
  switch (impact?.toLowerCase()) {
    case 'critical':
      return <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold font-mono text-rose-400 border border-rose-500/30 uppercase tracking-wider">Critical Impact</span>;
    case 'major':
      return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold font-mono text-amber-400 border border-amber-500/30 uppercase tracking-wider">Major Impact</span>;
    case 'degraded':
      return <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold font-mono text-blue-400 border border-blue-500/30 uppercase tracking-wider">Degraded Performance</span>;
    case 'minor':
    default:
      return <span className="rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-bold font-mono text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">Minor Impact</span>;
  }
};

const getStageBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'investigating':
      return <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1.5"><Radio className="h-3 w-3 animate-pulse" /> Investigating</span>;
    case 'identified':
      return <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/30 flex items-center gap-1.5"><Radio className="h-3 w-3" /> Identified</span>;
    case 'monitoring':
      return <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/30 flex items-center gap-1.5"><Radio className="h-3 w-3" /> Monitoring</span>;
    case 'resolved':
    default:
      return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><Check className="h-3 w-3" /> Resolved</span>;
  }
};

const DEMO_FALLBACK_DATA: PublicStatusData = {
  id: 'demo-acme-status-page',
  name: 'Acme Global Infrastructure',
  slug: 'acme',
  description: 'Real-time operational status, system metrics, and incident reports for Acme Cloud Platform services.',
  tenantName: 'Acme Cloud Inc.',
  globalStatus: 'Operational',
  isPrivate: false,
  monitors: [
    {
      id: 'm-1',
      name: 'Core API Gateway',
      url: 'https://httpbin.org/status/200',
      status: 'Operational',
      checkIntervalSeconds: 30,
      checks: Array.from({ length: 90 }, (_, i) => ({
        id: `c-1-${i}`,
        monitorId: 'm-1',
        checkedAt: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString(),
        isUp: i !== 14 && i !== 52,
        statusCode: i === 14 ? 502 : i === 52 ? 503 : 200,
        latencyMs: 35 + ((i * 13) % 45),
        errorMessage: i === 14 ? '502 Bad Gateway' : i === 52 ? '503 Service Unavailable' : null,
        uptimePercentage: 99.8,
      })),
    },
    {
      id: 'm-2',
      name: 'Auth & Identity Service (OAuth2)',
      url: 'https://httpbin.org/anything',
      status: 'Operational',
      checkIntervalSeconds: 30,
      checks: Array.from({ length: 90 }, (_, i) => ({
        id: `c-2-${i}`,
        monitorId: 'm-2',
        checkedAt: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString(),
        isUp: true,
        statusCode: 200,
        latencyMs: 22 + ((i * 7) % 30),
        errorMessage: null,
        uptimePercentage: 100.0,
      })),
    },
    {
      id: 'm-3',
      name: 'CDN & Global Edge Cache',
      url: 'https://httpbin.org/ip',
      status: 'Operational',
      checkIntervalSeconds: 30,
      checks: Array.from({ length: 90 }, (_, i) => ({
        id: `c-3-${i}`,
        monitorId: 'm-3',
        checkedAt: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString(),
        isUp: i !== 78,
        statusCode: i === 78 ? 504 : 200,
        latencyMs: 18 + ((i * 9) % 25),
        errorMessage: i === 78 ? '504 Gateway Timeout' : null,
        uptimePercentage: 99.9,
      })),
    },
    {
      id: 'm-4',
      name: 'Database Cluster (US-East)',
      url: 'https://httpbin.org/status/200',
      status: 'Operational',
      checkIntervalSeconds: 60,
      checks: Array.from({ length: 90 }, (_, i) => ({
        id: `c-4-${i}`,
        monitorId: 'm-4',
        checkedAt: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString(),
        isUp: true,
        statusCode: 200,
        latencyMs: 12 + ((i * 4) % 18),
        errorMessage: null,
        uptimePercentage: 100.0,
      })),
    },
  ],
  incidents: [
    {
      id: 'inc-1',
      title: 'Scheduled Database Maintenance & Index Optimization',
      status: 'Resolved',
      impact: 'Minor',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      updates: [
        {
          id: 'u-1',
          incidentId: 'inc-1',
          status: 'Resolved',
          message: 'Maintenance completed successfully. Database performance and query latencies have restored to normal operational parameters.',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        },
        {
          id: 'u-2',
          incidentId: 'inc-1',
          status: 'Monitoring',
          message: 'Index rebuild finished. Monitoring replica lag and connection pooling metrics.',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
        },
        {
          id: 'u-3',
          incidentId: 'inc-1',
          status: 'Investigating',
          message: 'Initiated routine database maintenance window. Brief intermittent latency spikes may occur for US-East region queries.',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  ],
};

export default function PublicStatusPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<PublicStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Date range filter for incident history
  const [historyRangeDays, setHistoryRangeDays] = useState<number>(90);

  const fetchPublicData = async () => {
    if (!slug) return;
    try {
      const res = await api.get(`/status-pages/public/${slug}`);
      if (res.data) {
        setData(res.data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('API call error for public status page, checking fallback:', err);
    }
    if (slug === 'acme' || !data) {
      setData(DEMO_FALLBACK_DATA);
    }
    setLoading(false);
  };


  useEffect(() => {
    fetchPublicData();
    const pollIntervalMs = Number(process.env.NEXT_PUBLIC_STATUS_PAGE_POLL_INTERVAL_MS) || 20000;
    const interval = setInterval(() => {
      fetchPublicData();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [slug]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.id) return;
    setSubmitting(true);
    setSubscribeMessage('');

    try {
      const res = await api.post('/subscribers', {
        statusPageId: data.id,
        email,
      });
      setSubscribeMessage(res.data?.message || 'Subscription request submitted! Check your email to confirm.');
      setEmail('');
    } catch (err: any) {
      setSubscribeMessage(err.response?.data?.message || 'Failed to subscribe.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-vercel-text flex items-center justify-center font-mono text-xs">
        Loading system status...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-vercel-text flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Status Page Not Found</h1>
        <p className="text-xs text-vercel-muted max-w-sm">The status page you are trying to access does not exist or has been set to private.</p>
      </div>
    );
  }

  const isAllGood = data.globalStatus === 'Operational';

  // Separate active incidents (ongoing) from past resolved incidents
  const activeIncidents = data.incidents.filter((inc) => inc.status !== 'Resolved');
  
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - historyRangeDays * 24 * 60 * 60 * 1000);
  const pastIncidents = data.incidents.filter((inc) => inc.status === 'Resolved' && new Date(inc.createdAt) >= cutoffDate);

  return (
    <div className="min-h-screen bg-black text-vercel-text">
      {/* Mesh Glow Background */}
      <div className="absolute inset-0 bg-vercel-mesh pointer-events-none opacity-40 h-96" />

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Header Branding */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-vercel-border pb-8 mb-8">
          <div>
            <span className="text-xs font-mono text-vercel-muted uppercase tracking-wider">{data.tenantName}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5">{data.name}</h1>
            {data.description && <p className="text-xs text-vercel-muted mt-1 max-w-lg">{data.description}</p>}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setShowSubscribeModal(true)}
              className="vercel-button-primary rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.2)]"
            >
              <Bell className="h-4 w-4" />
              Get Incident Updates
            </button>
          </div>
        </div>

        {/* Global Operational Status Banner */}
        <div
          className={`rounded-xl p-6 mb-10 border backdrop-blur-md flex items-center gap-4 ${isAllGood && activeIncidents.length === 0
            ? 'bg-[#30ff87]/10 border-[#30ff87]/30 text-[#30ff87] shadow-[0_0_20px_rgba(48,255,135,0.1)]'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
        >
          {isAllGood && activeIncidents.length === 0 ? (
            <CheckCircle2 className="h-8 w-8 text-[#30ff87] shrink-0 drop-shadow-[0_0_8px_#30ff87]" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-amber-400 shrink-0" />
          )}
          <div>
            <h2 className="text-xl font-bold text-white">
              {activeIncidents.length > 0 ? 'Active System Incident' : data.globalStatus}
            </h2>
            <p className="text-xs opacity-80 mt-0.5">
              {activeIncidents.length > 0
                ? `${activeIncidents.length} active service disruption event(s) currently being triaged by engineering.`
                : isAllGood
                ? 'All systems are functioning within normal operational parameters.'
                : 'System disruption detected on component services.'}
            </p>
          </div>
        </div>

        {/* Active Incidents Banner / Timeline */}
        {activeIncidents.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xs font-mono text-amber-400 mb-4 uppercase tracking-wider flex items-center gap-2 font-bold">
              <Radio className="h-4 w-4 animate-pulse text-amber-400" />
              Active Incidents & Engineering Response
            </h3>
            <div className="space-y-6">
              {activeIncidents.map((inc) => {
                const updates = inc.updates && inc.updates.length > 0 ? inc.updates : [
                  { id: inc.id, status: inc.status, message: inc.message, createdAt: inc.createdAt }
                ];

                return (
                  <div key={inc.id} className="vercel-card rounded-xl p-6 border-amber-500/30 bg-neutral-950/80">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vercel-border pb-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-base font-bold text-white">{inc.title}</h4>
                        </div>
                        <span className="text-xs font-mono text-vercel-muted">Reported {new Date(inc.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getImpactBadge(inc.impact)}
                        {getStageBadge(inc.status)}
                      </div>
                    </div>

                    {/* Timeline of Engineering Activity */}
                    <div className="pl-2 relative border-l-2 border-vercel-border ml-3 space-y-6">
                      {updates.map((upd, idx) => (
                        <div key={upd.id || idx} className="relative pl-6">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 ${
                            idx === 0 ? 'bg-amber-400 border-black shadow-[0_0_8px_#fbbf24]' : 'bg-neutral-800 border-neutral-600'
                          }`} />
                          
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{upd.status}</span>
                            <span className="text-[11px] font-mono text-neutral-400">• {new Date(upd.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">{upd.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* System Components / Monitors */}
        <div className="mb-12">
          <h3 className="text-xs font-mono text-vercel-muted mb-4 uppercase tracking-wider">System Components Status</h3>
          <div className="space-y-4">
            {data.monitors.map((m) => (
              <div key={m.id} className="vercel-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-white text-sm">{m.name}</span>
                  <StatusBadge status={m.status} size="sm" />
                </div>
                <UptimeBar checks={m.checksHistory} uptimePercentage={m.uptimePercentage} />
              </div>
            ))}
          </div>
        </div>

        {/* Past Incident History Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-mono text-vercel-muted uppercase tracking-wider">Incident History</h3>
            <div className="flex items-center gap-2 text-xs font-mono text-vercel-muted">
              <span>Show:</span>
              <select
                value={historyRangeDays}
                onChange={(e) => setHistoryRangeDays(Number(e.target.value))}
                className="bg-neutral-900 border border-neutral-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-neutral-600"
              >
                <option value={7}>Past 7 Days</option>
                <option value={30}>Past 30 Days</option>
                <option value={90}>Past 90 Days</option>
              </select>
            </div>
          </div>

          {pastIncidents.length === 0 ? (
            <div className="vercel-card rounded-xl p-8 text-center text-xs text-vercel-muted border border-dashed border-vercel-border">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-white">No resolved incidents reported in the past {historyRangeDays} days.</p>
              <p className="text-neutral-400 mt-1">All services maintained uptime SLA targets.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pastIncidents.map((inc) => {
                const updates = inc.updates && inc.updates.length > 0 ? inc.updates : [
                  { id: inc.id, status: inc.status, message: inc.message, createdAt: inc.createdAt }
                ];

                return (
                  <div key={inc.id} className="vercel-card rounded-xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vercel-border pb-4 mb-5">
                      <div>
                        <h4 className="text-base font-bold text-white">{inc.title}</h4>
                        <span className="text-xs font-mono text-vercel-muted">Resolved on {new Date(inc.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getImpactBadge(inc.impact)}
                        {getStageBadge(inc.status)}
                      </div>
                    </div>

                    {/* Incident Evolution Timeline */}
                    <div className="pl-2 relative border-l-2 border-neutral-800 ml-3 space-y-5">
                      {updates.map((upd, idx) => (
                        <div key={upd.id || idx} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-neutral-800 border-2 border-neutral-700" />
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">{upd.status}</span>
                            <span className="text-[11px] font-mono text-neutral-400">• {new Date(upd.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">{upd.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Branding */}
        <div className="border-t border-vercel-border pt-8 text-center text-xs text-vercel-subtle font-mono">
          Powered by <Link href="/" className="text-white font-semibold hover:text-[#30ff87] transition-colors">StatusEnzin</Link> Multi-Tenant Platform
        </div>
      </div>

      {/* Subscriber Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="vercel-card w-full max-w-md rounded-xl p-8 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-1">Subscribe to Updates</h2>
            <p className="text-xs text-vercel-muted mb-6">Receive immediate email notifications when incidents are posted or updated</p>

            {subscribeMessage && (
              <div className="mb-4 rounded-lg border border-[#30ff87]/30 bg-[#30ff87]/10 p-3 text-xs text-[#30ff87]">
                {subscribeMessage}
              </div>
            )}

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-vercel-muted mb-1">YOUR EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-vercel-subtle" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="vercel-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubscribeModal(false)}
                  className="vercel-button-secondary rounded-lg px-4 py-2 text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="vercel-button-primary rounded-lg px-4 py-2 text-xs font-semibold"
                >
                  {submitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
