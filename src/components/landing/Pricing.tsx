import { Check, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tier = {
  name: string;
  price: string;
  unit?: string;
  scale: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Basic",
    price: "$30",
    unit: "/month",
    scale: "Perfect for individuals & small teams",
    features: [
      "1 AI Twin",
      "1,000 messages/month",
      "Email & Chat support",
      "Basic analytics",
      "Standard integrations",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$79",
    unit: "/month",
    scale: "For growing teams up to 10 members",
    features: [
      "5 AI Twins",
      "10,000 messages/month",
      "Priority support",
      "Advanced analytics",
      "Custom workflows",
      "API access",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Business",
    price: "$149",
    unit: "/month",
    scale: "For organizations up to 50 members",
    features: [
      "Unlimited AI Twins",
      "Unlimited messages",
      "24/7 dedicated support",
      "Full analytics suite",
      "SSO & SAML",
      "Advanced security",
      "On-premise option",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Pricing
          </div>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Simple, transparent pricing.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Choose the plan that fits your team. Scale up or down anytime.
          </p>
        </div>

        {/* Standard tiers */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={
                "relative flex flex-col rounded-2xl border bg-card/60 p-7 backdrop-blur " +
                (t.highlight
                  ? "border-primary/50 shadow-[var(--shadow-glow)] scale-[1.02] z-10"
                  : "border-border")
              }
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Most Popular
                </span>
              )}

              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {t.name}
              </div>
              <div className="mt-2 font-heading text-2xl font-bold">
                {t.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{t.scale}</div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-bold">
                  <span className="align-top text-2xl">$</span>
                  {t.price.replace("$", "")}
                </span>
                {t.unit && (
                  <span className="text-xs text-muted-foreground">{t.unit}</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={
                  "mt-7 w-full " +
                  (t.highlight
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-card/40 text-foreground hover:bg-card")
                }
                variant={t.highlight ? "default" : "outline"}
              >
                {t.cta}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise tier */}
        <div className="mt-8 rounded-2xl border border-border bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-8 backdrop-blur">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-heading text-xl font-bold">Enterprise</div>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                  Need a custom solution? We offer dedicated infrastructure, custom LLM training, SLA guarantees, white-label options, and bespoke onboarding for large organizations.
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-foreground/80">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" />
                    Custom pricing
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" />
                    Dedicated account manager
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" />
                    SLA & compliance
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" />
                    Custom contracts
                  </li>
                </ul>
              </div>
            </div>
            <Button
              className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Contact Sales
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
