import {
  Bot,
  Library,
  Activity,
  ShieldCheck,
  ScrollText,
  Plug,
  type LucideIcon,
} from "lucide-react";

type Feature = { icon: LucideIcon; title: string; desc: string };

const features: Feature[] = [
  {
    icon: Bot,
    title: "Autonomous Agents",
    desc: "Goal-driven twins that plan, execute, and self-correct across multi-step workflows.",
  },
  {
    icon: Library,
    title: "Skill Library",
    desc: "Reusable, versioned capabilities your twins compose on demand — no prompt sprawl.",
  },
  {
    icon: Activity,
    title: "Realtime Telemetry",
    desc: "Live traces, token economics, and outcome metrics for every twin in production.",
  },
  {
    icon: ShieldCheck,
    title: "Policy Guardrails",
    desc: "Enforce rules, redactions, and approval gates — declared once, applied everywhere.",
  },
  {
    icon: ScrollText,
    title: "Immutable Audit Trail",
    desc: "SOC 2 / ISO 27001-ready evidence of every decision, input, and tool call.",
  },
  {
    icon: Plug,
    title: "Native Integrations",
    desc: "150+ connectors for SaaS, data, and identity. Drop twins into your existing stack.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Platform
          </div>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">
            Everything you need to run a twin workforce.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for the security, observability, and reliability bar that
            enterprise operations demand.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative bg-card p-8 transition-colors hover:bg-card/70"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}