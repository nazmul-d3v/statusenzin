'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { LatencyChart } from '@/components/LatencyChart';
import { UptimeBar } from '@/components/UptimeBar';
import { api } from '@/lib/api';
import { ArrowLeft, Play, Edit3, AlertCircle, CheckCircle2, XCircle, X } from 'lucide-react';

const isValidUrl = (urlStr: string): boolean => {
  if (!urlStr || !urlStr.trim()) return false;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function MonitorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [monitor, setMonitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editInterval, setEditInterval] = useState(300);
  const [editExpectedStatusCode, setEditExpectedStatusCode] = useState(200);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/monitors/${id}`);
      setMonitor(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (showEditModal) setShowEditModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal]);

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      await api.post(`/monitors/${id}/check-now`);
      fetchDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const handleOpenEdit = () => {
    if (!monitor) return;
    setEditName(monitor.name);
    setEditUrl(monitor.url);
    setEditInterval(monitor.checkIntervalSeconds || 300);
    setEditExpectedStatusCode(monitor.expectedStatusCode || 200);
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await api.put(`/monitors/${id}`, {
        name: trimmedName,
        url: trimmedUrl,
        checkIntervalSeconds: Number(editInterval),
        expectedStatusCode: statusCodeNum,
      });
      setShowEditModal(false);
      fetchDetails();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update monitor.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-20 text-xs text-vercel-muted">Loading monitor telemetry...</div>
        <Footer />
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-20 text-xs text-vercel-muted">Monitor not found.</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-4 py-10 sm:px-6 flex-1">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-mono text-vercel-muted hover:text-white mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Monitors
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-vercel-border">
          <div className="flex items-center gap-4">
            <StatusBadge status={monitor.status} size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{monitor.name}</h1>
              <p className="text-xs font-mono text-vercel-muted mt-0.5">{monitor.url}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenEdit}
              className="vercel-button-secondary rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition hover:bg-neutral-800"
            >
              <Edit3 className="h-4 w-4" />
              Edit Settings
            </button>

            <button
              onClick={handleCheckNow}
              disabled={checking}
              className="vercel-button-primary rounded-lg px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)]"
            >
              <Play className="h-4 w-4" />
              {checking ? 'Checking...' : 'Check Ping Now'}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 sm:grid-cols-4 my-8">
          <div className="vercel-card rounded-xl p-5">
            <p className="text-xs font-mono text-vercel-muted">CURRENT LATENCY</p>
            <p className="mt-2 text-2xl font-bold text-white font-mono">{monitor.lastLatencyMs} ms</p>
          </div>
          <div className="vercel-card rounded-xl p-5">
            <p className="text-xs font-mono text-vercel-muted">90D UPTIME</p>
            <p className="mt-2 text-2xl font-bold text-[#30ff87] font-mono">{monitor.uptimePercentage}%</p>
          </div>
          <div className="vercel-card rounded-xl p-5">
            <p className="text-xs font-mono text-vercel-muted">CHECK INTERVAL</p>
            <p className="mt-2 text-2xl font-bold text-white font-mono">{monitor.checkIntervalSeconds}s</p>
          </div>
          <div className="vercel-card rounded-xl p-5">
            <p className="text-xs font-mono text-vercel-muted">EXPECTED STATUS</p>
            <p className="mt-2 text-2xl font-bold text-white font-mono">HTTP {monitor.expectedStatusCode}</p>
          </div>
        </div>

        {/* Latency Chart */}
        <div className="vercel-card rounded-xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-white mb-4">Response Latency Trend</h3>
          <LatencyChart checks={monitor.checks || []} />
        </div>

        {/* 90-Day History */}
        <div className="vercel-card rounded-xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-white mb-4">Historical Check Status (90 Days)</h3>
          <UptimeBar checks={monitor.checks || []} uptimePercentage={monitor.uptimePercentage} />
        </div>

        {/* Recent Ping Log Table */}
        <div className="vercel-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Ping Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-vercel-border text-vercel-muted">
                  <th className="pb-3">TIMESTAMP</th>
                  <th className="pb-3">STATUS CODE</th>
                  <th className="pb-3">LATENCY</th>
                  <th className="pb-3">RESULT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vercel-border">
                {[...(monitor.checks || [])]
                  .sort((a: any, b: any) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
                  .map((c: any) => (
                  <tr key={c.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 text-vercel-text">{new Date(c.checkedAt).toLocaleString()}</td>
                    <td className="py-3 text-white">HTTP {c.statusCode}</td>
                    <td className="py-3 text-white">{c.responseTimeMs} ms</td>
                    <td className="py-3">
                      {c.isSuccess ? (
                        <span className="inline-flex items-center gap-1 text-[#30ff87]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400">
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Edit Monitor */}
        {showEditModal && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          >
            <div className="vercel-card w-full max-w-lg rounded-xl p-8 shadow-2xl relative">
              <button
                onClick={() => setShowEditModal(false)}
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
                    onClick={() => setShowEditModal(false)}
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
      </main>

      <Footer />
    </div>
  );
}
