import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TwinForce" },
      { name: "description", content: "TwinForce Privacy Policy, Data Processing Agreement, and Cookie Policy." },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    id: "overview",
    title: "Privacy Overview",
    body: `TwinForce, Inc. ("TwinForce", "we", "our") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share information when you use our platform and services. By using TwinForce, you agree to the practices described in this policy.

Last updated: June 1, 2026.`,
  },
  {
    id: "data-we-collect",
    title: "Data We Collect",
    body: `We collect the following categories of data:

• **Account data** — name, email address, company name, job title, and password (hashed with bcrypt, never stored in plain text).
• **Usage data** — feature usage, API calls, session duration, and interaction logs.
• **Content data** — knowledge base documents, meeting transcripts, email drafts, and twin configuration data you upload.
• **Technical data** — IP address, browser type, device identifiers, and log data.
• **Billing data** — payment method type and last four digits (full card data processed by Stripe; we do not store raw card numbers).`,
  },
  {
    id: "how-we-use",
    title: "How We Use Your Data",
    body: `We use your data to:

• Provide, operate, and improve the TwinForce platform.
• Authenticate users and enforce multi-tenant isolation.
• Train and operate AI twin models (only on your organization's own data; we do not cross-contaminate between tenants).
• Send transactional emails (password reset, billing notifications, product updates you opted in to).
• Comply with legal obligations and enforce our Terms of Service.
• Detect and prevent fraud, abuse, and security incidents.

We do not sell your personal data to third parties.`,
  },
  {
    id: "data-storage",
    title: "Data Storage & Retention",
    body: `• **Encryption** — All data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.3).
• **Data residency** — Enterprise customers may choose their data region: US, EU (Frankfurt), or APAC (Singapore).
• **Retention** — Account data is retained for the duration of your subscription plus 90 days after cancellation. Audit logs are retained for 12 months by default (configurable).
• **Deletion** — You may request deletion of your data at any time. We will complete deletion within 30 days and provide written confirmation.`,
  },
  {
    id: "third-parties",
    title: "Third-Party Services",
    body: `TwinForce uses the following sub-processors:

• **Supabase** — Authentication and identity management.
• **Stripe** — Payment processing (PCI DSS Level 1 compliant).
• **AWS / Google Cloud** — Infrastructure and object storage.
• **OpenAI / Anthropic** — AI inference (data is not used to train their models; processed under enterprise DPA).
• **Sentry** — Error tracking (anonymized stack traces only).
• **Pino / internal logging** — Structured logs (no PII in log payloads).

A full list of sub-processors is available upon request.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    body: `Depending on your jurisdiction, you may have the right to:

• **Access** — Request a copy of your personal data.
• **Rectification** — Correct inaccurate or incomplete data.
• **Erasure** — Request deletion of your data ("right to be forgotten").
• **Portability** — Receive your data in a machine-readable format.
• **Restriction** — Limit processing of your data in certain circumstances.
• **Objection** — Object to processing based on legitimate interests.

To exercise any of these rights, contact us at privacy@twinforce.ai. We will respond within 30 days.`,
  },
  {
    id: "dpa",
    title: "Data Processing Agreement (DPA)",
    body: `For customers subject to GDPR, CCPA, or other data protection regulations, TwinForce offers a Data Processing Agreement (DPA) that governs how we process personal data on your behalf as a data processor.

Key DPA terms:
• TwinForce acts as a data processor; you are the data controller.
• We process data only on your documented instructions.
• We maintain appropriate technical and organizational measures to protect data.
• We notify you of any data breaches within 72 hours.
• We support your obligations to respond to data subject rights requests.
• Sub-processor changes are notified 30 days in advance.

To request a signed DPA, email legal@twinforce.ai.`,
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    body: `TwinForce uses cookies and similar technologies to:

**Essential cookies** (always active):
• Session authentication token (httpOnly, secure, SameSite=Strict)
• CSRF protection token
• User preference settings (theme, language)

**Analytics cookies** (opt-in):
• Anonymous usage analytics to improve the product
• Performance monitoring (no PII)

**How to manage cookies:**
You can disable non-essential cookies at any time via your browser settings or the cookie preference center accessible from the footer. Disabling essential cookies will prevent you from using the platform.`,
  },
  {
    id: "contact",
    title: "Contact & DPO",
    body: `For privacy questions, data requests, or DPA inquiries:

• **Email**: privacy@twinforce.ai
• **Data Protection Officer**: dpo@twinforce.ai
• **Mailing address**: TwinForce, Inc., 350 Fifth Avenue, New York, NY 10118

For EU residents, our EU representative is: TwinForce EU Ltd, 1 Churchill Place, London, E14 5HP, UK.`,
  },
];

function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
      <div className="relative z-10">
        <Navbar />

        <div className="border-b border-border py-16 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-muted-foreground">Last updated June 1, 2026 · Effective immediately</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-3xl space-y-12 px-6 py-16">
          {sections.map((s) => (
            <section id={s.id} key={s.id} className="scroll-mt-20">
              <h2 className="border-b border-border pb-3 text-xl font-bold">{s.title}</h2>
              <div className="mt-4 space-y-3">
                {s.body.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </main>

        <Footer />
      </div>
    </div>
  );
}
