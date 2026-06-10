import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — TwinForce" },
      { name: "description", content: "TwinForce Terms of Service — the rules and guidelines for using our platform." },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: `By accessing or using TwinForce (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.

If you do not agree to these Terms, do not use the Service. TwinForce reserves the right to update these Terms at any time. We will notify you of material changes by email or via the platform. Continued use after changes constitutes acceptance.`,
  },
  {
    id: "service",
    title: "2. The Service",
    body: `TwinForce provides an enterprise AI digital twin platform that enables organizations to create, deploy, and manage AI agents ("Twins") that replicate the knowledge and workflows of their personnel.

The Service includes:
• Web application and APIs for twin creation and management
• Knowledge base ingestion and vector search
• Meeting intelligence and transcript processing
• Email intelligence and draft generation
• Analytics, audit logs, and administration tools
• Integration connectors and webhooks

TwinForce reserves the right to modify, suspend, or discontinue any feature of the Service with reasonable notice.`,
  },
  {
    id: "accounts",
    title: "3. Accounts & Organizations",
    body: `• You must create an account to use the Service. You are responsible for maintaining the security of your credentials.
• Each account belongs to one Organization. Organizations are isolated — data from one Organization is never accessible to another.
• The "Owner" of an Organization is responsible for managing members, billing, and compliance within that Organization.
• You may not share your credentials or allow unauthorized access to your account. You must notify us immediately of any suspected unauthorized access.
• TwinForce may suspend or terminate accounts that violate these Terms without notice in cases of abuse, fraud, or security risk.`,
  },
  {
    id: "data",
    title: "4. Your Content & Data",
    body: `• You retain all rights to the content and data you upload to TwinForce ("Customer Data").
• By uploading Customer Data, you grant TwinForce a limited license to process and store that data solely to provide the Service to you.
• TwinForce does not use your Customer Data to train AI models for other customers or for our own general-purpose models.
• You are responsible for ensuring that your Customer Data does not violate any applicable laws, third-party intellectual property rights, or privacy regulations.
• You must not upload content that is illegal, harmful, defamatory, or that violates the rights of others.`,
  },
  {
    id: "acceptable-use",
    title: "5. Acceptable Use",
    body: `You may not use the Service to:

• Violate any applicable law or regulation.
• Infringe the intellectual property rights of any third party.
• Transmit malware, spam, or any harmful code.
• Attempt to gain unauthorized access to the Service, other accounts, or TwinForce's infrastructure.
• Reverse engineer, decompile, or disassemble any portion of the Service.
• Use the Service to build a competing product.
• Generate content that is harassing, defamatory, obscene, or that violates the rights of others.
• Overload or disrupt the Service (including automated scraping or stress testing without prior written consent).

Violation of these rules may result in immediate account termination.`,
  },
  {
    id: "billing",
    title: "6. Billing & Payments",
    body: `• Subscription fees are billed in advance on a monthly or annual basis, depending on your plan.
• All fees are in USD and are non-refundable except as required by law or as stated in our refund policy.
• If payment fails, we will notify you and attempt to collect payment for 10 days. After that, your account may be suspended.
• You may cancel your subscription at any time from the billing settings. Cancellation takes effect at the end of the current billing period.
• TwinForce may change pricing with 30 days' advance notice. Existing customers on annual plans are protected at their contracted price for the remainder of their term.`,
  },
  {
    id: "ip",
    title: "7. Intellectual Property",
    body: `• TwinForce and its licensors own all intellectual property rights in the Service, including the platform, code, design, trademarks, and documentation.
• You are granted a limited, non-exclusive, non-transferable license to use the Service for your internal business purposes during your subscription term.
• You do not acquire any ownership rights in the Service or its underlying technology.
• The TwinForce name, logo, and product names are trademarks of TwinForce, Inc. You may not use them without prior written consent.`,
  },
  {
    id: "warranty",
    title: "8. Disclaimers & Limitation of Liability",
    body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

TO THE MAXIMUM EXTENT PERMITTED BY LAW, TWINFORCE'S TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) $100 OR (B) THE FEES YOU PAID IN THE 12 MONTHS PRIOR TO THE CLAIM.

IN NO EVENT SHALL TWINFORCE BE LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.`,
  },
  {
    id: "termination",
    title: "9. Termination",
    body: `Either party may terminate the agreement at any time:
• You may terminate by canceling your subscription and deleting your account.
• TwinForce may terminate or suspend your access for material breach of these Terms, non-payment, or for legal or security reasons.

Upon termination:
• Your access to the Service will cease immediately (or at end of billing period for voluntary cancellation).
• We will retain your data for 90 days after termination, during which you may request an export.
• After 90 days, your data will be permanently deleted.`,
  },
  {
    id: "governing",
    title: "10. Governing Law & Disputes",
    body: `These Terms are governed by the laws of the State of New York, USA, without regard to conflict of law provisions.

Any disputes arising from these Terms or the Service shall be resolved through binding arbitration administered by the American Arbitration Association (AAA), except that either party may seek injunctive relief in a court of competent jurisdiction for IP infringement or breach of confidentiality.

You agree to resolve disputes individually — class actions and class arbitrations are waived.

For EU and UK users, mandatory statutory rights under local consumer protection laws are not affected by these Terms.`,
  },
  {
    id: "contact",
    title: "11. Contact",
    body: `For questions about these Terms:

• **Email**: legal@twinforce.ai
• **Mailing address**: TwinForce, Inc., 350 Fifth Avenue, New York, NY 10118

For EU/UK legal inquiries: TwinForce EU Ltd, 1 Churchill Place, London, E14 5HP, UK.`,
  },
];

function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
      <div className="relative z-10">
        <Navbar />

        <div className="border-b border-border py-16 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-4xl font-bold sm:text-5xl">Terms of Service</h1>
            <p className="mt-4 text-muted-foreground">Last updated June 1, 2026 · Effective immediately</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s.title.replace(/^\d+\.\s/, "")}
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
