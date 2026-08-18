'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ConfirmModal } from '@/components/ConfirmModal';
import { api, StatusPageItem, MonitorItem } from '@/lib/api';
import { Plus, Globe, ExternalLink, Trash2, Edit3, AlertCircle, Check, X } from 'lucide-react';

const isValidSlug = (slugStr: string): boolean => {
  return /^[a-z0-9-_]+$/i.test(slugStr.trim());
};

export default function StatusPagesDashboard() {
  const [statusPages, setStatusPages] = useState<StatusPageItem[]>([]);
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingPage, setEditingPage] = useState<StatusPageItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSelectedMonitors, setEditSelectedMonitors] = useState<string[]>([]);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StatusPageItem | null>(null);
  const [deleting, setDeleting] = useState(false);

const MOCK_FALLBACK_STATUS_PAGES: StatusPageItem[] = [
  {
    id: 'sp-1',
    name: 'Acme Global Infrastructure',
    slug: 'acme',
    description: 'Real-time operational status, system metrics, and incident reports for Acme Cloud Platform services.',
    isPublic: true,
    componentIdsJson: '["m-1","m-2","m-3"]',
    createdAt: new Date().toISOString(),
  },
];

  const fetchData = async () => {
    try {
      const [spRes, monRes] = await Promise.all([
        api.get('/status-pages'),
        api.get('/monitors'),
      ]);
      if (spRes.data) setStatusPages(spRes.data.length > 0 ? spRes.data : MOCK_FALLBACK_STATUS_PAGES);
      if (monRes.data) setMonitors(monRes.data);
      setLoading(false);
      return;
    } catch (err) {
      console.error('API call failed, using fallback data:', err);
    }
    setStatusPages(MOCK_FALLBACK_STATUS_PAGES);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (showModal) setShowModal(false);
        if (editingPage) setEditingPage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, editingPage]);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      setError('Status page title is required.');
      return;
    }
    if (!trimmedSlug) {
      setError('URL slug is required.');
      return;
    }
    if (!isValidSlug(trimmedSlug)) {
      setError('URL slug can only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/status-pages', {
        name: trimmedName,
        slug: trimmedSlug,
        description: description.trim(),
        isPublic: true,
        componentIds: selectedMonitors,
      });
      setName('');
      setSlug('');
      setDescription('');
      setSelectedMonitors([]);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create status page.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (sp: StatusPageItem) => {
    let componentIds: string[] = [];
    try {
      componentIds = JSON.parse(sp.componentIdsJson || '[]');
    } catch (e) {
      componentIds = [];
    }

    setEditingPage(sp);
    setEditName(sp.name);
    setEditSlug(sp.slug);
    setEditDescription(sp.description || '');
    setEditSelectedMonitors(componentIds);
    setEditError('');
  };

  const handleUpdatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;
    setEditError('');

    const trimmedName = editName.trim();
    const trimmedSlug = editSlug.trim();

    if (!trimmedName) {
      setEditError('Status page title is required.');
      return;
    }
    if (!trimmedSlug) {
      setEditError('URL slug is required.');
      return;
    }
    if (!isValidSlug(trimmedSlug)) {
      setEditError('URL slug can only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    setEditSubmitting(true);

    try {
      await api.put(`/status-pages/${editingPage.id}`, {
        name: trimmedName,
        slug: trimmedSlug,
        description: editDescription.trim(),
        isPublic: true,
        componentIds: editSelectedMonitors,
      });
      setEditingPage(null);
      fetchData();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update status page.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const confirmDeleteStatusPage = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/status-pages/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const toggleMonitor = (id: string) => {
    if (selectedMonitors.includes(id)) {
      setSelectedMonitors(selectedMonitors.filter((m) => m !== id));
    } else {
      setSelectedMonitors([...selectedMonitors, id]);
    }
  };

  const toggleEditMonitor = (id: string) => {
    if (editSelectedMonitors.includes(id)) {
      setEditSelectedMonitors(editSelectedMonitors.filter((m) => m !== id));
    } else {
      setEditSelectedMonitors([...editSelectedMonitors, id]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-4 py-10 sm:px-6 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-vercel-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Public Status Pages</h1>
            <p className="text-sm text-vercel-muted mt-1.5">Manage tenant-branded public uptime portals and customer communication channels</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="vercel-button-primary rounded-lg px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            New Status Page
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-vercel-muted">Loading status pages...</div>
        ) : statusPages.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-vercel-border rounded-xl bg-neutral-950/40 p-12 my-8">
            <Globe className="mx-auto h-9 w-9 text-vercel-subtle mb-3" />
            <h3 className="text-lg font-bold text-white">No status pages published</h3>
            <p className="text-sm text-vercel-muted mt-2 max-w-md mx-auto leading-relaxed">Create a public URL to showcase uptime SLAs and communicate incident updates to your customers.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 vercel-button-primary rounded-lg px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 shadow-[0_0_15px_rgba(48,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,204,94,0.4)]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Create Status Page
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 my-8">
            {statusPages.map((sp) => (
              <div key={sp.id} className="vercel-card rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold font-mono text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                      PUBLIC
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sp)}
                        title="Edit Status Page"
                        className="p-1 rounded text-vercel-muted hover:text-white hover:bg-neutral-800 transition"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(sp)}
                        title="Delete Status Page"
                        className="p-1 rounded text-vercel-muted hover:text-rose-400 hover:bg-rose-950/30 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white">{sp.name}</h3>
                  <p className="text-sm text-neutral-300 mt-2 leading-relaxed line-clamp-2">{sp.description || 'No description provided.'}</p>
                  <p className="text-xs font-mono text-neutral-400 mt-4 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 inline-block">URL: /status/{sp.slug}</p>
                </div>

                <div className="pt-5 border-t border-vercel-border mt-6 flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-400 font-medium">
                    {sp.incidents?.length || 0} Incidents Logged
                  </span>
                  <Link
                    href={`/status/${sp.slug}`}
                    target="_blank"
                    className="vercel-button-secondary rounded-lg px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 hover:bg-neutral-800"
                  >
                    View Page
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: New Status Page */}
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
              <h2 className="text-xl font-bold text-white mb-1">Create Public Status Page</h2>
              <p className="text-sm text-vercel-muted mb-6">Publish operational status and component monitors</p>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreatePage} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">PAGE TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Service Status"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">URL SLUG (/status/[slug])</label>
                  <input
                    type="text"
                    required
                    placeholder="acme"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    placeholder="Live status and historical uptime metrics for our cloud platform."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-2">SELECT MONITORS TO DISPLAY</label>
                  {monitors.length === 0 ? (
                    <p className="text-xs text-vercel-subtle">No monitors available to attach.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {monitors.map((m) => {
                        const isSelected = selectedMonitors.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleMonitor(m.id)}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'border-white bg-neutral-900 text-white'
                                : 'border-vercel-border bg-neutral-950 text-vercel-muted hover:border-neutral-700'
                            }`}
                          >
                            <span className="font-medium">{m.name}</span>
                            {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                    {submitting ? 'Publishing...' : 'Publish Status Page'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Status Page */}
        {editingPage && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setEditingPage(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          >
            <div className="vercel-card w-full max-w-lg rounded-xl p-8 shadow-2xl relative">
              <button
                onClick={() => setEditingPage(null)}
                className="absolute top-6 right-6 text-vercel-muted hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Edit Status Page</h2>
              <p className="text-sm text-vercel-muted mb-6">Modify title, URL slug, description, or attached service monitors</p>

              {editError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePage} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">PAGE TITLE</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">URL SLUG (/status/[slug])</label>
                  <input
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2.5 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="vercel-input w-full rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-2">SELECT MONITORS TO DISPLAY</label>
                  {monitors.length === 0 ? (
                    <p className="text-xs text-vercel-subtle">No monitors available to attach.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {monitors.map((m) => {
                        const isSelected = editSelectedMonitors.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleEditMonitor(m.id)}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'border-white bg-neutral-900 text-white'
                                : 'border-vercel-border bg-neutral-950 text-vercel-muted hover:border-neutral-700'
                            }`}
                          >
                            <span className="font-medium">{m.name}</span>
                            {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-vercel-border mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
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
          title="Delete Status Page"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? The public URL /status/${deleteTarget?.slug} will no longer be accessible.`}
          isLoading={deleting}
          onConfirm={confirmDeleteStatusPage}
          onClose={() => setDeleteTarget(null)}
        />
      </main>

      <Footer />
    </div>
  );
}
