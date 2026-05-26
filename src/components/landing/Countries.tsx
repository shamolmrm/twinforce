import { Globe2 } from "lucide-react";

type Country = {
  flag: string;
  name: string;
  teams: string;
  growth: string;
};

const countries: Country[] = [
  { flag: "🇺🇸", name: "United States", teams: "182 teams", growth: "+38%" },
  { flag: "🇬🇧", name: "United Kingdom", teams: "74 teams", growth: "+42%" },
  { flag: "🇩🇪", name: "Germany", teams: "61 teams", growth: "+51%" },
  { flag: "🇮🇳", name: "India", teams: "58 teams", growth: "+88%" },
  { flag: "🇸🇬", name: "Singapore", teams: "39 teams", growth: "+64%" },
  { flag: "🇦🇪", name: "United Arab Emirates", teams: "31 teams", growth: "+72%" },
  { flag: "🇯🇵", name: "Japan", teams: "28 teams", growth: "+45%" },
  { flag: "🇨🇦", name: "Canada", teams: "26 teams", growth: "+33%" },
  { flag: "🇦🇺", name: "Australia", teams: "22 teams", growth: "+29%" },
  { flag: "🇧🇷", name: "Brazil", teams: "19 teams", growth: "+57%" },
  { flag: "🇳🇱", name: "Netherlands", teams: "17 teams", growth: "+40%" },
  { flag: "🇧🇩", name: "Bangladesh", teams: "14 teams", growth: "+96%" },
];

export function Countries() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Globe2 className="h-4 w-4" /> Global Footprint
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Trusted by teams in <span className="text-primary">42 countries</span>.
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Top regions deploying digital twins this quarter — sorted by active enterprise teams.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c, i) => (
            <div
              key={c.name}
              className="group flex items-center justify-between rounded-xl border border-border bg-card/50 px-5 py-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/80"
              style={{ animation: `fade-in 0.6s ease-out ${i * 0.04}s both` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{c.flag}</span>
                <div>
                  <div className="font-heading text-sm font-bold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.teams}</div>
                </div>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                {c.growth}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}