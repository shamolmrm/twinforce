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

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="flex flex-col rounded-2xl border border-border bg-card/60 p-7 backdrop-blur"
            >
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground/90">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <div
                  className={
                    "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold " +
                    q.avatarBg
                  }
                >
                  {q.initials}
                </div>
                <div>
                  <div className="font-heading text-sm font-bold">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}