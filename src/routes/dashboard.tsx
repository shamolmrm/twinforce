import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  analyticsApi, twinsApi, meetingsApi, notificationsApi, orgApi, billingApi, usersApi,
  type ApiTwin, type ApiMeeting, type ApiNotification, type ApiPlan,
} from "@/lib/api";
import {
  LayoutDashboard, Cpu, Video, BookOpen, Mail, UsersRound,
  CreditCard, Settings, LogOut, ChevronRight, Bell, Plus,
  Check, ArrowRight, Zap, Building2, Rocket, TrendingUp,
  Activity, Users, Shield, Download, Printer,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — TwinForce" }],
  }),
  component: DashboardPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, hint, loading, icon: Icon }: {
  label: string; value: string | number; hint: string; loading?: boolean; icon?: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>}
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const cls =
    status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
    status === "trialing" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
    status === "suspended" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
    "bg-muted text-muted-foreground border-border";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${cls}`}>{status}</span>;
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────
type Section = "overview" | "twins" | "meetings" | "knowledge" | "email" | "team" | "billing" | "settings";

const navItems: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "twins", label: "AI Twins", icon: Cpu },
  { key: "meetings", label: "Meetings", icon: Video },
  { key: "knowledge", label: "Knowledge", icon: BookOpen },
  { key: "email", label: "Email", icon: Mail },
  { key: "team", label: "Team", icon: UsersRound },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "settings", label: "Settings", icon: Settings },
];

const sectionTitles: Record<Section, string> = {
  overview: "Dashboard", twins: "AI Twins", meetings: "Meetings",
  knowledge: "Knowledge Base", email: "Email Intelligence",
  team: "Team Management", billing: "Billing & Plans", settings: "Settings",
};

const planIcons: Record<string, typeof Zap> = { starter: Zap, professional: Rocket, enterprise: Building2 };

// ─── Main ─────────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  // Queries
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => analyticsApi.dashboard(),
    enabled: !!user,
    staleTime: 30_000,
  });
  const { data: twinsData, isLoading: twinsLoading } = useQuery({
    queryKey: ["twins"],
    queryFn: () => twinsApi.list(),
    enabled: !!user && (section === "overview" || section === "twins"),
    staleTime: 60_000,
  });
  const { data: meetingsData, isLoading: meetingsLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => meetingsApi.list({ limit: 10 }),
    enabled: !!user && (section === "overview" || section === "meetings"),
    staleTime: 60_000,
  });
  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    enabled: !!user,
    staleTime: 30_000,
  });
  const { data: orgData } = useQuery({
    queryKey: ["org-current"],
    queryFn: () => orgApi.current(),
    enabled: !!user && (section === "overview" || section === "team" || section === "billing"),
    staleTime: 60_000,
  });
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["org-members"],
    queryFn: () => orgApi.members(),
    enabled: !!user && section === "team",
    staleTime: 60_000,
  });
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => billingApi.plans(),
    enabled: !!user && section === "billing",
    staleTime: 300_000,
  });
  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => billingApi.subscription(),
    enabled: !!user && section === "billing",
    staleTime: 60_000,
  });

  // Mutations
  const inviteMember = useMutation({
    mutationFn: (body: { email: string; role: string }) => usersApi.invite(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["org-members"] }); setInviteEmail(""); },
  });
  const createTwin = useMutation({
    mutationFn: (name: string) => twinsApi.create({ name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["twins"] }),
  });
  const selectPlan = useMutation({
    mutationFn: ({ slug, cycle }: { slug: string; cycle: "monthly" | "yearly" }) =>
      billingApi.createSubscription(slug, cycle),
    onSuccess: (res) => {
      if (res?.data?.checkoutUrl) window.location.href = res.data.checkoutUrl;
      else qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const stats = statsData?.data;
  const twins: ApiTwin[] = twinsData?.data ?? [];
  const meetings: ApiMeeting[] = meetingsData?.data ?? [];
  const unread = notifData?.unreadCount ?? 0;
  const org = orgData?.data;
  const members = membersData?.data ?? [];
  const plans = (plansData?.data ?? []).filter((p: ApiPlan) => p.slug !== "system");
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isOwner = user.role === "owner" || user.role === "super_admin";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`no-print sticky top-0 flex h-screen flex-col border-r border-border/60 bg-card/30 backdrop-blur-xl transition-all duration-200 ${sidebarOpen ? "w-56" : "w-16"}`}>
        <div className="flex h-16 items-center gap-3 border-b border-border/60 px-4">
          <a href="/" className="flex items-center gap-2 font-heading font-bold">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
            {sidebarOpen && <span className="text-sm">TwinForce</span>}
          </a>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                section === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
              {sidebarOpen && key === "billing" && org?.plan === "trial" && (
                <span className="ml-auto rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-400">Trial</span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-border/60 p-2">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
            {sidebarOpen && "Collapse"}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-lg">
          <h1 className="text-lg font-semibold">{sectionTitles[section]}</h1>
          <div className="flex items-center gap-3">
            {unread > 0 && (
              <div className="relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">{unread}</span>
              </div>
            )}
            <button
              onClick={() => window.print()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
              title="Print / PDF"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</div>
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
            <button
              onClick={async () => { await logout(); navigate({ to: "/" }); }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Overview ─────────────────────────────────────────────────── */}
          {section === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {user.name.split(" ")[0]} 👋</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {org?.name} · <span className="capitalize">{org?.plan ?? "trial"}</span> plan
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active Twins" value={stats?.activeTwins ?? 0} hint="Operational" loading={statsLoading} icon={Cpu} />
                <StatCard label="Interactions" value={stats?.totalInteractions ?? 0} hint="AI responses" loading={statsLoading} icon={Activity} />
                <StatCard label="Meetings" value={stats?.totalMeetings ?? 0} hint="All time" loading={statsLoading} icon={Video} />
                <StatCard label="Team Members" value={stats?.totalUsers ?? 1} hint={`${user.role} access`} loading={statsLoading} icon={Users} />
              </div>

              {/* Quick actions */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Create Twin", desc: "Deploy a new digital twin", icon: Cpu, action: () => setSection("twins") },
                  { label: "Schedule Meeting", desc: "Book a meeting session", icon: Video, action: () => setSection("meetings") },
                  { label: "Invite Team Member", desc: "Add someone to your org", icon: UsersRound, action: () => setSection("team") },
                  { label: "Upgrade Plan", desc: "Unlock more features", icon: TrendingUp, action: () => setSection("billing") },
                ].map(({ label, desc, icon: Icon, action }) => (
                  <button key={label} onClick={action} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Twins + Meetings split */}
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-card/40">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <h3 className="text-sm font-semibold">Your AI Twins</h3>
                    <button onClick={() => setSection("twins")} className="text-xs text-primary hover:underline">View all →</button>
                  </div>
                  <div className="p-4 space-y-3">
                    {twinsLoading ? (
                      [1,2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)
                    ) : twins.length > 0 ? twins.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{t.status} · {t.totalInteractions} interactions</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                        <p className="text-sm font-medium">No twins yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">Create your first AI digital twin</p>
                        <button onClick={() => setSection("twins")} className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">Create Twin</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/40">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <h3 className="text-sm font-semibold">Recent Meetings</h3>
                    <button onClick={() => setSection("meetings")} className="text-xs text-primary hover:underline">View all →</button>
                  </div>
                  <div className="p-4 space-y-2">
                    {meetingsLoading ? (
                      [1,2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)
                    ) : meetings.length > 0 ? meetings.slice(0, 4).map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">{m.title ?? "Untitled"}</p>
                          <p className="text-xs text-muted-foreground">{m.platform ?? "—"} · {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : "No date"}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${m.status === "ended" ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-400"}`}>{m.status.replace("_", " ")}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-6">No meetings scheduled yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Twins ─────────────────────────────────────────────────────── */}
          {section === "twins" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Deploy and manage AI digital twins for your team.</p>
                <button
                  onClick={() => {
                    const name = prompt("Twin name:");
                    if (name) createTwin.mutate(name);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Twin
                </button>
              </div>
              {twinsLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-border/60 bg-card/40" />)}
                </div>
              ) : twins.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {twins.map((t) => (
                    <div key={t.id} className="rounded-2xl border border-border/60 bg-card/40 p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{t.name}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">{t.status}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Training progress</span>
                          <span>{t.trainingProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${t.trainingProgress}%` }} />
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{t.totalInteractions} total interactions</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-12 text-center">
                  <Cpu className="mx-auto h-10 w-10 text-primary/40" />
                  <h3 className="mt-4 font-bold">No AI twins yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Create your first digital twin to start automating workflows.</p>
                  <button
                    onClick={() => { const n = prompt("Twin name:"); if (n) createTwin.mutate(n); }}
                    className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Create your twin
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Meetings ─────────────────────────────────────────────────── */}
          {section === "meetings" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Schedule, join, and review AI-attended meetings.</p>
                <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-3.5 w-3.5" /> Schedule Meeting
                </button>
              </div>
              {meetingsLoading ? (
                <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl border border-border/60 bg-card/40" />)}</div>
              ) : meetings.length > 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20">
                        {["Title", "Platform", "Scheduled", "Status", "Duration"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {meetings.map((m) => (
                        <tr key={m.id} className="border-b border-border/40 hover:bg-muted/10">
                          <td className="px-4 py-3 font-medium">{m.title ?? "Untitled"}</td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">{m.platform ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`capitalize text-xs px-2 py-0.5 rounded-full ${m.status === "ended" ? "bg-muted text-muted-foreground" : m.status === "in_progress" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>
                              {m.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{m.durationMinutes ? `${m.durationMinutes}m` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card/40 p-12 text-center">
                  <Video className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-4 font-medium">No meetings scheduled</p>
                  <p className="mt-1 text-sm text-muted-foreground">Schedule your first meeting to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Knowledge ─────────────────────────────────────────────────── */}
          {section === "knowledge" && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-primary/40" />
              <h3 className="mt-4 font-bold">Knowledge Base</h3>
              <p className="mt-2 text-sm text-muted-foreground">Upload documents, connect data sources, and let your twins learn from your company knowledge.</p>
              <button className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Connect Knowledge Source</button>
            </div>
          )}

          {/* ── Email ─────────────────────────────────────────────────────── */}
          {section === "email" && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center">
              <Mail className="mx-auto h-10 w-10 text-primary/40" />
              <h3 className="mt-4 font-bold">Email Intelligence</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your AI twin reads your inbox, drafts replies in your voice, and escalates only what matters.</p>
              <button className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Connect Email Account</button>
            </div>
          )}

          {/* ── Team ─────────────────────────────────────────────────────── */}
          {section === "team" && (
            <div className="space-y-6">
              {isOwner && (
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  <h3 className="mb-3 text-sm font-semibold">Invite Team Member</h3>
                  <div className="flex gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => inviteMember.mutate({ email: inviteEmail, role: inviteRole })}
                      disabled={!inviteEmail || inviteMember.isPending}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {inviteMember.isPending ? "Sending…" : "Invite"}
                    </button>
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                <div className="border-b border-border/60 px-4 py-3">
                  <h3 className="text-sm font-semibold">Team Members ({members.length})</h3>
                </div>
                {membersLoading ? (
                  <div className="p-4 space-y-2">{[1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20">
                        {["Member", "Role", "Status", "Joined"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m: any) => (
                        <tr key={m.id} className="border-b border-border/40 hover:bg-muted/10">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                                {(m.fullName ?? m.email).slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{m.fullName ?? "—"}</p>
                                <p className="text-xs text-muted-foreground">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 capitalize text-sm">{m.role}</td>
                          <td className="px-4 py-3"><Badge status={m.status} /></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                <Shield className="mb-2 h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Team hierarchy: </span>
                {isOwner
                  ? "As the team owner, you have full control — invite/remove members, assign roles (manager, admin, member), manage twins, meetings, and billing."
                  : "Contact your team owner to manage member permissions and billing."}
              </div>
            </div>
          )}

          {/* ── Billing ─────────────────────────────────────────────────── */}
          {section === "billing" && (
            <div className="space-y-6">
              {/* Current subscription */}
              {org && (
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  <h3 className="mb-4 text-sm font-semibold">Current Plan</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold capitalize">{org.plan} Plan</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {org.maxEmployees === -1 ? "Unlimited" : `Up to ${org.maxEmployees}`} members ·{" "}
                        {org.status === "active" ? "Active" : org.status}
                      </p>
                    </div>
                    <Badge status={org.status} />
                  </div>
                  {org.plan === "trial" && (
                    <div className="mt-3 rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-sm text-orange-400">
                      You're on a free trial. Upgrade to unlock all features and remove limits.
                    </div>
                  )}
                </div>
              )}

              {/* Plan selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Available Plans</h3>
                  <div className="flex gap-1 rounded-lg border border-border bg-card/40 p-1">
                    {(["monthly", "yearly"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setBillingCycle(c)}
                        className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${billingCycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {c}
                        {c === "yearly" && <span className="ml-1 text-green-400">-20%</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {plansLoading ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {[1,2,3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl border border-border/60 bg-card/40" />)}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan: ApiPlan) => {
                      const Icon = planIcons[plan.slug] ?? Zap;
                      const highlighted = plan.slug === "professional";
                      const price = billingCycle === "yearly"
                        ? (parseFloat(plan.priceYearly) / 12).toFixed(0)
                        : plan.priceMonthly;
                      const isCurrent = org?.plan === plan.slug;
                      const feats = plan.features as string[];

                      return (
                        <div
                          key={plan.id}
                          className={`relative flex flex-col rounded-2xl border p-6 ${highlighted ? "border-primary/60 bg-primary/5" : "border-border/60 bg-card/40"} ${isCurrent ? "ring-2 ring-primary" : ""}`}
                        >
                          {isCurrent && (
                            <div className="absolute -top-3 left-4 rounded-full border border-primary/40 bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                              Current Plan
                            </div>
                          )}
                          {highlighted && !isCurrent && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                              Most Popular
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${highlighted ? "bg-primary" : "bg-primary/10"}`}>
                              <Icon className={`h-4 w-4 ${highlighted ? "text-primary-foreground" : "text-primary"}`} />
                            </div>
                            <h4 className="font-bold">{plan.name}</h4>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-end gap-1">
                              <span className="text-3xl font-bold">${price}</span>
                              <span className="mb-1 text-xs text-muted-foreground">/mo</span>
                            </div>
                          </div>
                          <ul className="mt-4 flex-1 space-y-2">
                            {feats.slice(0, 5).map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs">
                                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />{f}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => !isCurrent && selectPlan.mutate({ slug: plan.slug, cycle: billingCycle })}
                            disabled={isCurrent || selectPlan.isPending}
                            className={`mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all ${isCurrent ? "bg-muted text-muted-foreground cursor-default" : highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:border-primary/60 hover:bg-primary/5"} disabled:opacity-60`}
                          >
                            {isCurrent ? "Current Plan" : selectPlan.isPending ? "Processing…" : <>Upgrade <ArrowRight className="h-3.5 w-3.5" /></>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Settings ─────────────────────────────────────────────────── */}
          {section === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                <h3 className="mb-4 text-sm font-semibold">Profile</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Full name</label>
                    <input defaultValue={user.name} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <input defaultValue={user.email} disabled className="mt-1 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground" />
                  </div>
                  <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Save Changes</button>
                </div>
              </div>
              {org && (
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  <h3 className="mb-4 text-sm font-semibold">Organization</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between rounded-lg bg-muted/30 px-4 py-2.5">
                      <span className="text-sm text-muted-foreground">Organization name</span>
                      <span className="text-sm font-medium">{org.name}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-muted/30 px-4 py-2.5">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <span className="text-sm font-medium capitalize">{org.plan}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-muted/30 px-4 py-2.5">
                      <span className="text-sm text-muted-foreground">Your role</span>
                      <span className="text-sm font-medium capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
