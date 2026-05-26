import { Check, Minus, X } from "lucide-react";

const rows = [
  { feature: "Trained on your team's actual work", twin: "yes", copilot: "no", outsourcing: "no" },
  { feature: "On-prem / VPC deployment", twin: "yes", copilot: "no", outsourcing: "partial" },
  { feature: "Autonomous task execution", twin: "yes", copilot: "partial", outsourcing: "yes" },
  { feature: "Per-employee pricing", twin: "yes", copilot: "no", outsourcing: "no" },
  { feature: "Ships in days, not quarters", twin: "yes", copilot: "yes", outsourcing: "no" },
  { feature: "Full audit trail & rollback", twin: "yes", copilot: "no", outsourcing: "no" },
] as const;

function Cell({ v }: { v: "yes" | "no" | "partial" }) {
  if (v === "yes") return <Check className="mx-auto h-5 w-5 text-primary" />;
  if (v === "partial") return <Minus className="mx-auto h-5 w-5 text-muted-foreground" />;
  return <X className="mx-auto h-5 w-5 text-muted-foreground/50" />;
}

export function Comparison() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Why TwinForce
          </div>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Not a copilot. Not an agency. A workforce.
          </h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur">
          <div className="grid grid-cols-4 gap-px bg-border text-sm">
            <div className="bg-card px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capability
            </div>
            <div className="bg-card px-5 py-4 text-center">
              <div className="font-heading text-sm font-bold text-primary">TwinForce</div>
            </div>
            <div className="bg-card px-5 py-4 text-center font-heading text-sm font-bold text-muted-foreground">
              Generic Copilot
            </div>
            <div className="bg-card px-5 py-4 text-center font-heading text-sm font-bold text-muted-foreground">
              BPO / Outsourcing
            </div>

            {rows.map((r) => (
              <div className="contents" key={r.feature}>
                <div className="bg-card px-5 py-4 text-foreground/90">{r.feature}</div>
                <div className="bg-card px-5 py-4 text-center">
                  <Cell v={r.twin} />
                </div>
                <div className="bg-card px-5 py-4 text-center">
                  <Cell v={r.copilot} />
                </div>
                <div className="bg-card px-5 py-4 text-center">
                  <Cell v={r.outsourcing} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}