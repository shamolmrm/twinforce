import { Star } from "lucide-react";

type Quote = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
};

const quotes: Quote[] = [
  {
    quote:
      "TwinForce replaced 40 hours of weekly busywork. My twin handles status reports in my exact voice — clients can't tell the difference.",
    name: "Sarah Johnson",
    role: "VP Product, Acme Corp",
    initials: "SJ",
    avatarBg: "bg-emerald-500/20 text-emerald-300",
  },
  {
    quote:
      "We deployed twins for 12 engineering leads in two weeks. Sprint planning velocity is up 3x and nothing leaked our infra.",
    name: "Arjun Kumar",
    role: "CTO, Northwind",
    initials: "AK",
    avatarBg: "bg-indigo-500/20 text-indigo-300",
  },
  {
    quote:
      "Our support twins now handle 70% of tier-1 tickets autonomously. Same tone, same empathy, half the cost.",
    name: "Maya Rodriguez",
    role: "Head of CX, Globex",
    initials: "MR",
    avatarBg: "bg-rose-500/20 text-rose-300",
  },
];

const extraQuotes: Quote[] = [
  {
    quote: "The audit trail alone sold our security team. Every twin decision is replayable end-to-end.",
    name: "Daniel Okafor",
    role: "CISO, Helix Bank",
    initials: "DO",
    avatarBg: "bg-cyan-500/20 text-cyan-300",
  },
  {
    quote: "We onboard new market analysts in 3 days instead of 3 months. Their twin is productive on day one.",
    name: "Yuki Tanaka",
    role: "Head of Research, Mori Capital",
    initials: "YT",
    avatarBg: "bg-fuchsia-500/20 text-fuchsia-300",
  },
  {
    quote: "Email autopilot ships in our brand voice. We cut response time from 6 hours to under 4 minutes.",
    name: "Lena Müller",
    role: "COO, Berlin Logistics",
    initials: "LM",
    avatarBg: "bg-amber-500/20 text-amber-300",
  },
  {
    quote: "Per-employee pricing finally made AI a line item my CFO loved. ROI in week two.",
    name: "Carlos Mendes",
    role: "VP Ops, Lumen Health",
    initials: "CM",
    avatarBg: "bg-violet-500/20 text-violet-300",
  },
  {
    quote: "Twins join standups, take notes, and ship PRs while the team sleeps. It feels like a 2x headcount jump.",
    name: "Priya Shah",
    role: "Engineering Director, Tessera",
    initials: "PS",
    avatarBg: "bg-teal-500/20 text-teal-300",
  },
  {
    quote: "Deployed in our VPC. Zero data leaves. Compliance signed off on day one.",
    name: "Mohammed Al-Sayed",
    role: "Head of AI, Falcon Group",
    initials: "MA",
    avatarBg: "bg-orange-500/20 text-orange-300",
  },
];

const allQuotes = [...quotes, ...extraQuotes];

function QuoteCard({ q }: { q: Quote }) {
  return (
    <figure className="flex w-[360px] shrink-0 flex-col rounded-2xl border border-border bg-card/60 p-7 backdrop-blur">
      <div className="flex gap-0.5 text-primary">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground/90">
        &ldquo;{q.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <div className={"flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold " + q.avatarBg}>
          {q.initials}
        </div>
        <div>
          <div className="font-heading text-sm font-bold">{q.name}</div>
          <div className="text-xs text-muted-foreground">{q.role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Testimonials
        </div>
        <h2 className="mt-4 max-w-2xl text-4xl font-bold sm:text-5xl">
          Operators ship faster with their twin.
        </h2>
      </div>

      {/* Marquee rows */}
      <div className="relative mt-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max gap-6 animate-marquee">
          {[...allQuotes, ...allQuotes].map((q, i) => (
            <QuoteCard key={"r1-" + i} q={q} />
          ))}
        </div>
      </div>
      <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max gap-6 animate-marquee" style={{ animationDirection: "reverse", animationDuration: "50s" }}>
          {[...allQuotes.slice().reverse(), ...allQuotes.slice().reverse()].map((q, i) => (
            <QuoteCard key={"r2-" + i} q={q} />
          ))}
        </div>
      </div>
    </section>
  );
}