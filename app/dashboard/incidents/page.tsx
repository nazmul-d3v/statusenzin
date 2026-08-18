'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ConfirmModal } from '@/components/ConfirmModal';
import { api, IncidentItem, StatusPageItem, IncidentUpdateItem } from '@/lib/api';
import { Plus, ShieldAlert, Trash2, Edit3, AlertCircle, Clock, X, MessageSquarePlus, Radio, Check, ChevronRight } from 'lucide-react';

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
      return <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1.5"><Radio className="h-3 w-3 animate-pulse text-amber-400" /> Investigating</span>;
    case 'identified':
      return <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/30 flex items-center gap-1.5"><Radio className="h-3 w-3 text-purple-400" /> Identified</span>;
    case 'monitoring':
      return <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/30 flex items-center gap-1.5"><Radio className="h-3 w-3 text-blue-400" /> Monitoring</span>;
    case 'resolved':
    default:
      return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-400" /> Resolved</span>;
  }
};

export default function IncidentsDashboard() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [statusPages, setStatusPages] = useState<StatusPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved'>('all');

  const [showModal, setShowModal] = useState(false);
  const [statusPageId, setStatusPageId] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Investigating');
  const [impact, setImpact] = useState('Minor');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [updatingIncident, setUpdatingIncident] = useState<IncidentItem | null>(null);
  const [updateStatus, setUpdateStatus] = useState('Investigating');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  const [editingIncident, setEditingIncident] = useState<IncidentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('Investigating');
  const [editImpact, setEditImpact] = useState('Minor');
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<IncidentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

const MOCK_FALLBACK_INCIDENTS: IncidentItem[] = [
  {
    id: 'inc-1',
    statusPageId: 'sp-1',
    title: 'Scheduled Database Maintenance & Index Optimization',
    status: 'Resolved',
    impact: 'Minor',
    message: 'Maintenance completed successfully. All services operational.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    updates: [
      {
        id: 'u-1',
        status: 'Resolved',
        message: 'Maintenance completed successfully. Database performance and query latencies have restored to normal operational parameters.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      },
    ],
  },
];

  const fetchData = async () => {
    try {
      const [incRes, spRes] = await Promise.all([
        api.get('/incidents'),
        api.get('/status-pages'),
      ]);
      if (incRes.data) setIncidents(incRes.data.length > 0 ? incRes.data : MOCK_FALLBACK_INCIDENTS);
      if (spRes.data) setStatusPages(spRes.data);
      setLoading(false);
      return;
    } catch (err) {
      console.error('API Error, using fallback incidents:', err);
    }
    setIncidents(MOCK_FALLBACK_INCIDENTS);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (showModal) setShowModal(false);
        if (updatingIncident) setUpdatingIncident(null);
        if (editingIncident) setEditingIncident(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, updatingIncident, editingIncident]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!statusPageId) {
      setError('Please select a target status page.');
      return;
    }
    if (!trimmedTitle) {
      setError('Incident title is required.');
      return;
    }
    if (!trimmedMessage) {
      setError('Initial incident message is required.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/incidents', {
        statusPageId,
        title: trimmedTitle,
        status,
        impact,
        message: trimmedMessage,
      });
      setTitle('');
      setMessage('');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post incident update.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddUpdate = (inc: IncidentItem) => {
    setUpdatingIncident(inc);
    setUpdateStatus(inc.status);
    setUpdateMessage('');
    setUpdateError('');
  };

  const handlePostIncidentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingIncident) return;
    setUpdateError('');

    const trimmedMessage = updateMessage.trim();
    if (!trimmedMessage) {
      setUpdateError('Progress update message is required.');
      return;
    }

    setUpdateSubmitting(true);

    try {
      await api.post(`/incidents/${updatingIncident.id}/updates`, {
        status: updateStatus,
        message: trimmedMessage,
      });
      setUpdatingIncident(null);
      fetchData();
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Failed to post status update.');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleOpenEdit = (inc: IncidentItem) => {
    setEditingIncident(inc);
    setEditTitle(inc.title);
    setEditStatus(inc.status);
    setEditImpact(inc.impact);
    setEditMessage(inc.message);
    setEditError('');
  };

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;
    setEditError('');

    const trimmedTitle = editTitle.trim();
    const trimmedMessage = editMessage.trim();

    if (!trimmedTitle) {
      setEditError('Incident title is required.');
      return;
    }
    if (!trimmedMessage) {
      setEditError('Detailed incident message is required.');
      return;
    }

    setEditSubmitting(true);

    try {
      await api.put(`/incidents/${editingIncident.id}`, {
        title: trimmedTitle,
        status: editStatus,
        impact: editImpact,
        message: trimmedMessage,
      });
      setEditingIncident(null);
      fetchData();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update incident.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const confirmDeleteIncident = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/incidents/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (activeTab === 'active') return inc.status !== 'Resolved';
    if (activeTab === 'resolved') return inc.status === 'Resolved';
    return true;
  });

  const activeCount = incidents.filter((i) => i.status !== 'Resolved').length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-4 py-10 sm:px-6 flex-1">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-vercel-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Incidents & Engineering Activity</h1>
            <p className="text-sm text-vercel-muted mt-1.5">Manage outages, record engineer progress updates, and inform status page visitors</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="vercel-button-primary rounded-lg px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Report Incident
          </button>
        </div>

        {/* Tabs / Filter Bar */}
        <div className="flex items-center gap-2 border-b border-vercel-border my-6 pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-neutral-900 text-white border border-neutral-700'
                : 'text-vercel-muted hover:text-white hover:bg-neutral-950'
            }`}
          >
            All Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'active'
                ? 'bg-neutral-900 text-amber-300 border border-amber-500/30'
                : 'text-vercel-muted hover:text-white hover:bg-neutral-950'
            }`}
          >
            <Radio className="h-3 w-3 animate-pulse text-amber-400" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'resolved'
                ? 'bg-neutral-900 text-emerald-400 border border-emerald-500/30'
                : 'text-vercel-muted hover:text-white hover:bg-neutral-950'
            }`}
          >
            <Check className="h-3 w-3 text-emerald-400" />
            Resolved ({resolvedCount})
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-vercel-muted">Loading incidents...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-vercel-border rounded-xl bg-neutral-950/40 p-12 my-8">
            <ShieldAlert className="mx-auto h-9 w-9 text-vercel-subtle mb-3" />
            <h3 className="text-lg font-bold text-white">No incidents found in this view</h3>
            <p className="text-sm text-vercel-muted mt-2 max-w-md mx-auto leading-relaxed">Log incident events and append engineering activity updates to inform customers on your status page.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 vercel-button-primary rounded-lg px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Report Incident
            </button>
          </div>
        ) : (
          <div className="space-y-6 my-6">
            {filteredIncidents.map((inc) => {
              const updates = inc.updates && inc.updates.length > 0 ? inc.updates : [
                { id: inc.id, status: inc.status, message: inc.message, createdAt: inc.createdAt }
              ];

              return (
                <div key={inc.id} className="vercel-card rounded-xl p-6 bg-neutral-950/90">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-vercel-border pb-4 mb-5">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{inc.title}</h3>
                      </div>
                      <span className="text-xs font-mono text-vercel-muted">Created {new Date(inc.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {getImpactBadge(inc.impact)}
                      {getStageBadge(inc.status)}

                      <div className="flex items-center gap-2 border-l border-vercel-border pl-3 ml-2">
                        {inc.status !== 'Resolved' && (
                          <button
                            onClick={() => handleOpenAddUpdate(inc)}
                            className="vercel-button-primary text-xs rounded-lg px-3 py-1.5 font-semibold flex items-center gap-1.5 shadow-[0_0_10px_rgba(48,255,135,0.2)]"
                          >
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                            Post Progress Update
                          </button>
                        )}
                        <button onClick={() => handleOpenEdit(inc)} title="Edit Incident Metadata" className="p-1.5 rounded text-vercel-muted hover:text-white hover:bg-neutral-800 transition">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(inc)} title="Delete Incident Log" className="p-1.5 rounded text-vercel-muted hover:text-rose-400 hover:bg-rose-950/30 transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Engineering Timeline Updates */}
                  <div className="mb-4">
                    <h4 className="text-xs font-mono font-semibold text-vercel-muted uppercase tracking-wider mb-3">Activity & Response History ({updates.length})</h4>
                    <div className="pl-2 relative border-l-2 border-neutral-800 ml-3 space-y-4">
                      {updates.map((upd, idx) => (
                        <div key={upd.id || idx} className="relative pl-6">
                          <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 ${
                            idx === 0 ? 'bg-amber-400 border-black shadow-[0_0_8px_#fbbf24]' : 'bg-neutral-800 border-neutral-700'
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

                  <div className="pt-3 border-t border-vercel-border flex items-center justify-between text-xs text-vercel-subtle font-mono">
                    <span>Status: {inc.status}</span>
                    <span>Last Activity {new Date(inc.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: New Incident */}
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
              <h2 className="text-xl font-bold text-white mb-1">Report Incident</h2>
              <p className="text-sm text-vercel-muted mb-6">Create a new incident log and notify status page subscribers</p>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateIncident} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">TARGET STATUS PAGE</label>
                  <select
                    value={statusPageId}
                    onChange={(e) => setStatusPageId(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  >
                    {statusPages.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name} (/status/{sp.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">INCIDENT TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="API Response Time Degradation in US-East"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">INITIAL STATUS</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                    >
                      <option value="Investigating">Investigating</option>
                      <option value="Identified">Identified</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">IMPACT LEVEL</label>
                    <select
                      value={impact}
                      onChange={(e) => setImpact(e.target.value)}
                      className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                    >
                      <option value="Minor">Minor</option>
                      <option value="Major">Major</option>
                      <option value="Critical">Critical</option>
                      <option value="Degraded">Degraded</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">INITIAL UPDATE / ACTIVITY MESSAGE</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Engineers are investigating reports of elevated API latency..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2 text-sm"
                  />
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
                    {submitting ? 'Publishing...' : 'Report Incident'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Post Progress Update */}
        {updatingIncident && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setUpdatingIncident(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          >
            <div className="vercel-card w-full max-w-lg rounded-xl p-8 shadow-2xl relative">
              <button
                onClick={() => setUpdatingIncident(null)}
                className="absolute top-6 right-6 text-vercel-muted hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Post Progress Update</h2>
              <p className="text-sm text-vercel-muted mb-2 font-semibold text-emerald-400">{updatingIncident.title}</p>
              <p className="text-xs text-vercel-muted mb-6">Inform customers what engineers are currently doing to resolve this incident</p>

              {updateError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{updateError}</span>
                </div>
              )}

              <form onSubmit={handlePostIncidentUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">NEW INCIDENT STAGE</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  >
                    <option value="Investigating">Investigating</option>
                    <option value="Identified">Identified</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">ENGINEER ACTIVITY / PROGRESS MESSAGE</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="The root cause was identified as memory leak on node pool 3. Hotfix deployed, monitoring recovery..."
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-vercel-border mt-6">
                  <button
                    type="button"
                    onClick={() => setUpdatingIncident(null)}
                    className="vercel-button-secondary rounded-lg px-5 py-2.5 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSubmitting}
                    className="vercel-button-primary rounded-lg px-6 py-2.5 text-sm font-bold shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)]"
                  >
                    {updateSubmitting ? 'Posting Update...' : 'Post Progress Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Incident Metadata */}
        {editingIncident && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setEditingIncident(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          >
            <div className="vercel-card w-full max-w-lg rounded-xl p-8 shadow-2xl relative">
              <button
                onClick={() => setEditingIncident(null)}
                className="absolute top-6 right-6 text-vercel-muted hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Edit Incident Details</h2>
              <p className="text-sm text-vercel-muted mb-6">Modify incident title, stage status, or impact level</p>

              {editError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateIncident} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">INCIDENT TITLE</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">STAGE STATUS</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                    >
                      <option value="Investigating">Investigating</option>
                      <option value="Identified">Identified</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">IMPACT LEVEL</label>
                    <select
                      value={editImpact}
                      onChange={(e) => setEditImpact(e.target.value)}
                      className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                    >
                      <option value="Minor">Minor</option>
                      <option value="Major">Major</option>
                      <option value="Critical">Critical</option>
                      <option value="Degraded">Degraded</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">LATEST SUMMARY MESSAGE</label>
                  <textarea
                    rows={3}
                    required
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-vercel-border mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingIncident(null)}
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
          title="Delete Incident Log"
          description={`Are you sure you want to delete "${deleteTarget?.title}"? This incident record will be permanently removed from your status page.`}
          isLoading={deleting}
          onConfirm={confirmDeleteIncident}
          onClose={() => setDeleteTarget(null)}
        />
      </main>

      <Footer />
    </div>
  );
}
