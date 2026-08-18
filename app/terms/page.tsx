import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShieldCheck, FileText, Scale, CreditCard, AlertTriangle, Lock, HelpCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-vercel-text flex flex-col justify-between">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 flex-1 w-full">
        {/* Page Header */}
        <div className="border-b border-vercel-border pb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-[#30ff87] mb-3">
            <Scale className="h-4 w-4" />
            <span>LEGAL AGREEMENT & TERMS</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-sm text-vercel-muted max-w-2xl leading-relaxed">
            Please read these Terms of Service carefully before accessing or using StatusEnzin&rsquo;s multi-tenant uptime monitoring and status page services.
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
            Document Sections
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-neutral-300">
            <a href="#section-1" className="hover:text-[#30ff87] transition flex items-center gap-2">1. Acceptance of Terms</a>
            <a href="#section-2" className="hover:text-[#30ff87] transition flex items-center gap-2">2. Service Description & Architecture</a>
            <a href="#section-3" className="hover:text-[#30ff87] transition flex items-center gap-2">3. Account Security & Credentials</a>
            <a href="#section-4" className="hover:text-[#30ff87] transition flex items-center gap-2">4. Subscriptions, Billing & Cancellations</a>
            <a href="#section-5" className="hover:text-[#30ff87] transition flex items-center gap-2">5. Acceptable Use & Ping Limits</a>
            <a href="#section-6" className="hover:text-[#30ff87] transition flex items-center gap-2">6. Service Level & SLA Commitments</a>
            <a href="#section-7" className="hover:text-[#30ff87] transition flex items-center gap-2">7. IP & Tenant Data Ownership</a>
            <a href="#section-8" className="hover:text-[#30ff87] transition flex items-center gap-2">8. Limitation of Liability</a>
            <a href="#section-9" className="hover:text-[#30ff87] transition flex items-center gap-2">9. Termination & Account Suspension</a>
            <a href="#section-10" className="hover:text-[#30ff87] transition flex items-center gap-2">10. Governing Law & Contact Info</a>
          </div>
        </div>

        {/* Document Content Sections */}
        <div className="space-y-10 text-sm text-neutral-300 leading-relaxed">
          <section id="section-1" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">01</span>
              <h2 className="text-lg font-bold text-white">Acceptance of Terms</h2>
            </div>
            <p>
              By signing up for an account, accessing, or using the StatusEnzin platform (&ldquo;Service&rdquo;), provided by StatusEnzin Systems Inc. (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
            </p>
            <p>
              If you are accepting these Terms on behalf of a company, organization, or other legal entity, you represent and warrant that you have full legal authority to bind such entity to these Terms. If you do not agree to these Terms, you must not access or use our Service.
            </p>
          </section>

          <section id="section-2" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">02</span>
              <h2 className="text-lg font-bold text-white">Service Description & Multi-Tenant Architecture</h2>
            </div>
            <p>
              StatusEnzin provides automated HTTP/HTTPS health-check monitoring, latency telemetry analytics, public/private status page hosting, and incident notification alerts.
            </p>
            <p>
              The Service operates on a isolated multi-tenant cloud architecture. Each organization (&ldquo;Tenant&rdquo;) is assigned a distinct logical environment. We reserve the right to modify, enhance, or discontinue features of the Service at any time with prior notice when feasible.
            </p>
          </section>

          <section id="section-3" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">03</span>
              <h2 className="text-lg font-bold text-white">Account Registration & Security</h2>
            </div>
            <p>
              To utilize the Service, you must register for an account by providing accurate, complete, and current information. You are solely responsible for maintaining the confidentiality of your account credentials, API keys, and access tokens.
            </p>
            <p>
              You must immediately notify StatusEnzin security personnel of any unauthorized access to or compromise of your credentials. StatusEnzin cannot and will not be liable for any loss or damage arising from your failure to comply with security obligations.
            </p>
          </section>

          <section id="section-4" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">04</span>
              <h2 className="text-lg font-bold text-white">Subscriptions, Billing & Payment Processing</h2>
            </div>
            <p>
              StatusEnzin offers tiered subscription plans (Starter, Pro, Business, and Enterprise). Subscriptions are billed in advance on a recurring monthly or annual basis via Stripe.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-neutral-400 pl-2">
              <strong className="text-white block font-sans font-medium mb-1">Billing Conditions:</strong>
              <li>Auto-Renewal: Subscriptions automatically renew at the end of each billing cycle unless cancelled prior to the renewal date.</li>
              <li>Payment Failure: If payment authorization fails, access to paid features may be suspended after a 7-day grace period.</li>
              <li>Refunds: Fees paid hereunder are non-refundable except as required by law or specified in a signed Enterprise SLA.</li>
            </ul>
          </section>

          <section id="section-5" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">05</span>
              <h2 className="text-lg font-bold text-white">Acceptable Use Policy & System Constraints</h2>
            </div>
            <p>
              You agree to use StatusEnzin solely for lawful monitoring purposes. You shall not:
            </p>
            <div className="rounded-lg bg-neutral-900/80 p-4 border border-neutral-800 text-xs space-y-2 font-mono text-neutral-300">
              <p>&bull; Target endpoints or URLs without proper authorization from the endpoint owner.</p>
              <p>&bull; Use health-check probes to conduct Denial-of-Service (DoS) attacks or unauthorized security scanning.</p>
              <p>&bull; Attempt to bypass tenant isolation boundaries, reverse engineer the platform, or exploit system vulnerabilities.</p>
              <p>&bull; Send spam notifications or bulk unsolicited emails through our incident notification webhook integration.</p>
            </div>
          </section>

          <section id="section-6" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">06</span>
              <h2 className="text-lg font-bold text-white">Service Level Commitment (SLA)</h2>
            </div>
            <p>
              StatusEnzin strives to maintain a 99.9% operational uptime commitment for our core health-check monitoring worker fleet and status page rendering infrastructure.
            </p>
            <p>
              Scheduled maintenance windows will be communicated at least 24 hours in advance via our public status portal. Service outages resulting from upstream cloud service providers (AWS, Vercel, Cloudflare) are excluded from standard uptime metrics.
            </p>
          </section>

          <section id="section-7" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">07</span>
              <h2 className="text-lg font-bold text-white">Intellectual Property & Content Ownership</h2>
            </div>
            <p>
              You retain full ownership of all data, logos, text, and telemetry configurations uploaded to your tenant status pages (&ldquo;Tenant Content&rdquo;). You grant StatusEnzin a limited, worldwide license to host, display, and process Tenant Content solely to provide the Service.
            </p>
            <p>
              StatusEnzin retains all right, title, and interest in and to the platform, including codebase, trademarks, UI designs, algorithms, and documentation.
            </p>
          </section>

          <section id="section-8" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">08</span>
              <h2 className="text-lg font-bold text-white">Limitation of Liability</h2>
            </div>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL STATUSENZIN INC., ITS DIRECTORS, EMPLOYEES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS INTERRUPTION) ARISING OUT OF OR IN CONNECTION WITH THE SERVICE.
            </p>
            <p>
              OUR TOTAL CUMULATIVE LIABILITY SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU TO STATUSENZIN IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>
          </section>

          <section id="section-9" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">09</span>
              <h2 className="text-lg font-bold text-white">Termination & Account Suspension</h2>
            </div>
            <p>
              You may terminate your account at any time through the Billing Dashboard. StatusEnzin reserves the right to suspend or terminate accounts that violate our Acceptable Use Policy or fail to pay subscription fees after due notification.
            </p>
            <p>
              Upon termination, your tenant access will be revoked, and tenant data will be permanently deleted in accordance with our Data Retention Policy.
            </p>
          </section>

          <section id="section-10" className="vercel-card rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-vercel-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30ff87]/10 text-xs font-mono font-bold text-[#30ff87]">10</span>
              <h2 className="text-lg font-bold text-white">Governing Law & Legal Inquiries</h2>
            </div>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Delaware, USA, without regard to its conflict of law principles.
            </p>
            <div className="pt-3 border-t border-vercel-border text-xs font-mono text-neutral-400 space-y-1">
              <p className="text-white font-sans font-semibold text-sm">StatusEnzin Legal Operations</p>
              <p>Email: legal@statusenzin.me</p>
              <p>Address: 100 Enterprise Way, Suite 400, San Francisco, CA 94107</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
