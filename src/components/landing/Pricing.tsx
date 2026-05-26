import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tier = {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Starter",
    price: "$499",
    period: "/ month",
    tagline: "For teams piloting their first digital twin.",
    features: [
      "Up to 3 active twins",
      "10k tasks / month",
      "Standard skill library",
      "Email support",
    ],
    cta: "Start free trial",
  },
  {
    name: "Scale",
    price: "$2,499",
    period: "/ month",
    tagline: "For production deployments across departments.",
    features: [
      "Up to 25 active twins",
      "250k tasks / month",
      "Custom skills & guardrails",
      "SOC 2 reporting",
      "Priority support + SLAs",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "For org-wide rollouts with private deployment.",
    features: [
      "Unlimited twins & tasks",
      "VPC / on-prem deployment",
      "Dedicated solution architect",
      "Custom integrations",
      "24/7 enterprise support",
    ],
    cta: "Talk to sales",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Pricing
          </div>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">
            Pay for outcomes, not seats.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start small, scale to thousands of twins. No per-seat pricing — ever.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={
                "relative flex flex-col rounded-2xl border bg-card/60 p-8 backdrop-blur " +
                (t.highlight
                  ? "border-primary/50 shadow-[var(--shadow-glow)]"
                  : "border-border")
              }
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </span>
              )}
              <div className="font-heading text-lg font-bold">{t.name}</div>
              <p className="mt-2 text-sm text-muted-foreground">{t.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-bold">
                  {t.price}
                </span>
                {t.period && (
                  <span className="text-sm text-muted-foreground">
                    {t.period}
                  </span>
                )}
              </div>

              <Button
                className={
                  "mt-8 " +
                  (t.highlight
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80")
                }
              >
                {t.cta}
              </Button>

              <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}