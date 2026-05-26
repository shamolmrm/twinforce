import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const metrics = [
  { value: "10×", label: "Throughput per team" },
  { value: "70%", label: "Lower operating cost" },
  { value: "24/7", label: "Uninterrupted uptime" },
  { value: "500+", label: "Enterprise deployments" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 30%, black, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 text-center sm:pt-32">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Digital Twin Workforce · v3.0
        </div>

        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl">
          Deploy a workforce that{" "}
          <span className="text-primary">never sleeps.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          TwinForce builds AI digital twins of your operators — trained on your
          processes, governed by your policies, and shipped to production in
          days, not quarters.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Start free trial
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-border bg-card/40 hover:bg-card"
          >
            <Play className="mr-1 h-4 w-4" />
            Watch 2-min demo
          </Button>
        </div>

        {/* Metrics bar */}
        <div className="mx-auto mt-20 max-w-5xl rounded-2xl border border-border bg-card/40 px-4 py-6 backdrop-blur sm:px-8">
          <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-border sm:gap-0">
            {metrics.map((m) => (
              <div key={m.label} className="px-4 text-center">
                <dt className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                  {m.value}
                </dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}