import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, MessageSquare, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sales — TwinForce" },
      { name: "description", content: "Get in touch with TwinForce sales and support. We'll respond within one business day." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
      <div className="relative z-10">
        <Navbar />
        <main className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
              {/* Left: info */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact Us</div>
                <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                  Let's talk about<br />your enterprise.
                </h1>
                <p className="mt-5 max-w-md text-muted-foreground">
                  Whether you're exploring TwinForce for the first time or ready to deploy, our team is here to help. We respond within one business day.
                </p>

                <div className="mt-10 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Email</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">sales@twinforce.ai</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Live Chat</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">Available Mon–Fri, 9am–6pm EST</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Phone</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">+1 (800) 555-0199 (Enterprise only)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: form */}
              <div className="rounded-2xl border border-border bg-card/60 p-8 backdrop-blur">
                {sent ? (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold">Message received!</h2>
                    <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                      A member of our team will contact you within one business day.
                    </p>
                    <a href="/" className="mt-6 text-sm font-medium text-primary hover:underline">
                      ← Back to home
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold">Talk to Sales</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Fill out the form and we'll be in touch shortly.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                          id="name"
                          required
                          placeholder="Jane Smith"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          required
                          placeholder="Acme Corp"
                          value={form.company}
                          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Work email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="jane@acme.com"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="message">How can we help?</Label>
                      <textarea
                        id="message"
                        required
                        placeholder="Tell us about your use case, team size, and timeline..."
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending…" : <>Send message <ArrowRight className="ml-1 h-4 w-4" /></>}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      By submitting, you agree to our{" "}
                      <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
