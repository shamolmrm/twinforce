import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BookOpen, Shield, Activity, Newspaper, Users, Briefcase, Megaphone, GitMerge } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs & Resources — TwinForce" },
      { name: "description", content: "TwinForce documentation, company information, blog, security, and more." },
    ],
  }),
  component: DocsPage,
});

const sections = [
  {
    id: "about",
    icon: Users,
    title: "About TwinForce",
    content: [
      "TwinForce is the enterprise platform for deploying AI digital twins of your workforce. Founded in 2023, we help organizations automate operational workflows by creating governed, observable AI agents that replicate the knowledge and decision-making of your best operators.",
      "Our platform is used by Fortune 500 companies across customer support, sales, engineering, legal, and healthcare — enabling 24/7 autonomous execution without sacrificing brand tone, compliance, or human oversight.",
      "Headquartered in New York with engineering hubs in London and Singapore, TwinForce is backed by leading enterprise software investors.",
    ],
  },
  {
    id: "changelog",
    icon: GitMerge,
    title: "Changelog",
    entries: [
      { version: "v2.4.0", date: "June 2026", notes: "Admin console, multi-tenant isolation, super admin role, OAuth improvements." },
      { version: "v2.3.0", date: "May 2026", notes: "Email intelligence module GA, HIPAA mode, new analytics dashboard." },
      { version: "v2.2.0", date: "April 2026", notes: "Knowledge base v2, Qdrant vector search, chunk-level citations." },
      { version: "v2.1.0", date: "March 2026", notes: "Meeting intelligence with Zoom & Teams, action item extraction." },
      { version: "v2.0.0", date: "February 2026", notes: "Full platform rewrite — TanStack Start frontend, Hono API, Drizzle ORM." },
      { version: "v1.9.0", date: "January 2026", notes: "SOC 2 Type II certification achieved, audit logs, data retention controls." },
    ],
  },
  {
    id: "blog",
    icon: Newspaper,
    title: "Blog",
    posts: [
      { title: "The Future of Work Is Digital Twins", date: "June 5, 2026", excerpt: "How enterprise teams are deploying AI agents that think and respond like their best people." },
      { title: "Building Governed AI: Lessons from 100 Deployments", date: "May 20, 2026", excerpt: "What we've learned about trust, observability, and escalation in enterprise AI agents." },
      { title: "SOC 2 Type II: What It Means for Your Data", date: "April 15, 2026", excerpt: "A deep dive into our compliance posture and what it means for enterprise customers." },
      { title: "Multi-Tenant Architecture at Scale", date: "March 10, 2026", excerpt: "How TwinForce enforces complete isolation between organizations at the database level." },
    ],
  },
  {
    id: "customers",
    icon: Briefcase,
    title: "Customers",
    content: [
      "TwinForce is trusted by over 300 enterprise customers across 40+ countries. Our customers span financial services, healthcare, retail, manufacturing, and professional services.",
      "From Fortune 500 companies automating tier-1 support at 10,000 tickets/day to growing SaaS startups deploying their first AI sales agent, TwinForce scales to meet your needs.",
      "Customer case studies, ROI calculators, and reference customers are available upon request. Contact our sales team to learn how organizations like yours are deploying digital twin workforces.",
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security",
    items: [
      { label: "SOC 2 Type II", desc: "Certified annually. Full audit reports available under NDA." },
      { label: "Data Encryption", desc: "AES-256-GCM at rest, TLS 1.3 in transit. Keys managed per tenant." },
      { label: "Multi-Tenant Isolation", desc: "Row-level security on all database tables. No cross-tenant data access." },
      { label: "GDPR & CCPA", desc: "Full data subject rights. Configurable data residency (EU, US, APAC)." },
      { label: "HIPAA Ready", desc: "BAA available. PHI handling mode with field-level encryption." },
      { label: "Penetration Testing", desc: "Quarterly third-party pen tests. Vulnerability disclosure program active." },
      { label: "SSO & MFA", desc: "SAML 2.0, OIDC, and SCIM provisioning. Enforced MFA for admin accounts." },
      { label: "Incident Response", desc: "24-hour SLA for critical vulnerabilities. Dedicated security contact." },
    ],
  },
  {
    id: "status",
    icon: Activity,
    title: "Status",
    systems: [
      { name: "API (Global)", status: "operational" },
      { name: "Frontend / Web App", status: "operational" },
      { name: "AI Inference Service", status: "operational" },
      { name: "Knowledge Base & Vector Search", status: "operational" },
      { name: "Meeting Intelligence", status: "operational" },
      { name: "Email Processing", status: "operational" },
      { name: "Webhooks & Integrations", status: "operational" },
      { name: "Billing & Subscriptions", status: "operational" },
    ],
  },
  {
    id: "careers",
    icon: Users,
    title: "Careers",
    content: [
      "We're building the future of work — and we're hiring across engineering, product, design, sales, and customer success.",
      "TwinForce is a remote-first company with hubs in New York, London, and Singapore. We offer competitive salaries, equity, unlimited PTO, and full benefits.",
    ],
    roles: [
      { title: "Senior Staff Engineer — AI Infrastructure", location: "Remote (US)" },
      { title: "Product Manager — Enterprise Platform", location: "New York, NY" },
      { title: "Account Executive — Enterprise Sales", location: "Remote (US/EU)" },
      { title: "Solutions Engineer", location: "Remote (Global)" },
      { title: "Head of Customer Success", location: "New York, NY" },
    ],
  },
  {
    id: "press",
    icon: Megaphone,
    title: "Press",
    mentions: [
      { outlet: "TechCrunch", headline: "TwinForce raises $40M Series B to scale AI workforce automation", date: "March 2026" },
      { outlet: "Forbes", headline: "The 10 Enterprise AI Startups Redefining the Future of Work", date: "February 2026" },
      { outlet: "VentureBeat", headline: "TwinForce's digital twin platform achieves SOC 2 Type II", date: "January 2026" },
      { outlet: "The Information", headline: "Inside the Race to Build AI Agents That Think Like Your Best Employee", date: "December 2025" },
    ],
  },
];

function StatusDot({ status }: { status: string }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className={`inline-block h-2 w-2 rounded-full ${status === "operational" ? "bg-green-400" : status === "degraded" ? "bg-yellow-400" : "bg-red-400"}`} />
      <span className={`capitalize ${status === "operational" ? "text-green-400" : status === "degraded" ? "text-yellow-400" : "text-red-400"}`}>
        {status}
      </span>
    </span>
  );
}

function DocsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <div className="border-b border-border py-16 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <BookOpen className="h-3 w-3" /> Documentation & Resources
            </div>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Everything you need to know</h1>
            <p className="mt-4 text-muted-foreground">
              Company info, changelog, security posture, system status, and more — all in one place.
            </p>
            {/* Quick jump */}
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

        {/* Sections */}
        <main className="mx-auto max-w-4xl space-y-16 px-6 py-16">
          {sections.map((s) => (
            <section id={s.id} key={s.id} className="scroll-mt-20">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{s.title}</h2>
              </div>

              {/* About / Customers */}
              {"content" in s && !("roles" in s) && (
                <div className="mt-6 space-y-4">
                  {(s.content as string[]).map((p, i) => (
                    <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
                  ))}
                </div>
              )}

              {/* Changelog */}
              {"entries" in s && (
                <div className="mt-6 space-y-4">
                  {(s.entries as { version: string; date: string; notes: string }[]).map((e) => (
                    <div key={e.version} className="flex gap-4 rounded-xl border border-border bg-card/60 p-4">
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-sm font-semibold text-primary">{e.version}</div>
                        <div className="text-xs text-muted-foreground">{e.date}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{e.notes}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Blog */}
              {"posts" in s && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {(s.posts as { title: string; date: string; excerpt: string }[]).map((p) => (
                    <div key={p.title} className="rounded-xl border border-border bg-card/60 p-5 hover:border-primary/40 transition-colors">
                      <div className="text-xs text-muted-foreground">{p.date}</div>
                      <h3 className="mt-2 font-semibold leading-snug">{p.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Security */}
              {"items" in s && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {(s.items as { label: string; desc: string }[]).map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-card/60 p-4">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-sm font-semibold">{item.label}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Status */}
              {"systems" in s && (
                <div className="mt-6 space-y-2">
                  <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-center text-sm font-medium text-green-400">
                    All systems operational
                  </div>
                  {(s.systems as { name: string; status: string }[]).map((sys) => (
                    <div key={sys.name} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3">
                      <span className="text-sm">{sys.name}</span>
                      <StatusDot status={sys.status} />
                    </div>
                  ))}
                </div>
              )}

              {/* Careers */}
              {"roles" in s && (
                <>
                  <div className="mt-6 space-y-4">
                    {(s.content as string[]).map((p, i) => (
                      <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
                    ))}
                  </div>
                  <div className="mt-6 space-y-3">
                    {(s.roles as { title: string; location: string }[]).map((r) => (
                      <div key={r.title} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-5 py-4">
                        <div>
                          <div className="font-semibold text-sm">{r.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{r.location}</div>
                        </div>
                        <a href="/contact" className="shrink-0 rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                          Apply
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Press */}
              {"mentions" in s && (
                <div className="mt-6 space-y-3">
                  {(s.mentions as { outlet: string; headline: string; date: string }[]).map((m) => (
                    <div key={m.headline} className="rounded-xl border border-border bg-card/60 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">{m.outlet}</span>
                        <span className="text-xs text-muted-foreground">{m.date}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium">{m.headline}</p>
                    </div>
                  ))}
                  <p className="mt-4 text-sm text-muted-foreground">
                    Press inquiries: <a href="mailto:press@twinforce.ai" className="text-primary hover:underline">press@twinforce.ai</a>
                  </p>
                </div>
              )}
            </section>
          ))}
        </main>

        <Footer />
      </div>
    </div>
  );
}
