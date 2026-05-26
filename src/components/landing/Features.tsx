import {
  GraduationCap,
  Database,
  Video,
  Mail,
  FileBarChart,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type Feature = { icon: LucideIcon; title: string; desc: string };

const features: Feature[] = [
  {
    icon: GraduationCap,
    title: "LLM Fine-Tuning",
    desc: "Employee-specific model training on emails, docs, decisions — private & on-premise.",
  },
  {
    icon: Database,
    title: "RAG + Vector DB",
    desc: "Real-time retrieval of company knowledge, project history, personal preferences.",
  },
  {
    icon: Video,
    title: "Meeting Presence",
    desc: "Twin joins Zoom/Teams, speaks in employee's communication style, takes notes.",
  },
  {
    icon: Mail,
    title: "Email Autopilot",
    desc: "Drafts and sends replies matching tone, context, and decision authority.",
  },
  {
    icon: FileBarChart,
    title: "Report Generation",
    desc: "Weekly/monthly reports built in employee's exact format and vocabulary.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Data Leak",
    desc: "On-premise deployment, SOC2 compliant. Your data never leaves your infrastructure.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Features
        </div>
        <h2 className="mt-4 max-w-2xl text-4xl font-bold sm:text-5xl">
          Everything your twin needs.
        </h2>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-card p-8 transition-colors hover:bg-card/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-heading text-lg font-bold">
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
