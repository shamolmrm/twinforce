const logos = [
  "Acme Corp",
  "Northwind",
  "Globex",
  "Initech",
  "Umbrella",
  "Hooli",
  "Stark Ind.",
  "Wayne Co.",
];

export function LogosBar() {
  return (
    <section className="border-b border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Trusted by 500+ forward-thinking teams
        </p>
        <div className="mt-8 grid grid-cols-2 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
          {logos.map((name) => (
            <div
              key={name}
              className="flex items-center justify-center font-heading text-sm font-bold tracking-tight text-muted-foreground/80 transition-colors hover:text-foreground"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}