import { Building2, Code2, Factory, GraduationCap, Headphones, Landmark, LineChart, Megaphone, Scale, ShoppingCart, Stethoscope, UserCheck, type LucideIcon } from "lucide-react";

type UseCase = { icon: LucideIcon; role: string; impact: string; desc: string };

const cases: UseCase[] = [
  { icon: Headphones, role: "Customer Support", impact: "-68% AHT", desc: "Tier-1 tickets resolved with brand tone & escalation logic." },
  { icon: Code2, role: "Engineering", impact: "3.4x velocity", desc: "Sprint planning, PR review, on-call triage handled overnight." },
  { icon: LineChart, role: "Sales Ops", impact: "+42% pipeline", desc: "Lead enrichment, follow-ups, CRM hygiene on autopilot." },
  { icon: Megaphone, role: "Marketing", impact: "10x output", desc: "Brand-consistent copy, briefs, and campaign analysis." },
  { icon: Scale, role: "Legal & Compliance", impact: "Zero leak", desc: "Contract review with redlines in your firm's voice." },
  { icon: Stethoscope, role: "Healthcare Ops", impact: "HIPAA", desc: "Clinical note drafting and care coordination workflows." },
  { icon: ShoppingCart, role: "E-commerce & Retail", impact: "+55% conv", desc: "Product Q&A, returns, cart recovery in local language & tone." },
  { icon: Landmark, role: "FinTech & Banking", impact: "-80% KYC time", desc: "Onboarding, fraud alerts, and account servicing at scale." },
  { icon: Building2, role: "Real Estate", impact: "3x leads", desc: "Property inquiries, viewings, and follow-ups on autopilot." },
  { icon: Factory, role: "Manufacturing", impact: "-45% downtime", desc: "Vendor coordination, inventory alerts, and QC workflows." },
  { icon: UserCheck, role: "HR & Talent", impact: "-60% hire time", desc: "Screening, scheduling, and onboarding at high volume." },
  { icon: GraduationCap, role: "EdTech", impact: "24/7 tutor", desc: "Student support, grading help, and course guidance round the clock." },
];

export function UseCases() {
  return (
    <section id="use-cases" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Use Cases
            </div>
            <h2 className="mt-4 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
              Built for every role on your team.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            From the contact center to the boardroom — twins ship measurable
            outcomes in week one.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.role}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition-all hover:border-primary/40 hover:bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {c.impact}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold">{c.role}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}