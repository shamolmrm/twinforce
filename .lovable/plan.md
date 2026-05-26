… (Plan)

## Goal
Single-page dark enterprise SaaS landing page for **TwinForce** (Digital Twin Workforce), built on the existing TanStack Start template.

## Design tokens (src/styles.css)
- Add Google Fonts import: `Syne` (600/700/800) for headings, `DM Sans` (400/500) for body.
- Override `:root` tokens:
  - `--background: oklch` equivalent of `#040812`
  - `--foreground`: near-white
  - `--primary`: teal `#4FE0B0`
  - `--primary-foreground`: deep navy `#040812`
  - `--card`: subtly lighter navy (`#0A1120`-ish)
  - `--border`: low-alpha white
  - `--muted-foreground`: cool gray
- Add `--font-heading` (Syne) and `--font-body` (DM Sans) and apply `font-family: var(--font-body)` on body, plus a `.font-heading` utility / base styling on h1–h6.
- Add a soft teal radial-glow gradient token for hero ambience.

## Page structure (src/routes/index.tsx)
Replace the placeholder Index with a composed page. Each section is its own component file in `src/components/landing/` for cleanliness:

1. **Navbar** (`Navbar.tsx`)
   - Logo "TwinForce" (Syne, teal dot), nav links (Product, How it works, Features, Pricing), "Sign in" ghost + "Book demo" teal CTA.
   - Sticky, translucent dark blur backdrop, thin bottom border.

2. **Hero** (`Hero.tsx`)
   - Eyebrow chip "Digital Twin Workforce".
   - H1: "Deploy a workforce that never sleeps." (Syne, large).
   - Sub: short value prop.
   - Two CTAs: primary teal "Start free trial", secondary outline "Watch 2-min demo".
   - Subtle radial teal glow background + faint grid.
   - **Metrics bar** below: 4 stats (e.g. "10x throughput", "70% lower opex", "24/7 uptime", "500+ enterprise teams") separated by vertical dividers.

3. **How It Works** (`HowItWorks.tsx`)
   - Section heading + intro.
   - Two cards side-by-side: **Human Operator** (left) and **AI Twin** (right) with a horizontal arrow between them (rotates to a down arrow on mobile).
   - Each card lists 3–4 attributes (e.g., Capacity, Availability, Onboarding time, Cost). AI Twin card has a faint teal border/glow to signal the upgrade.

4. **Features grid** (`Features.tsx`)
   - 3×2 grid of 6 cards. Each: lucide-react icon in a teal-tinted square, title (Syne), 1–2 line description. Examples: Autonomous Agents, Skill Library, Realtime Telemetry, Policy Guardrails, Audit Trail, Native Integrations.

5. **Pricing** (`Pricing.tsx`)
   - 3 tiers: **Starter**, **Scale** (highlighted with teal border + "Most popular" badge), **Enterprise**.
   - Price, short tagline, feature list with teal check icons, CTA button per tier.

6. **Footer** (`Footer.tsx`)
   - Minimal: logo, short tagline, copyright, 3–4 link groups (Product, Company, Resources, Legal).

## Route metadata
Update `src/routes/index.tsx` `head()` (via `createFileRoute({ head: ... })`) with TwinForce-specific `<title>` (< 60 chars), meta description (< 160 chars), og:title/description.

## Component conventions
- Use semantic Tailwind tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-primary`, `border-border`, `text-muted-foreground`) — no hardcoded hex in JSX.
- Headings: `className="font-heading"` (utility mapped via styles.css).
- Use existing shadcn `Button` and `Card` where helpful.
- Icons from `lucide-react` (already available).
- Fully responsive: mobile stack → md/lg multi-column.

## Out of scope
- No backend, no auth, no Lovable Cloud — purely static marketing page.
- No real images; visuals come from CSS gradients, borders, and lucide icons.

## Files to create
- `src/components/landing/Navbar.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/Features.tsx`
- `src/components/landing/Pricing.tsx`
- `src/components/landing/Footer.tsx`

## Files to modify
- `src/styles.css` — fonts import, token overrides, font utilities, body font.
- `src/routes/index.tsx` — replace placeholder, add `head()` metadata, compose sections.
