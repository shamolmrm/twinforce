import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact — TwinForce" }],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  if (sent) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Thanks — we received your request</h1>
        <p className="mt-4 text-muted-foreground">A member of our team will contact you within one business day.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold">Contact Sales & Support</h1>
      <p className="mt-2 text-muted-foreground">Tell us how we can help and we'll get back to you.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          console.log('contact form', form);
          setSent(true);
        }}
        className="mt-6 space-y-4"
      >
        <input
          required
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          required
          type="email"
          placeholder="Work email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full rounded-md border px-3 py-2"
        />
        <textarea
          required
          placeholder="How can we help?"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full rounded-md border px-3 py-2 min-h-[120px]"
        />
        <div className="flex justify-end">
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Send</button>
        </div>
      </form>
    </div>
  );
}
