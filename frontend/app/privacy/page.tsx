import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShieldCheck, Lock, Eye, Server, Database, UserCheck, Globe, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 flex-1 w-full">
        {/* Page Header */}
        <div className="border-b border-vercel-border pb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-[#30ff87] mb-3">
            <Lock className="h-4 w-4" />
            <span>DATA PROTECTION & PRIVACY</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-sm text-vercel-muted max-w-2xl leading-relaxed">
            StatusEnzin is committed to protecting organizational data, tenant confidentiality, and user privacy in full compliance with global data privacy standards (GDPR, CCPA).
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs font-mono text-vercel-subtle">
            <span>Effective Date: January 1, 2026</span>
            <span>&bull;</span>
            <span>Last Updated: July 29, 2026</span>
          </div>
        </div>

        {/* Quick Nav Index */}
        <div className="my-8 rounded-xl border border-vercel-border bg-neutral-950/60 p-6">
          <h3 className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-[#30ff87]" />
            Privacy Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-neutral-300">
            <a href="#section-1" className="hover:text-[#30ff87] transition flex items-center gap-2">1. Overview & Commitment</a>
            <a href="#section-2" className="hover:text-[#30ff87] transition flex items-center gap-2">2. Information We Collect</a>
            <a href="#section-3" className="hover:text-[#30ff87] transition flex items-center gap-2">3. How We Use Data & Legal Basis</a>
            <a href="#section-4" className="hover:text-[#30ff87] transition flex items-center gap-2">4. Multi-Tenant Data Isolation</a>
            <a href="#section-5" className="hover:text-[#30ff87] transition flex items-center gap-2">5. Third-Party Subprocessors</a>
            <a href="#section-6" className="hover:text-[#30ff87] transition flex items-center gap-2">6. Data Retention & Deletion</a>
            <a href="#section-7" className="hover:text-[#30ff87] transition flex items-center gap-2">7. Cookies & Browser Storage</a>
            <a href="#section-8" className="hover:text-[#30ff87] transition flex items-center gap-2">8. GDPR & CCPA Rights</a>
            <a href="#section-9" className="hover:text-[#30ff87] transition flex items-center gap-2">9. International Data Transfers</a>
            <a href="#section-10" className="hover:text-[#30ff87] transition flex items-center gap-2">10. Contact DPO & Privacy Inquiries</a>
          </div>
        </div>

        {/* Document Content Sections */}
        <div className="space-y-10 text-sm text-neutral-300 leading-relaxed">
          <section id="section-1" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">01</span>
              <h2 className="text-lg font-bold text-white">Overview & Commitment</h2>
            </div>
            <p>
              StatusEnzin Systems Inc. (&ldquo;StatusEnzin&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) operates a multi-tenant cloud monitoring and public status page platform. This Privacy Policy explains how we collect, process, disclose, and safeguard personal and technical data when you use our website, application, or monitoring services.
            </p>
            <p>
              We adhere strictly to data minimization principles: we collect only the data necessary to provide accurate, reliable uptime telemetry and incident notifications.
            </p>
          </section>

          <section id="section-2" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">02</span>
              <h2 className="text-lg font-bold text-white">Information We Collect</h2>
            </div>
            <p>We process the following categories of data:</p>
            <div className="space-y-3">
              <div className="rounded-lg bg-neutral-900/80 p-4 border border-neutral-800 space-y-1">
                <h4 className="text-white font-semibold text-xs font-mono uppercase text-[#30ff87]">A. Account & Profile Data</h4>
                <p className="text-xs text-neutral-400">Full name, corporate email address, hashed passwords, organization name, tenant slug, and billing details (managed via Stripe).</p>
              </div>
              <div className="rounded-lg bg-neutral-900/80 p-4 border border-neutral-800 space-y-1">
                <h4 className="text-white font-semibold text-xs font-mono uppercase text-[#30ff87]">B. Service Monitoring Metadata</h4>
                <p className="text-xs text-neutral-400">Target endpoint URLs, check intervals, expected HTTP status codes, latency response times, SSL certificate expiration dates, and incident log entries.</p>
              </div>
              <div className="rounded-lg bg-neutral-900/80 p-4 border border-neutral-800 space-y-1">
                <h4 className="text-white font-semibold text-xs font-mono uppercase text-[#30ff87]">C. Status Page Subscriber Emails</h4>
                <p className="text-xs text-neutral-400">Email addresses submitted by your customers to receive automated incident notification alerts.</p>
              </div>
              <div className="rounded-lg bg-neutral-900/80 p-4 border border-neutral-800 space-y-1">
                <h4 className="text-white font-semibold text-xs font-mono uppercase text-[#30ff87]">D. Technical Diagnostics & Telemetry</h4>
                <p className="text-xs text-neutral-400">IP addresses, browser type, user-agent strings, referral sources, and platform access timestamps.</p>
              </div>
            </div>
          </section>

          <section id="section-3" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">03</span>
              <h2 className="text-lg font-bold text-white">How We Use Data & Legal Basis</h2>
            </div>
            <p>
              We process personal data under the following legal bases under EU GDPR Article 6:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-400 pl-2">
              <li><strong className="text-white">Contract Performance (Art. 6(1)(b)):</strong> To operate your uptime monitoring checks, host public status pages, and process subscription payments.</li>
              <li><strong className="text-white">Legitimate Interests (Art. 6(1)(f)):</strong> To maintain platform security, prevent unauthorized load-testing, and optimize monitoring worker latency.</li>
              <li><strong className="text-white">Legal Obligations (Art. 6(1)(c)):</strong> To maintain accounting records and comply with tax regulations.</li>
            </ul>
          </section>

          <section id="section-4" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">04</span>
              <h2 className="text-lg font-bold text-white">Multi-Tenant Data Security & Encryption</h2>
            </div>
            <p>
              StatusEnzin enforces robust technical and organizational security controls:
            </p>
            <div className="rounded-lg bg-neutral-900/80 p-4 border border-neutral-800 text-xs space-y-2 font-mono text-neutral-300">
              <p>&bull; Strict database tenant query isolation (`where tenantId = tenant_id`) preventing cross-tenant data exposure.</p>
              <p>&bull; AES-256 encryption at rest for database records and backup archives.</p>
              <p>&bull; TLS 1.3 encryption for all data in transit across public networks.</p>
              <p>&bull; JWT token authentication with short-lived session authorization headers.</p>
            </div>
          </section>

          <section id="section-5" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">05</span>
              <h2 className="text-lg font-bold text-white">Third-Party Subprocessors</h2>
            </div>
            <p>
              We share data with verified third-party subprocessors solely to facilitate service delivery:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <span className="font-mono text-[#30ff87] font-bold block">Stripe Inc.</span>
                <span className="text-neutral-400">PCI-DSS compliant payment processing & subscription billing.</span>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <span className="font-mono text-[#30ff87] font-bold block">Transactional Email</span>
                <span className="text-neutral-400">Real-time incident dispatch & subscriber alerts via Resend.</span>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <span className="font-mono text-[#30ff87] font-bold block">Cloud Infrastructure</span>
                <span className="text-neutral-400">Secure hosting, CDN, and DDoS mitigation (Vercel & AWS).</span>
              </div>
            </div>
          </section>

          <section id="section-6" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">06</span>
              <h2 className="text-lg font-bold text-white">Data Retention & Automatic Purging</h2>
            </div>
            <p>
              Detailed HTTP check ping logs are retained for 90 days for rolling performance metrics, after which ping telemetries are aggregated into historical uptime percentages and raw check logs are permanently purged.
            </p>
            <p>
              Upon tenant account deletion, all associated monitors, status pages, incident logs, and subscriber records are purged within 30 days.
            </p>
          </section>

          <section id="section-7" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">07</span>
              <h2 className="text-lg font-bold text-white">Cookies & Local Storage</h2>
            </div>
            <p>
              StatusEnzin does not use third-party advertising cookies or cross-site tracking scripts. We utilize local browser storage (`localStorage`) strictly to store session authentication tokens (`statusenzin_token`) and cached user preferences (`statusenzin_user`) required to render the application.
            </p>
          </section>

          <section id="section-8" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">08</span>
              <h2 className="text-lg font-bold text-white">Your Privacy Rights (GDPR & CCPA)</h2>
            </div>
            <p>Depending on your location, you hold the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-1.5 text-neutral-400 pl-2">
              <li><strong className="text-white">Right to Access & Export:</strong> Request a copy of all personal data held in machine-readable JSON format.</li>
              <li><strong className="text-white">Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Request deletion of your account and all associated tenant data.</li>
              <li><strong className="text-white">Right to Rectification:</strong> Update or correct inaccurate account or company profile information.</li>
              <li><strong className="text-white">Right to Non-Discrimination:</strong> We do not sell personal information or discriminate against users exercising privacy rights.</li>
            </ul>
          </section>

          <section id="section-9" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">09</span>
              <h2 className="text-lg font-bold text-white">International Data Transfers</h2>
            </div>
            <p>
              Data collected by StatusEnzin is processed in data centers located in the United States and European Union. For transfers of EU personal data to countries outside the EEA, we rely on standard contractual clauses (SCCs) approved by the European Commission.
            </p>
          </section>

          <section id="section-10" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">10</span>
              <h2 className="text-lg font-bold text-white">Contact Us & Privacy Officer</h2>
            </div>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact our Data Protection Officer (DPO):
            </p>
            <div className="pt-3 border-t border-vercel-border text-xs font-mono text-neutral-400 space-y-1">
              <p className="text-white font-sans font-semibold text-sm">StatusEnzin Data Privacy Office</p>
              <p>Email: privacy@statusenzin.me</p>
              <p>Address: 100 Enterprise Way, Suite 400, San Francisco, CA 94107</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
