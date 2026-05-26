import { Zap, Globe, Languages, TrendingUp, Shield, Rocket } from "lucide-react";

const stats = [
  { v: "12M+", k: "Twin actions monthly", icon: Zap },
  { v: "99.98%", k: "Uptime SLA", icon: Shield },
  { v: "68%", k: "Faster resolution", icon: TrendingUp },
  { v: "42+", k: "Countries deployed", icon: Globe },
  { v: "40+", k: "Languages supported", icon: Languages },
  { v: "3.4x", k: "Team velocity", icon: Rocket },
];

export function StatsBand() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Top heading area */}
      <div className="relative bg-background/50 py-16 text-center backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by teams <span className="text-primary">worldwide</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Real numbers from production deployments at scale.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:gap-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.k}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card/90 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
                    {s.v}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.k}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
