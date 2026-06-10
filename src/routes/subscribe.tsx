import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { billingApi } from "@/lib/api";
import { Check, Zap, Building2, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [{ title: "Choose Your Plan — TwinForce" }],
  }),
  component: SubscribePage,
});

const planIcons: Record<string, typeof Zap> = {
  starter: Zap,
  professional: Rocket,
  enterprise: Building2,
};

const planHighlight: Record<string, boolean> = {
  professional: true,
};

function SubscribePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: () => billingApi.plans(),
    staleTime: 300_000,
  });

  const plans = (plansData?.data ?? []).filter((p) => p.slug !== "system");

  const fallbackPlans = [
    {
      id: "starter",
      name: "Starter",
      slug: "starter",
      description: "Perfect for small teams getting started",
      priceMonthly: "30",
      priceYearly: "288",
      maxEmployees: 10,
      maxTwins: 10,
      features: ["10 AI Twins", "5 meetings/mo", "1 knowledge source", "Basic analytics", "Email support"],
    },
    {
      id: "professional",
      name: "Professional",
      slug: "professional",
      description: "For growing organizations that need more",
      priceMonthly: "40",
      priceYearly: "384",
      maxEmployees: 100,
      maxTwins: 100,
      features: ["100 AI Twins", "50 meetings/mo", "10 knowledge sources", "Email intelligence", "Advanced analytics", "Priority support", "SSO"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      slug: "enterprise",
      description: "Unlimited scale with enterprise SLA",
      priceMonthly: "50",
      priceYearly: "480",
      maxEmployees: -1,
      maxTwins: -1,
      features: ["Unlimited Twins", "Unlimited meetings", "Unlimited sources", "Full email autopilot", "Custom analytics", "Dedicated support", "SSO + SAML", "On-premise option", "SLA guarantee", "Custom contracts"],
    },
  ];

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  const handleSelect = async (slug: string) => {
    setSelected(slug);
    setLoading(true);
    try {
      const res = await billingApi.createSubscription(slug, cycle);
      if (res?.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch {
      navigate({ to: "/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/60 bg-background/70 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <a href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
              <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
              TwinForce
            </a>
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden text-sm sm:inline">{user.name}</span>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-16">
          {/* Hero text */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Zap className="h-3 w-3" /> 14-day free trial on all plans
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Choose your plan
            </h1>
            <p className="mt-3 text-muted-foreground">
              Start free, scale as you grow. No credit card required for the trial.
            </p>

            {/* Billing toggle */}
            <div className="mt-6 inline-flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1">
              <button
                onClick={() => setCycle("monthly")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className={`relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  cycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="absolute -top-3 -right-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Plans grid */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {displayPlans.map((plan) => {
              const Icon = planIcons[plan.slug] ?? Zap;
              const highlighted = planHighlight[plan.slug];
              const price = cycle === "yearly"
                ? (parseFloat(plan.priceYearly) / 12).toFixed(0)
                : plan.priceMonthly;
              const features = Array.isArray(plan.features)
                ? plan.features as string[]
                : ["Contact us for details"];

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
                    highlighted
                      ? "border-primary/60 bg-primary/5 shadow-[0_0_40px_hsl(var(--primary)/0.15)]"
                      : "border-border/60 bg-card/40 hover:border-border"
                  }`}
                >
                  {highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${highlighted ? "bg-primary" : "bg-primary/10"}`}>
                      <Icon className={`h-5 w-5 ${highlighted ? "text-primary-foreground" : "text-primary"}`} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="mb-1 text-muted-foreground">/mo</span>
                    </div>
                    {cycle === "yearly" && (
                      <p className="mt-1 text-xs text-green-400">
                        ${plan.priceYearly}/yr — save ${(parseFloat(plan.priceMonthly) * 12 - parseFloat(plan.priceYearly)).toFixed(0)}/yr
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plan.maxEmployees === -1 ? "Unlimited" : `Up to ${plan.maxEmployees}`} team members ·{" "}
                      {plan.maxTwins === -1 ? "Unlimited" : plan.maxTwins} twins
                    </p>
                  </div>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelect(plan.slug)}
                    disabled={loading && selected === plan.slug}
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                      highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border hover:border-primary/60 hover:bg-primary/5"
                    } disabled:opacity-60`}
                  >
                    {loading && selected === plan.slug ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        Start free trial
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Skip */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Want to explore first?{" "}
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="font-medium text-primary hover:underline"
            >
              Continue with free trial →
            </button>
          </p>

          {/* Trust signals */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            {["SOC 2 Type II", "GDPR Compliant", "HIPAA Ready", "Cancel anytime", "14-day free trial"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                {t}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
