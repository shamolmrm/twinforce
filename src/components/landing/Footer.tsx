const groups = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog"],
  },
  { title: "Company", links: ["About", "Customers", "Careers", "Press"] },
  { title: "Resources", links: ["Docs", "Blog", "Security", "Status"] },
  { title: "Legal", links: ["Privacy", "Terms", "DPA", "Cookies"] },
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
                {g.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l}
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