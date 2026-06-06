import { Activity, Bot, CheckCircle2, Clock, Inbox, Sparkles } from "lucide-react";

const activity = [
  { icon: Inbox, text: "Replied to 14 client emails in your tone", time: "2m ago", tag: "Email" },
  { icon: Bot, text: "Joined Q3 planning sync on Zoom", time: "18m ago", tag: "Meeting" },
  { icon: CheckCircle2, text: "Approved 6 PRs under policy threshold", time: "1h ago", tag: "Code" },
  { icon: Sparkles, text: "Drafted weekly board update", time: "3h ago", tag: "Report" },
];

export function ProductShowcase() {
  return (
    <section id="product" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Live Console
            </div>
            <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Watch your twin work — in real time.
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              A single pane of glass for every twin: live activity feed,
              autonomy slider, policy guardrails, and an instant override
              button. You stay in control, always.
            </p>
            <ul className="mt-7 space-y-3 text-sm">
              {[
                "Audit every decision with full reasoning chain",
                "Per-task autonomy: assist, draft, or auto-send",
                "One-click rollback on any twin action",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative rounded-2xl border border-border bg-card/60 p-5 backdrop-blur"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
                <span className="font-heading text-sm font-bold">Sarah · Twin Console</span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Activity className="h-3 w-3" /> Live
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { k: "Tasks today", v: "47" },
                { k: "Autonomy", v: "L3" },
                { k: "Saved", v: "6.2h" },
              ].map((s) => (
                <div key={s.k} className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.k}
                  </div>
                  <div className="font-heading text-xl font-bold text-primary">{s.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              {activity.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-foreground/90">{a.text}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {a.time}
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider">
                          {a.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}