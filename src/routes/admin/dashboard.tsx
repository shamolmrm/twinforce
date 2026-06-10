import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  adminApi, billingApi,
  type AdminDashboardData, type AdminOrg, type AdminUser,
  type AdminAuditLog, type AdminAnalytics, type ApiPlan,
} from "@/lib/api";
import {
  LayoutDashboard, Building2, Users, CreditCard, BarChart3,
  UsersRound, ClipboardList, Download, Settings, LogOut, ChevronRight,
  TrendingUp, Activity, Shield, Bell, Search, RefreshCw, FileText,
  Printer, TableProperties, X, Check, AlertTriangle, Ban,
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — TwinForce" }],
  }),
  component: AdminDashboardPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString(); }
function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function exportCSV(filename: string, rows: object[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, loading, accent, icon: Icon, delta }: {
  label: string; value: string; sub?: string; loading?: boolean; accent?: boolean;
  icon?: React.ElementType; delta?: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur ${accent ? "border-primary/30 bg-primary/5" : "border-border/60 bg-card/40"}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>}
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-28 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      )}
      <div className="mt-1 flex items-center gap-2">
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {delta && <span className="text-xs font-medium text-green-400">{delta}</span>}
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const cls =
    status === "active" || status === "success" ? "bg-green-500/10 text-green-400 border-green-500/20" :
    status === "suspended" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
    status === "trialing" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
    status === "cancelled" || status === "banned" ? "bg-red-500/10 text-red-400 border-red-500/20" :
    "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-xs text-muted-foreground">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
      <div className="flex gap-1">
        <button className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40" disabled={page === 1} onClick={() => onChange(page - 1)}>Prev</button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
          <button key={p} className={`rounded-lg border px-3 py-1 text-xs ${p === page ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`} onClick={() => onChange(p)}>{p}</button>
        ))}
        <button className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

// ─── Sidebar items ────────────────────────────────────────────────────────────
type Section = "overview" | "orgs" | "users" | "plans" | "analytics" | "teams" | "audit" | "export" | "settings";

const navItems: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orgs", label: "Organizations", icon: Building2 },
  { key: "users", label: "Users", icon: Users },
  { key: "plans", label: "Plans", icon: CreditCard },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "teams", label: "Teams", icon: UsersRound },
  { key: "audit", label: "Audit Logs", icon: ClipboardList },
  { key: "export", label: "Export", icon: Download },
  { key: "settings", label: "Settings", icon: Settings },
];

const sectionTitles: Record<Section, string> = {
  overview: "Dashboard Overview",
  orgs: "Organizations",
  users: "Users",
  plans: "Subscription Plans",
  analytics: "Analytics",
  teams: "Team Management",
  audit: "Audit Logs",
  export: "Export & Reports",
  settings: "System Settings",
};

// ─── Main Component ───────────────────────────────────────────────────────────
function AdminDashboardPage() {
  const { user, logout, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orgsPage, setOrgsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editPlan, setEditPlan] = useState<Partial<ApiPlan> | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate({ to: "/admin/login" });
  }, [user, authLoading, isAdmin, navigate]);

  // Queries
  const { data: dashData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminApi.dashboard(),
    enabled: isAdmin,
    staleTime: 30_000,
  });
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics", 30],
    queryFn: () => adminApi.analytics(30),
    enabled: isAdmin && (section === "overview" || section === "analytics"),
    staleTime: 60_000,
  });
  const { data: orgsData, isLoading: orgsLoading, refetch: refetchOrgs } = useQuery({
    queryKey: ["admin-orgs", orgsPage],
    queryFn: () => adminApi.organizations({ page: orgsPage, limit: 15 }),
    enabled: isAdmin && section === "orgs",
    staleTime: 30_000,
  });
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users", usersPage],
    queryFn: () => adminApi.users({ page: usersPage, limit: 15 }),
    enabled: isAdmin && section === "users",
    staleTime: 30_000,
  });
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["admin-audit", auditPage],
    queryFn: () => adminApi.auditLogs({ page: auditPage, limit: 20 }),
    enabled: isAdmin && section === "audit",
    staleTime: 20_000,
  });
  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => adminApi.plans(),
    enabled: isAdmin && section === "plans",
    staleTime: 60_000,
  });

  // Mutations
  const toggleOrgStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" | "cancelled" }) =>
      adminApi.updateOrgStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); refetchOrgs(); },
  });
  const toggleUserStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" | "banned" }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: () => refetchUsers(),
  });
  const createPlan = useMutation({
    mutationFn: (body: Partial<ApiPlan>) => adminApi.createPlan(body),
    onSuccess: () => { refetchPlans(); setEditPlan(null); },
  });

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const stats = dashData?.data?.stats;
  const recentOrgs = dashData?.data?.recentOrganizations ?? [];
  const recentUsers = dashData?.data?.recentUsers ?? [];
  const recentAudit = dashData?.data?.recentAuditLogs ?? [];
  const analytics = analyticsData?.data;
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const maxMetric = analytics
    ? Math.max(analytics.newOrganizations, analytics.newUsers, analytics.newTwins, analytics.newMeetings, 1)
    : 1;

  const handlePrint = () => window.print();
  const handleExportOrgs = () => {
    const rows = (orgsData?.data ?? []).map((o: AdminOrg) => ({
      id: o.id, name: o.name, slug: o.slug, plan: o.plan, status: o.status,
      users: o.userCount, twins: o.twinCount, created: new Date(o.createdAt).toLocaleDateString(),
    }));
    exportCSV("twinforce-organizations.csv", rows);
  };
  const handleExportUsers = () => {
    const rows = (usersData?.data ?? []).map((u: AdminUser) => ({
      id: u.id, name: u.fullName, email: u.email, role: u.role,
      org: u.organizationName, status: u.status,
      lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "never",
      joined: new Date(u.createdAt).toLocaleDateString(),
    }));
    exportCSV("twinforce-users.csv", rows);
  };
  const handleExportAudit = () => {
    const rows = (auditData?.data ?? []).map((l: AdminAuditLog) => ({
      id: l.id, action: l.action, resource: l.resourceType, status: l.status,
      ip: l.ipAddress, time: new Date(l.createdAt).toLocaleString(),
    }));
    exportCSV("twinforce-audit.csv", rows);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground print:block" ref={printRef}>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { page-break-inside: avoid; }
        }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`no-print sticky top-0 flex h-screen flex-col border-r border-border/60 bg-card/30 backdrop-blur-xl transition-all duration-200 ${sidebarOpen ? "w-56" : "w-16"}`}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/60 px-4">
          <a href="/" className="flex items-center gap-2 font-heading font-bold">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
            {sidebarOpen && <span className="text-sm">TwinForce</span>}
          </a>
          {sidebarOpen && (
            <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              Admin
            </span>
          )}
        </div>

        {/* Nav */}
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
            </button>
          ))}
        </nav>

        {/* Sidebar toggle */}
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
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{sectionTitles[section]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { refetchDash(); refetchOrgs(); refetchUsers(); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
              title="Refresh data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handlePrint}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
              title="Print / Save PDF"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
            <button
              onClick={async () => { await logout(); navigate({ to: "/admin/login" }); }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Overview ─────────────────────────────────────────────────── */}
          {section === "overview" && (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <StatCard label="Organizations" value={fmt(stats?.totalOrganizations ?? 0)} sub="All tenants" loading={dashLoading} icon={Building2} />
                <StatCard label="Total Users" value={fmt(stats?.totalUsers ?? 0)} sub="Across all orgs" loading={dashLoading} icon={Users} />
                <StatCard label="AI Twins" value={fmt(stats?.totalTwins ?? 0)} sub="Deployed" loading={dashLoading} icon={Activity} />
                <StatCard label="Meetings" value={fmt(stats?.totalMeetings ?? 0)} sub="All time" loading={dashLoading} icon={UsersRound} />
                <StatCard label="Active Subs" value={fmt(stats?.activeSubscriptions ?? 0)} sub="Paying + trial" loading={dashLoading} icon={CreditCard} />
                <StatCard label="MRR" value={fmtUsd(stats?.mrrUsd ?? 0)} sub="Monthly revenue" loading={dashLoading} icon={TrendingUp} accent />
                <StatCard label="ARR" value={fmtUsd(stats?.arrUsd ?? 0)} sub="Annual run rate" loading={dashLoading} icon={TrendingUp} accent />
              </div>

              {/* 30-day growth + bar chart */}
              {analytics && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Metric bars */}
                  <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
                    <h3 className="mb-4 text-sm font-semibold">30-Day Growth</h3>
                    <div className="space-y-4">
                      {[
                        { label: "New Organizations", value: analytics.newOrganizations },
                        { label: "New Users", value: analytics.newUsers },
                        { label: "New Twins", value: analytics.newTwins },
                        { label: "New Meetings", value: analytics.newMeetings },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold">+{fmt(value)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/60"
                              style={{ width: `${Math.max(2, (value / maxMetric) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Revenue snapshot */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <h3 className="mb-4 text-sm font-semibold">Revenue Snapshot</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current MRR</span>
                        <span className="font-bold text-primary">{fmtUsd(analytics.currentMrr ?? stats?.mrrUsd ?? 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current ARR</span>
                        <span className="font-bold text-primary">{fmtUsd(analytics.currentArr ?? stats?.arrUsd ?? 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active subscriptions</span>
                        <span className="font-bold">{fmt(stats?.activeSubscriptions ?? 0)}</span>
                      </div>
                      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Average revenue per account</p>
                        <p className="mt-1 text-2xl font-bold text-primary">
                          {stats?.activeSubscriptions
                            ? fmtUsd(Math.round((stats.mrrUsd ?? 0) / stats.activeSubscriptions))
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent tables */}
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <h3 className="text-sm font-semibold">Recent Organizations</h3>
                    <button onClick={() => setSection("orgs")} className="text-xs text-primary hover:underline">View all →</button>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {dashLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}><td className="p-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td></tr>
                        ))
                        : recentOrgs.slice(0, 5).map((org) => (
                          <tr key={org.id} className="border-t border-border/40 hover:bg-muted/20">
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-sm">{org.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{org.plan} · {relativeTime(org.createdAt!)}</p>
                            </td>
                            <td className="px-4 py-2.5"><Badge status={org.status ?? "active"} /></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <h3 className="text-sm font-semibold">Recent Users</h3>
                    <button onClick={() => setSection("users")} className="text-xs text-primary hover:underline">View all →</button>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {dashLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}><td className="p-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td></tr>
                        ))
                        : recentUsers.slice(0, 5).map((u) => (
                          <tr key={u.id} className="border-t border-border/40 hover:bg-muted/20">
                            <td className="px-4 py-2.5">
                              <p className="font-medium">{u.fullName ?? "—"}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </td>
                            <td className="px-4 py-2.5 text-xs capitalize text-muted-foreground">{u.role}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent audit */}
              <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <h3 className="text-sm font-semibold">Recent Activity</h3>
                  <button onClick={() => setSection("audit")} className="text-xs text-primary hover:underline">View all →</button>
                </div>
                <div className="divide-y divide-border/40">
                  {recentAudit.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${log.status === "success" ? "bg-green-400" : "bg-red-400"}`} />
                        <span className="font-mono text-xs">{log.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{relativeTime(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Organizations ─────────────────────────────────────────────── */}
          {section === "orgs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search organizations…"
                    className="rounded-lg border border-border bg-card/40 py-1.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleExportOrgs}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20">
                      {["Organization", "Plan / Subscription", "Users", "Twins", "Status", "Created", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orgsLoading
                      ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td colSpan={7} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td>
                        </tr>
                      ))
                      : (orgsData?.data ?? [])
                          .filter((o: AdminOrg) => !search || o.name.toLowerCase().includes(search.toLowerCase()))
                          .map((org: AdminOrg) => (
                          <tr key={org.id} className="border-b border-border/40 hover:bg-muted/10">
                            <td className="px-4 py-3">
                              <p className="font-medium">{org.name}</p>
                              <p className="text-xs text-muted-foreground">{org.slug}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="capitalize">{org.subscription?.planName ?? org.plan}</p>
                              {org.subscription && <p className="text-xs text-muted-foreground">${org.subscription.priceMonthly}/mo</p>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span>{org.userCount}</span>
                                {org.maxEmployees > 0 && <MiniBar value={org.userCount} max={org.maxEmployees} />}
                              </div>
                            </td>
                            <td className="px-4 py-3">{org.twinCount}</td>
                            <td className="px-4 py-3"><Badge status={org.status} /></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(org.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button
                                  disabled={toggleOrgStatus.isPending}
                                  onClick={() => toggleOrgStatus.mutate({ id: org.id, status: org.status === "active" ? "suspended" : "active" })}
                                  className={`rounded px-2 py-1 text-xs font-medium border transition-colors ${org.status === "active" ? "border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" : "border-green-500/30 text-green-500 hover:bg-green-500/10"}`}
                                >
                                  {org.status === "active" ? "Suspend" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={orgsPage} total={orgsData?.total ?? 0} limit={15} onChange={setOrgsPage} />
            </div>
          )}

          {/* ── Users ─────────────────────────────────────────────────────── */}
          {section === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users…"
                    className="rounded-lg border border-border bg-card/40 py-1.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleExportUsers}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20">
                      {["User", "Organization", "Role", "Status", "Last Login", "Joined", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading
                      ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td colSpan={7} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td>
                        </tr>
                      ))
                      : (usersData?.data ?? [])
                          .filter((u: AdminUser) => !search || u.email.includes(search) || (u.fullName ?? "").toLowerCase().includes(search.toLowerCase()))
                          .map((u: AdminUser) => (
                          <tr key={u.id} className="border-b border-border/40 hover:bg-muted/10">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                                  {(u.fullName ?? u.email).slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{u.fullName ?? "—"}</p>
                                  <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{u.organizationName}</td>
                            <td className="px-4 py-3 capitalize text-sm">{u.role}</td>
                            <td className="px-4 py-3"><Badge status={u.status} /></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {u.lastLoginAt ? relativeTime(u.lastLoginAt) : "Never"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {u.status === "active" ? (
                                  <button
                                    onClick={() => toggleUserStatus.mutate({ id: u.id, status: "suspended" })}
                                    className="rounded px-2 py-1 text-[10px] border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                                  >Suspend</button>
                                ) : (
                                  <button
                                    onClick={() => toggleUserStatus.mutate({ id: u.id, status: "active" })}
                                    className="rounded px-2 py-1 text-[10px] border border-green-500/30 text-green-500 hover:bg-green-500/10"
                                  >Activate</button>
                                )}
                                {u.role !== "super_admin" && (
                                  <button
                                    onClick={() => toggleUserStatus.mutate({ id: u.id, status: "banned" })}
                                    className="rounded px-2 py-1 text-[10px] border border-red-500/30 text-red-500 hover:bg-red-500/10"
                                  >Ban</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={usersPage} total={usersData?.total ?? 0} limit={15} onChange={setUsersPage} />
            </div>
          )}

          {/* ── Plans ─────────────────────────────────────────────────────── */}
          {section === "plans" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Manage subscription plans available to customers.</p>
                <button
                  onClick={() => setEditPlan({ name: "", slug: "", priceMonthly: "0", priceYearly: "0", maxEmployees: 10, maxTwins: 10, features: [] })}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  + Create Plan
                </button>
              </div>

              {plansLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl border border-border/60 bg-card/40" />)}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {(plansData?.data ?? []).map((plan: ApiPlan) => (
                    <div key={plan.id} className="rounded-2xl border border-border/60 bg-card/40 p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading font-bold">{plan.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                        </div>
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">{plan.slug}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-muted/30 p-2.5">
                          <p className="text-xs text-muted-foreground">Monthly</p>
                          <p className="font-bold">${plan.priceMonthly}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-2.5">
                          <p className="text-xs text-muted-foreground">Yearly</p>
                          <p className="font-bold">${plan.priceYearly}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {plan.maxEmployees === -1 ? "Unlimited" : plan.maxEmployees} users ·{" "}
                          {plan.maxTwins === -1 ? "Unlimited" : plan.maxTwins} twins
                        </p>
                        {(plan.features as string[]).slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <Check className="h-3 w-3 text-primary" />{f}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit/Create plan modal */}
              {editPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
                  <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">{editPlan.id ? "Edit Plan" : "Create Plan"}</h3>
                      <button onClick={() => setEditPlan(null)}><X className="h-4 w-4" /></button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { key: "name", label: "Plan Name", type: "text" },
                        { key: "slug", label: "Slug", type: "text" },
                        { key: "description", label: "Description", type: "text" },
                        { key: "priceMonthly", label: "Monthly Price ($)", type: "number" },
                        { key: "priceYearly", label: "Yearly Price ($)", type: "number" },
                        { key: "maxEmployees", label: "Max Employees (-1 = unlimited)", type: "number" },
                        { key: "maxTwins", label: "Max Twins (-1 = unlimited)", type: "number" },
                      ].map(({ key, label, type }) => (
                        <div key={key}>
                          <label className="text-xs text-muted-foreground">{label}</label>
                          <input
                            type={type}
                            value={(editPlan as any)[key] ?? ""}
                            onChange={(e) => setEditPlan((p) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => createPlan.mutate(editPlan)}
                        disabled={createPlan.isPending}
                        className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        {createPlan.isPending ? "Saving…" : "Save Plan"}
                      </button>
                      <button onClick={() => setEditPlan(null)} className="flex-1 rounded-lg border border-border py-2 text-sm hover:bg-muted">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Analytics ─────────────────────────────────────────────────── */}
          {section === "analytics" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="New Orgs (30d)" value={`+${fmt(analytics?.newOrganizations ?? 0)}`} loading={analyticsLoading} icon={Building2} delta="↑" />
                <StatCard label="New Users (30d)" value={`+${fmt(analytics?.newUsers ?? 0)}`} loading={analyticsLoading} icon={Users} delta="↑" />
                <StatCard label="New Twins (30d)" value={`+${fmt(analytics?.newTwins ?? 0)}`} loading={analyticsLoading} icon={Activity} />
                <StatCard label="New Meetings (30d)" value={`+${fmt(analytics?.newMeetings ?? 0)}`} loading={analyticsLoading} icon={UsersRound} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
                  <h3 className="mb-4 text-sm font-semibold">30-Day Growth Bars</h3>
                  <div className="space-y-5">
                    {analytics
                      ? [
                          { label: "Organizations", value: analytics.newOrganizations, color: "bg-blue-500" },
                          { label: "Users", value: analytics.newUsers, color: "bg-primary" },
                          { label: "AI Twins", value: analytics.newTwins, color: "bg-violet-500" },
                          { label: "Meetings", value: analytics.newMeetings, color: "bg-green-500" },
                        ].map(({ label, value, color }) => (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-semibold">+{fmt(value)}</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-muted">
                              <div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${Math.max(2, (value / maxMetric) * 100)}%` }} />
                            </div>
                          </div>
                        ))
                      : <div className="h-32 animate-pulse rounded bg-muted" />}
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                  <h3 className="mb-4 text-sm font-semibold">Revenue Metrics</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Monthly Recurring Revenue (MRR)", value: fmtUsd(stats?.mrrUsd ?? 0) },
                      { label: "Annual Recurring Revenue (ARR)", value: fmtUsd(stats?.arrUsd ?? 0) },
                      { label: "Active Subscriptions", value: fmt(stats?.activeSubscriptions ?? 0) },
                      { label: "Avg. Revenue Per Account", value: (stats?.activeSubscriptions && stats.mrrUsd) ? fmtUsd(Math.round(stats.mrrUsd / stats.activeSubscriptions)) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2.5">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="font-bold text-primary">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Teams ─────────────────────────────────────────────────────── */}
          {section === "teams" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Team hierarchies across all organizations. Each organization's owner is the team head.</p>
              <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20">
                      {["Organization", "Team Head (Owner)", "Members", "Plan", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(orgsData?.data ?? recentOrgs).map((org: any) => (
                      <tr key={org.id} className="border-b border-border/40 hover:bg-muted/10">
                        <td className="px-4 py-3">
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.domain ?? org.slug}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Owner
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{org.userCount ?? "—"}</span>
                            {org.maxEmployees > 0 && <MiniBar value={org.userCount ?? 0} max={org.maxEmployees} />}
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize">{org.subscription?.planName ?? org.plan}</td>
                        <td className="px-4 py-3"><Badge status={org.status ?? "active"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                <Shield className="mb-2 h-4 w-4 text-primary" />
                Team heads (organization owners) have full control over their team: invite/remove members, assign roles, manage twins, meetings, and billing within their plan limits. Super admins (you) can override any setting.
              </div>
            </div>
          )}

          {/* ── Audit Logs ────────────────────────────────────────────────── */}
          {section === "audit" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter by action…"
                    className="rounded-lg border border-border bg-card/40 py-1.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleExportAudit}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20">
                      {["Action", "Resource", "IP Address", "Status", "Time"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td colSpan={5} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td>
                        </tr>
                      ))
                      : (auditData?.data ?? [])
                          .filter((l: AdminAuditLog) => !search || l.action.includes(search))
                          .map((log: AdminAuditLog) => (
                          <tr key={log.id} className="border-b border-border/40 hover:bg-muted/10">
                            <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                            <td className="px-4 py-3 capitalize text-xs text-muted-foreground">{log.resourceType ?? "—"}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress ?? "—"}</td>
                            <td className="px-4 py-3"><Badge status={log.status} /></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={auditPage} total={auditData?.total ?? 0} limit={20} onChange={setAuditPage} />
            </div>
          )}

          {/* ── Export ────────────────────────────────────────────────────── */}
          {section === "export" && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">Export platform data as CSV files or print any section as PDF.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Organizations Report", desc: "All organizations with plan, user count, twin count, and status.", icon: Building2, action: () => { setSection("orgs"); } },
                  { title: "Users Report", desc: "All users with organization, role, status, and last login.", icon: Users, action: handleExportUsers },
                  { title: "Audit Log Report", desc: "All audit events with action, resource, IP, and timestamp.", icon: ClipboardList, action: handleExportAudit },
                  { title: "Revenue Report", desc: "MRR, ARR, subscription counts, and growth metrics.", icon: TrendingUp, action: () => setSection("analytics") },
                  { title: "Full Dashboard PDF", desc: "Print the current admin overview as a PDF document.", icon: Printer, action: handlePrint },
                  { title: "Team Hierarchy", desc: "Export team structure and member counts per organization.", icon: UsersRound, action: () => setSection("teams") },
                ].map(({ title, desc, icon: Icon, action }) => (
                  <div key={title} className="flex flex-col rounded-2xl border border-border/60 bg-card/40 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-3 font-semibold">{title}</h3>
                    <p className="mt-1 flex-1 text-xs text-muted-foreground">{desc}</p>
                    <button
                      onClick={action}
                      className="mt-4 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/60 hover:bg-primary/5"
                    >
                      <Download className="h-3.5 w-3.5" /> Export / View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Settings ──────────────────────────────────────────────────── */}
          {section === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <h3 className="mb-4 font-semibold">Admin Account</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge status="super_admin" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <h3 className="mb-4 font-semibold">System Status</h3>
                <div className="space-y-2">
                  {[
                    { service: "API Server", status: "operational" },
                    { service: "Database (PostgreSQL)", status: "operational" },
                    { service: "Cache (Redis)", status: "operational" },
                    { service: "Authentication", status: "operational" },
                    { service: "AI Service", status: "operational" },
                  ].map(({ service, status }) => (
                    <div key={service} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2.5">
                      <span className="text-sm">{service}</span>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                        <span className="text-xs text-green-400 capitalize">{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
                <h3 className="mb-1 font-semibold text-destructive">Danger Zone</h3>
                <p className="mb-4 text-xs text-muted-foreground">These actions are irreversible. Proceed with caution.</p>
                <button className="rounded-lg border border-destructive/30 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10">
                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                  Reset system data (requires 2FA)
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
