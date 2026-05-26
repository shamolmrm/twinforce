import {
  Slack,
  Github,
  Mail,
  Calendar,
  MessageSquare,
  Cloud,
  Database,
  Figma,
  FileText,
  Video,
  Trello,
  Gitlab,
  Chrome,
  HardDrive,
  Lock,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Globe,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

type Integration = { name: string; icon: LucideIcon };

const integrations: Integration[] = [
  { name: "Slack", icon: Slack },
  { name: "GitHub", icon: Github },
  { name: "Gmail", icon: Mail },
  { name: "Calendar", icon: Calendar },
  { name: "Teams", icon: MessageSquare },
  { name: "AWS", icon: Cloud },
  { name: "Postgres", icon: Database },
  { name: "Figma", icon: Figma },
  { name: "Notion", icon: FileText },
  { name: "Zoom", icon: Video },
  { name: "Trello", icon: Trello },
  { name: "GitLab", icon: Gitlab },
  { name: "Chrome", icon: Chrome },
  { name: "Drive", icon: HardDrive },
  { name: "Auth0", icon: Lock },
  { name: "Shopify", icon: ShoppingCart },
  { name: "Stripe", icon: CreditCard },
  { name: "Tableau", icon: BarChart3 },
  { name: "Vercel", icon: Globe },
  { name: "Mobile", icon: Smartphone },
];

export function Integrations() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-5 lg:items-center">
        <div className="lg:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Integrations
          </div>
          <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Plugs into the tools your team already lives in.
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground">
            50+ native connectors. Your twin reads from and writes to the same
            inboxes, repos, docs and meetings — no migration required.
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-xs">
            {["SOC 2 Type II", "GDPR", "HIPAA Ready", "ISO 27001"].map((b) => (
              <span
                key={b}
                className="rounded-full border border-border bg-card/60 px-3 py-1 text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
            {integrations.map(({ name, icon: Icon }) => (
              <div
                key={name}
                className="flex aspect-square flex-col items-center justify-center gap-2 bg-card p-4 transition-colors hover:bg-card/70"
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}