import { Button } from "@/components/ui/button";

const links = [
  { label: "Product", href: "#product" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          TwinForce
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Button size="sm" variant="outline" className="border-border bg-card/40 hover:bg-card">
          Request Demo
        </Button>
      </div>
    </header>
  );
}
