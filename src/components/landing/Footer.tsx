const groups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Integrations", href: "#integrations" },
      { label: "Changelog", href: "/docs#changelog" },
    ],
  },
  { title: "Company", links: [{ label: "About", href: "/docs#about" }, { label: "Customers", href: "/docs#customers" }, { label: "Careers", href: "/docs#careers" }, { label: "Press", href: "/docs#press" }] },
  { title: "Resources", links: [{ label: "Docs", href: "/docs" }, { label: "Blog", href: "/docs#blog" }, { label: "Security", href: "/docs#security" }, { label: "Status", href: "/docs#status" }] },
  { title: "Legal", links: [{ label: "Privacy", href: "/docs#privacy" }, { label: "Terms", href: "/docs#terms" }, { label: "DPA", href: "/docs#dpa" }, { label: "Cookies", href: "/docs#cookies" }] },
];

export function Footer() {
  return (
    <footer className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2 font-heading text-lg font-bold">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              TwinForce
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The digital twin workforce platform for the modern enterprise.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {g.title}
              </div>
              <ul className="mt-4 space-y-2">
                {g.links.map((l: any) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} TwinForce, Inc. All rights reserved.</span>
          <span>Built for enterprises that don't sleep.</span>
        </div>
      </div>
    </footer>
  );
}