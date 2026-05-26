import { ArrowRight, User, Cpu } from "lucide-react";

const human = {
  title: "Human Operator",
  subtitle: "Today",
  icon: User,
  rows: [
    ["Capacity", "8 hours / day"],
    ["Availability", "Weekdays only"],
    ["Onboarding", "3–6 months"],
    ["Cost", "$$$ per FTE"],
  ],
};

const twin = {
  title: "AI Digital Twin",
  subtitle: "With TwinForce",
  icon: Cpu,
  rows: [
    ["Capacity", "Unlimited, parallel"],
    ["Availability", "24 / 7 / 365"],
    ["Onboarding", "Days"],
    ["Cost", "Fraction of FTE"],
  ],
};

function OperatorCard({
  data,
  highlight,
}: {
  data: typeof human;
  highlight?: boolean;
}) {
  const Icon = data.icon;
  return (
    <div
      className={
        "relative flex-1 rounded-2xl border bg-card/60 p-8 backdrop-blur " +
        (highlight
          ? "border-primary/40 shadow-[var(--shadow-glow)]"
          : "border-border")
      }
    >
      {highlight && (
        <span className="absolute -top-3 left-8 rounded-full border border-primary/40 bg-background px-3 py-0.5 text-[11px] font-medium uppercase tracking-wider text-primary">
          Upgrade
        </span>
      )}
      <div className="flex items-center gap-4">
        <div
          className={
            "flex h-12 w-12 items-center justify-center rounded-xl " +
            (highlight
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground")
          }
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {data.subtitle}
          </div>
          <div className="font-heading text-xl font-bold">{data.title}</div>
        </div>
      </div>

      <dl className="mt-8 divide-y divide-border">
        {data.rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-3 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd
              className={
                "font-medium " + (highlight ? "text-primary" : "text-foreground")
              }
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How it works
          </div>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">
            Twin your best people. Scale them infinitely.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Capture how your top operators think and act, then deploy them as
            governed AI twins across your stack.
          </p>
        </div>

        <div className="mt-16 flex flex-col items-stretch gap-6 md:flex-row md:items-center">
          <OperatorCard data={human} />
          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary shadow-[var(--shadow-glow)]">
              <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
            </div>
          </div>
          <OperatorCard data={twin} highlight />
        </div>
      </div>
    </section>
  );
}