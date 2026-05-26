import { Check, ArrowRight } from "lucide-react";
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
    name: "Starter",
    price: "$49",
    unit: "/employee/mo",
    scale: "Up to 25 employees",
    features: [
      "Email autopilot",
      "Report generation",
      "Basic fine-tuning",
      "RAG knowledge base",
    ],
    cta: "Get Started",
  },
  {
    name: "Business",
    price: "$89",
    unit: "/employee/mo",
    scale: "Up to 500 employees",
    features: [
      "Everything in Team",
      "Meeting presence (Zoom/Teams)",
      "Decision logic mapping",
      "On-premise deployment",
      "SOC2 compliance",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    scale: "Unlimited employees",
    features: [
      "Everything in Business",
      "Custom LLM training pipeline",
      "Dedicated infra + SLA",
      "White-label option",
      "24/7 support",
    ],
    cta: "Contact Sales",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Pricing
        </div>
        <h2 className="mt-4 max-w-2xl text-4xl font-bold sm:text-5xl">
          Simple, scalable pricing.
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={
                "relative flex flex-col rounded-2xl border bg-card/60 p-7 backdrop-blur " +
                (t.highlight
                  ? "border-primary/50 shadow-[var(--shadow-glow)]"
                  : "border-border")
              }
            >
              {t.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Most Popular
                </span>
              )}

              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {t.name}
              </div>
              <div className="mt-1 font-heading text-2xl font-bold">
                {t.name === "Business"
                  ? "Business"
                  : t.name === "Enterprise"
                    ? "Enterprise"
                    : "Team"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{t.scale}</div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-bold">
                  {t.price === "Custom" ? (
                    <span className="text-3xl">Custom</span>
                  ) : (
                    <>
                      <span className="align-top text-2xl">$</span>
                      {t.price.replace("$", "")}
                    </>
                  )}
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
      </div>
    </section>
  );
}
