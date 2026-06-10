import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card/60 px-8 py-16 text-center backdrop-blur sm:px-16"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "var(--gradient-hero)" }}
          />
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Ready when you are
            </div>
            <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              Ship your first twin in <span className="text-primary">10 days</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-muted-foreground">
              14-day free trial. White-glove onboarding. Cancel anytime — keep
              the embeddings.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="/signup">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Start Free Trial
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
              <a href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border bg-card/40 hover:bg-card"
                >
                  Talk to Sales
                </Button>
              </a>
            </div>
            <div className="mt-6 text-xs text-muted-foreground">
              No credit card required · SOC 2 Type II · Deploys in your VPC
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}