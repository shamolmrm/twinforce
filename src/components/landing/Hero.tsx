import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const metrics = [
  { value: "10x", label: "Faster Onboarding", accent: true },
  { value: "70%", label: "Lower Ops Cost", accent: true },
  { value: "24/7", label: "Always-On Workforce", accent: true },
  { value: "500+", label: "Enterprise Teams", accent: true },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 text-center sm:pt-28">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          AI-First · Zero Competition · Deep Tech
        </div>

        <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl">
          Your workforce,
          <br />
          <span className="text-primary">cloned in AI.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">
          প্রতিটি কর্মীর কাজের ধরন, সিদ্ধান্ত লজিক আর কমিউনিকেশন স্টাইল শিখে
          তার একটি ডিজিটাল টুইন তৈরি হয় — ছুটিতেও কাজ চলে।
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href="/contact?trial=1" className="inline-block">
            <Button
              size="lg"
              variant="outline"
              className="border-border bg-card/40 hover:bg-card"
            >
              Start Free Trial
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </a>
          <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noreferrer" className="inline-block">
            <Button
              size="lg"
              variant="outline"
              className="border-border bg-card/40 hover:bg-card"
            >
              <Play className="mr-1 h-4 w-4 fill-current" />
              Watch Demo
            </Button>
          </a>
        </div>

        {/* Metrics bar */}
        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-border bg-card/40 px-4 py-7 backdrop-blur sm:px-8">
          <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-border sm:gap-0">
            {metrics.map((m) => (
              <div key={m.label} className="px-4 text-center">
                <dt className="font-heading text-3xl font-bold text-primary sm:text-4xl">
                  {m.value}
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
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
