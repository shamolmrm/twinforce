import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How long does it take to deploy a digital twin?",
    a: "Most teams ship their first production twin in 5–10 business days. Onboarding ingests 12 months of email, docs and decisions, then a fine-tune + RAG pipeline runs in your VPC.",
  },
  {
    q: "Where does our data live?",
    a: "Fully on-premise or in your own VPC (AWS, GCP, Azure). Model weights, embeddings, and raw context never leave your infrastructure. SOC 2 Type II and ISO 27001 audited.",
  },
  {
    q: "Can a twin make decisions autonomously?",
    a: "Yes — within explicit policy guardrails you define. Every action is logged, reversible, and routed for human approval above configurable risk thresholds.",
  },
  {
    q: "What happens when the employee returns from leave?",
    a: "The twin hands back a full briefing — decisions made, threads in flight, open commitments — and shifts into background mode, continuing only the workflows you approve.",
  },
  {
    q: "Do you support custom models?",
    a: "Enterprise tier supports bring-your-own-LLM (Llama, Mistral, Claude, GPT) and custom training pipelines. Starter and Business use our managed fine-tunes.",
  },
  {
    q: "How is pricing calculated?",
    a: "Per-employee, per-month — based on the number of humans being twinned, not API calls or seats. Volume discounts kick in above 100 employees.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-b border-border py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            FAQ
          </div>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Questions, answered.
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={"item-" + i}
              className="rounded-xl border border-border bg-card/60 px-5 backdrop-blur"
            >
              <AccordionTrigger className="font-heading text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}