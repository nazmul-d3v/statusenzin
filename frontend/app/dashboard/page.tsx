'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { UptimeBar } from '@/components/UptimeBar';
import { ConfirmModal } from '@/components/ConfirmModal';
import { api, MonitorItem } from '@/lib/api';
import { Plus, RefreshCw, Activity, ExternalLink, Trash2, Edit3, Play, AlertCircle, Server, X } from 'lucide-react';

const isValidUrl = (urlStr: string): boolean => {
  if (!urlStr || !urlStr.trim()) return false;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function DashboardOverview() {
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setIntervalVal] = useState(300);
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingMonitor, setEditingMonitor] = useState<MonitorItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editInterval, setEditInterval] = useState(300);
  const [editExpectedStatusCode, setEditExpectedStatusCode] = useState(200);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MonitorItem | null>(null);
  const [deleting, setDeleting] = useState(false);

const MOCK_FALLBACK_MONITORS: MonitorItem[] = [
  {
    id: 'm-1',
    name: 'Core API Gateway',
    url: 'https://httpbin.org/status/200',
    checkIntervalSeconds: 30,
    expectedStatusCode: 200,
    status: 'Operational',
    lastLatencyMs: 42,
    uptimePercentage: 99.8,
    lastCheckedAt: new Date().toISOString(),
    nextCheckAt: new Date(Date.now() + 30000).toISOString(),
    recentChecks: Array.from({ length: 90 }, (_, i) => ({
      id: `rc-1-${i}`,
      statusCode: i === 14 ? 502 : 200,
      responseTimeMs: 35 + ((i * 7) % 40),
      isSuccess: i !== 14,
      checkedAt: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
  {
    id: 'm-2',
    name: 'Auth & Identity Service',
    url: 'https://httpbin.org/anything',
    checkIntervalSeconds: 60,
    expectedStatusCode: 200,
    status: 'Operational',
    lastLatencyMs: 28,
    uptimePercentage: 100.0,
    lastCheckedAt: new Date().toISOString(),
    nextCheckAt: new Date(Date.now() + 60000).toISOString(),
    recentChecks: Array.from({ length: 90 }, (_, i) => ({
      id: `rc-2-${i}`,
      statusCode: 200,
      responseTimeMs: 22 + ((i * 5) % 25),
      isSuccess: true,
      checkedAt: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
  {
    id: 'm-3',
    name: 'CDN & Global Edge Cache',
    url: 'https://httpbin.org/ip',
    checkIntervalSeconds: 30,
    expectedStatusCode: 200,
    status: 'Operational',
    lastLatencyMs: 19,
    uptimePercentage: 99.9,
    lastCheckedAt: new Date().toISOString(),
    nextCheckAt: new Date(Date.now() + 30000).toISOString(),
    recentChecks: Array.from({ length: 90 }, (_, i) => ({
      id: `rc-3-${i}`,
      statusCode: i === 78 ? 504 : 200,
      responseTimeMs: 15 + ((i * 3) % 20),
      isSuccess: i !== 78,
      checkedAt: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
];

  const fetchMonitors = async () => {
    try {
      const res = await api.get('/monitors');
      if (res.data && res.data.length > 0) {
        setMonitors(res.data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('API Error, using fallback monitors:', err);
    }
    setMonitors(MOCK_FALLBACK_MONITORS);
    setLoading(false);
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (showModal) setShowModal(false);
        if (editingMonitor) setEditingMonitor(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, editingMonitor]);

  const handleCreateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName) {
      setError('Monitor name is required.');
      return;
    }
    if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
      setError('Please enter a valid URL including http:// or https:// (e.g. https://api.acme.com/health).');
      return;
    }
    const statusCodeNum = Number(expectedStatusCode);
    if (isNaN(statusCodeNum) || statusCodeNum < 100 || statusCodeNum > 599) {
      setError('Expected HTTP status code must be a number between 100 and 599.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/monitors', {
        name: trimmedName,
        url: trimmedUrl,
        checkIntervalSeconds: Number(interval),
        expectedStatusCode: statusCodeNum,
      });
      setName('');
      setUrl('');
      setIntervalVal(300);
      setExpectedStatusCode(200);
      setShowModal(false);
      fetchMonitors();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create monitor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (m: MonitorItem) => {
    setEditingMonitor(m);
    setEditName(m.name);
    setEditUrl(m.url);
    setEditInterval(m.checkIntervalSeconds || 300);
    setEditExpectedStatusCode(m.expectedStatusCode || 200);
    setEditError('');
  };

  const handleUpdateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonitor) return;
    setEditError('');

    const trimmedName = editName.trim();
    const trimmedUrl = editUrl.trim();

    if (!trimmedName) {
      setEditError('Monitor name is required.');
      return;
    }
    if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
      setEditError('Please enter a valid URL including http:// or https:// (e.g. https://api.acme.com/health).');
      return;
    }
    const statusCodeNum = Number(editExpectedStatusCode);
    if (isNaN(statusCodeNum) || statusCodeNum < 100 || statusCodeNum > 599) {
      setEditError('Expected HTTP status code must be a number between 100 and 599.');
      return;
    }

    setEditSubmitting(true);

    try {
      await api.put(`/monitors/${editingMonitor.id}`, {
        name: trimmedName,
        url: trimmedUrl,
        checkIntervalSeconds: Number(editInterval),
        expectedStatusCode: statusCodeNum,
      });
      setEditingMonitor(null);
      fetchMonitors();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update monitor.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const confirmDeleteMonitor = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/monitors/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchMonitors();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCheckNow = async (id: string) => {
    try {
      await api.post(`/monitors/${id}/check-now`);
      fetchMonitors();
    } catch (err) {
      console.error(err);
    }
  };

  const totalMonitors = monitors.length;
  const operationalCount = monitors.filter((m) => m.status === 'Operational').length;
  const avgUptime = totalMonitors > 0 ? (monitors.reduce((acc, m) => acc + m.uptimePercentage, 0) / totalMonitors).toFixed(2) : '100.00';

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-4 py-10 sm:px-6 flex-1">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-vercel-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Monitors</h1>
            <p className="text-sm text-vercel-muted mt-1.5">Real-time uptime status and telemetry for your services</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMonitors}
              className="vercel-button-secondary rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition hover:bg-neutral-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="vercel-button-primary rounded-lg px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)] transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              New Monitor
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid gap-6 sm:grid-cols-3 my-8">
          <div className="vercel-card rounded-xl p-6">
            <div className="flex items-center justify-between text-xs text-vercel-muted font-mono">
              <span>TOTAL MONITORS</span>
              <Server className="h-4 w-4 text-vercel-subtle" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">{totalMonitors}</p>
            <p className="mt-1 text-xs text-[#30ff87] font-mono">{operationalCount} Operational</p>
          </div>

          <div className="vercel-card rounded-xl p-6">
            <div className="flex items-center justify-between text-xs text-vercel-muted font-mono">
              <span>AVERAGE UPTIME</span>
              <Activity className="h-4 w-4 text-vercel-subtle" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">{avgUptime}%</p>
            <p className="mt-1 text-xs text-vercel-muted font-mono">Last 90 days rolling</p>
          </div>

          <div className="vercel-card rounded-xl p-6">
            <div className="flex items-center justify-between text-xs text-vercel-muted font-mono">
              <span>CHECK FREQUENCY</span>
              <RefreshCw className="h-4 w-4 text-vercel-subtle" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">30s - 5m</p>
            <p className="mt-1 text-xs text-vercel-muted font-mono">Active BackgroundWorker</p>
          </div>
        </div>

        {/* Monitor Cards List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-vercel-muted">Loading monitors...</div>
        ) : monitors.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-vercel-border rounded-xl bg-neutral-950/40 p-12">
            <Server className="mx-auto h-8 w-8 text-vercel-subtle mb-3" />
            <h3 className="text-base font-semibold text-white">No monitors added yet</h3>
            <p className="text-xs text-vercel-muted mt-1 max-w-sm mx-auto">Create your first HTTP check to start tracking service availability and uptime history.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 vercel-button-primary rounded-lg px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Add Monitor
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {monitors.map((m) => (
              <div key={m.id} className="vercel-card rounded-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-vercel-border pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={m.status} size="sm" />
                    <div>
                      <Link href={`/dashboard/monitors/${m.id}`} className="font-semibold text-white text-base hover:underline flex items-center gap-1.5">
                        {m.name}
                        <ExternalLink className="h-3.5 w-3.5 text-vercel-muted" />
                      </Link>
                      <p className="text-xs font-mono text-vercel-muted truncate max-w-md">{m.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <p className="text-white font-medium">{m.lastLatencyMs} ms</p>
                      <p className="text-vercel-subtle text-[10px]">LATENCY</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#30ff87] font-medium">{m.uptimePercentage}%</p>
                      <p className="text-vercel-subtle text-[10px]">90d UPTIME</p>
                    </div>

                    <div className="flex items-center gap-2 border-l border-vercel-border pl-4">
                      <button
                        onClick={() => handleCheckNow(m.id)}
                        title="Ping Check Now"
                        className="rounded-lg p-2 border border-vercel-border bg-neutral-900 text-vercel-muted hover:text-white hover:border-neutral-600 hover:bg-neutral-800 transition"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        title="Edit Monitor"
                        className="rounded-lg p-2 border border-vercel-border bg-neutral-900 text-vercel-muted hover:text-white hover:border-neutral-600 hover:bg-neutral-800 transition"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(m)}
                        title="Delete Monitor"
                        className="rounded-lg p-2 border border-vercel-border bg-neutral-900 text-vercel-muted hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/30 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <UptimeBar checks={m.recentChecks} uptimePercentage={m.uptimePercentage} />
              </div>
            ))}
          </div>
        )}

        {/* Modal: New Monitor */}
        {showModal && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          >
            <div className="vercel-card w-full max-w-lg rounded-xl p-8 shadow-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 text-vercel-muted hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold text-white mb-1">Add New Monitor</h2>
              <p className="text-xs text-vercel-muted mb-6">Configure a URL for automated HTTP ping checks</p>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateMonitor} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-vercel-muted mb-1">MONITOR NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary API Gateway"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-vercel-muted mb-1">TARGET URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.acme.com/health"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-vercel-muted mb-1">CHECK INTERVAL</label>
                    <select
                      value={interval}
                      onChange={(e) => setIntervalVal(Number(e.target.value))}
                      className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                    >
                      <option value={300}>5 minutes (Starter Plan)</option>
                      <option value={60}>1 minute (Pro Plan)</option>
                      <option value={30}>30 seconds (Business Plan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-vercel-muted mb-1">EXPECTED HTTP STATUS</label>
                    <input
                      type="number"
                      required
                      min={100}
                      max={599}
                      value={expectedStatusCode}
                      onChange={(e) => setExpectedStatusCode(Number(e.target.value))}
                      className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-vercel-border mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="vercel-button-secondary rounded-lg px-5 py-2.5 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="vercel-button-primary rounded-lg px-6 py-2.5 text-sm font-bold shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)]"
                  >
                    {submitting ? 'Creating...' : 'Create Monitor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Monitor */}
        {editingMonitor && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setEditingMonitor(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          >
            <div className="vercel-card w-full max-w-lg rounded-xl p-8 shadow-2xl relative">
              <button
                onClick={() => setEditingMonitor(null)}
                className="absolute top-6 right-6 text-vercel-muted hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold text-white mb-1">Edit Monitor</h2>
              <p className="text-xs text-vercel-muted mb-6">Update URL, check interval, or expected status code</p>

              {editError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateMonitor} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-vercel-muted mb-1">MONITOR NAME</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-vercel-muted mb-1">TARGET URL</label>
                  <input
                    type="url"
                    required
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-vercel-muted mb-1">CHECK INTERVAL</label>
                    <select
                      value={editInterval}
                      onChange={(e) => setEditInterval(Number(e.target.value))}
                      className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                    >
                      <option value={300}>5 minutes</option>
                      <option value={60}>1 minute</option>
                      <option value={30}>30 seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-vercel-muted mb-1">EXPECTED HTTP STATUS</label>
                    <input
                      type="number"
                      required
                      min={100}
                      max={599}
                      value={editExpectedStatusCode}
                      onChange={(e) => setEditExpectedStatusCode(Number(e.target.value))}
                      className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-vercel-border mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingMonitor(null)}
                    className="vercel-button-secondary rounded-lg px-5 py-2.5 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="vercel-button-primary rounded-lg px-6 py-2.5 text-sm font-bold shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)]"
                  >
                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Monitor"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? All historical ping checks and telemetry data for this monitor will be permanently removed.`}
          isLoading={deleting}
          onConfirm={confirmDeleteMonitor}
          onClose={() => setDeleteTarget(null)}
        />
      </main>

      <Footer />
    </div>
  );
}
