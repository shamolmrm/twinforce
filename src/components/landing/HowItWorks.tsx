import { ChevronRight, Mail, MessageSquare, Brain } from "lucide-react";

type Employee = {
  initials: string;
  name: string;
  role: string;
  status: string;
  statusColor: string;
  avatarBg: string;
  rows: { icon: typeof Mail; title: string; desc: string }[];
};

const employees: Employee[] = [
  {
    initials: "SJ",
    name: "Sarah Johnson",
    role: "VP of Product · Acme Corp",
    status: "On Leave",
    statusColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    avatarBg: "bg-emerald-500/20 text-emerald-300",
    rows: [
      {
        icon: Mail,
        title: "Sarah's patterns learned",
        desc: "3,200 emails, 480 decisions, 12mo data",
      },
      {
        icon: MessageSquare,
        title: "Communication style indexed",
        desc: "Async-first, data-driven, direct",
      },
      {
        icon: Brain,
        title: "Decision logic mapped",
        desc: "Stakeholder priorities, risk thresholds",
      },
    ],
  },
  {
    initials: "AK",
    name: "Arjun Kumar",
    role: "Eng Lead · Northwind",
    status: "Active",
    statusColor: "bg-primary/20 text-primary border-primary/30",
    avatarBg: "bg-indigo-500/20 text-indigo-300",
    rows: [
      {
        icon: Mail,
        title: "12 quarters of context",
        desc: "Sprint notes, PRs, postmortems indexed",
      },
      {
        icon: MessageSquare,
        title: "Sprint allocation logic",
        desc: "Gauges scope vs team velocity",
      },
      {
        icon: Brain,
        title: "Weekly report generation",
        desc: "Board-format summaries auto-shipped",
      },
    ],
  },
];

function EmployeeCard({ e }: { e: Employee }) {
  return (
    <div className="w-72 shrink-0 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
      <div className="flex items-start gap-3">
        <div
          className={
            "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold " +
            e.avatarBg
          }
        >
          {e.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-sm font-bold">{e.name}</div>
          <div className="truncate text-xs text-muted-foreground">{e.role}</div>
        </div>
        <span
          className={
            "rounded-full border px-2 py-0.5 text-[10px] font-medium " + e.statusColor
          }
        >
          {e.status}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {e.rows.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.title}
              className="rounded-lg border border-border bg-background/50 p-3"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">
                    {r.title}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {r.desc}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-border py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How it works
          </div>
          <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Human away,
            <br />
            Twin at work.
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground">
            LLM fine-tuning + RAG + Vector DB দিয়ে প্রতিটি employee র unique
            digital clone!
          </p>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -right-6 w-24 bg-gradient-to-l from-background to-transparent"
          />
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <EmployeeCard e={employees[0]} />
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            <EmployeeCard e={employees[1]} />
          </div>
        </div>
      </div>
    </section>
  );
}
