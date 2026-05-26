const stats = [
  { v: "12M+", k: "Twin actions monthly" },
  { v: "99.98%", k: "Uptime SLA" },
  { v: "68%", k: "Faster resolution" },
  { v: "42+", k: "Countries deployed" },
  { v: "40+", k: "Languages supported" },
  { v: "3.4x", k: "Team velocity" },
];

export function StatsBand() {
  return (
    <section className="relative overflow-hidden border-b border-border py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.k} className="bg-card/80 px-6 py-10 text-center backdrop-blur">
              <div className="font-heading text-4xl font-extrabold text-primary sm:text-5xl">
                {s.v}
              </div>
              <div className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.k}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}