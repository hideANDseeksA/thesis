import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import {
  Users,
  FileText,
  AlertTriangle,
  Award,
  CreditCard,
  Shield,
  HeartPulse,
  Baby,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Clock,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── StatusConfig (from StatCard component) ────────────────────────────────────

const STATUS_CONFIG = {
  "on-track": {
    icon: TrendingUp,
    textClass: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-600 dark:bg-green-500",
    label: "On Track",
  },
  monitoring: {
    icon: Minus,
    textClass: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500 dark:bg-amber-400",
    label: "Monitoring",
  },
  "at-risk": {
    icon: TrendingDown,
    textClass: "text-red-600 dark:text-red-400",
    iconBg: "bg-destructive",
    label: "At Risk",
  },
  "under-review": {
    icon: ShieldAlert,
    textClass: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-600 dark:bg-sky-500",
    label: "Under Review",
  },
  pending: {
    icon: Clock,
    textClass: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-500 dark:bg-orange-400",
    label: "Pending",
  },
  "on-review": {
    icon: Eye,
    textClass: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-600 dark:bg-violet-500",
    label: "On Review",
  },
  action: {
    icon: Zap,
    textClass: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-500 dark:bg-yellow-400",
    label: "On Action",
  },
  resolve: {
    icon: CheckCircle,
    textClass: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-600 dark:bg-emerald-500",
    label: "Resolved",
  },
  decline: {
    icon: XCircle,
    textClass: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-600 dark:bg-rose-500",
    label: "Declined",
  },
};

// ─── StatCard (from reusable component) ───────────────────────────────────────

export function StatCard({
  label,
  value,
  status = "on-track",
  footer,
  onDetailClick,
  className,
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG["on-track"];
  const Icon = config.icon;

  return (
    <Card className={cn("flex flex-col gap-4 py-6", className)}>
      <CardHeader className="gap-1 px-6">
        <CardDescription className="text-sm">{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {footer && (
          <p className="text-xs text-muted-foreground border-t pt-3 mb-3">{footer}</p>
        )}
        <button
          onClick={onDetailClick}
          className="bg-muted/60 hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
          aria-label={`${label} — ${status}`}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md text-white [&>svg]:size-4",
              config.iconBg
            )}
          >
            <Icon aria-hidden="true" />
          </span>
          <span className="flex flex-1 flex-col items-start leading-tight">
            <span className={cn("text-xs font-medium", config.textClass)}>
              {config.label}
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </button>
      </CardContent>
    </Card>
  );
}

// ─── MetricCard helpers (from MetricCards.jsx) ─────────────────────────────────

function getCSSVar(name) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function resolveColor(val, fallback = "#000") {
  if (!val) return fallback;
  if (val.includes("(") || val.startsWith("#")) return val;
  return `hsl(${val})`;
}
function primaryColor() {
  return resolveColor(getCSSVar("--primary"), "hsl(221 83% 53%)");
}
function primaryMuted(opacity = 0.2) {
  const raw = getCSSVar("--primary");
  if (raw && !raw.includes("(") && !raw.startsWith("#")) return `hsl(${raw} / ${opacity})`;
  const base = resolveColor(raw, "hsl(221 83% 53%)");
  return `color-mix(in srgb, ${base} ${Math.round(opacity * 100)}%, transparent)`;
}
function mutedFgColor() {
  return resolveColor(getCSSVar("--muted-foreground"), "#71717a");
}
function cardBgColor() {
  return resolveColor(getCSSVar("--card"), "#ffffff");
}

function MetricCard({ className, children }) {
  return (
    <div className={cn("bg-card text-card-foreground border border-border rounded-2xl shadow-sm", className)}>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs text-card-foreground">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="font-medium text-primary">
          {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── BarMetricCard ─────────────────────────────────────────────────────────────

export function BarMetricCard({ title, subtitle, value, badge, badgeUp = true, data = [], formatter }) {
  const primary = primaryColor();
  const dimmed = primaryMuted(0.2);
  const tickColor = mutedFgColor();
  return (
    <MetricCard className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 shrink-0">
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
            badgeUp ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          )}>
            {badgeUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {badge}
          </span>
        </div>
      </div>
      <div className="w-full h-44" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart data={data} barSize={12} margin={{ top: 4, right: 4, bottom: 16, left: 4 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} />
            <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: "transparent" }} />
            <Bar dataKey="value" radius={[6, 6, 6, 6]} isAnimationActive fill={dimmed}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.highlight ? primary : dimmed} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </MetricCard>
  );
}

// ─── DonutMetricCard ───────────────────────────────────────────────────────────

export function DonutMetricCard({ title, subtitle, centerLabel, segments = [] }) {
  const primary = primaryColor();
  const seg60 = primaryMuted(0.6);
  const seg20 = primaryMuted(0.2);
  const segColors = [primary, seg60, seg20, "#22c55e", "#f59e0b", "#f87171"];
  const cardBg = cardBgColor();
  return (
    <MetricCard className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 overflow-hidden">
      <div className="flex flex-col gap-2 shrink-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="w-full flex justify-center">
        <div className="relative" style={{ width: 150, height: 150, minWidth: 150 }}>
          <PieChart width={150} height={150}>
            <Pie data={segments} cx={75} cy={75} innerRadius={45} outerRadius={68} strokeWidth={2} stroke={cardBg} dataKey="value" isAnimationActive>
              {segments.map((_, i) => <Cell key={i} fill={segColors[i % segColors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12 }} />
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-semibold text-foreground">{centerLabel}</span>
          </div>
        </div>
      </div>
    </MetricCard>
  );
}

// ─── CompactBarMetricCard ──────────────────────────────────────────────────────

export function CompactBarMetricCard({ title, description, badge, badgeUp = true, data = [], formatter }) {
  const primary = primaryColor();
  const tickColor = mutedFgColor();
  return (
    <MetricCard className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-foreground">{title}</span>
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
          badgeUp ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        )}>
          {badgeUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {badge}
        </span>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">{description}</p>
      <div style={{ width: "100%", height: 144, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart data={data} barSize={12} margin={{ top: 4, right: 4, bottom: 16, left: 4 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} />
            <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: "transparent" }} />
            <Bar dataKey="value" radius={[6, 6, 6, 6]} fill={primary} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </MetricCard>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    pending:    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
    unclaimed: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    "on process":  "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
    completed:  "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    resolved:   "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    ongoing:    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    delivered:  "bg-green-50 text-green-700 border-green-200",
    declined:   "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    approved:   "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800",
    cancelled:  "bg-rose-50 text-rose-700 border-rose-200",
    closed:    "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800",
    "on review":"bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", map[status] ?? "bg-muted text-muted-foreground border-border")}>
      {status}
    </span>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { noun: "Residents",    path: "/resident-list",                  bg: "#E6F1FB", color: "#185FA5", Icon: Users         },
  { noun: "Documents",    path: "/documents",                      bg: "#EAF3DE", color: "#3B6D11", Icon: FileText      },
  { noun: "Complaints",   path: "/complaints",                     bg: "#FAECE7", color: "#993C1D", Icon: AlertTriangle },
  { noun: "Certificates", path: "/certificates/list",              bg: "#EEEDFE", color: "#534AB7", Icon: Award         },
  { noun: "Transactions", path: "/certificates/online-request",    bg: "#FAEEDA", color: "#854F0B", Icon: CreditCard    },
  { noun: "Blotter",      path: "/blotter/blotter-list",           bg: "#FCEBEB", color: "#A32D2D", Icon: Shield        },
  { noun: "Health",       path: "/health-records",                 bg: "#E1F5EE", color: "#0F6E56", Icon: HeartPulse    },
  { noun: "Maternal",     path: "/pregnant-records",               bg: "#FBEAF0", color: "#993556", Icon: Baby          },
];

function QuickActions() {
  const navigate = useNavigate();
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2.5 font-medium">
        Quick actions
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {QUICK_ACTIONS.map(({ noun, path, bg, color, Icon }) => (
          <button
            key={noun}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border border-border bg-card hover:bg-muted active:scale-95 transition-all"
          >
            <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center" style={{ background: bg }}>
              <Icon size={17} color={color} strokeWidth={2} />
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">Manage</span>
            <span className="text-[12px] font-medium leading-none text-foreground">{noun}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Recent tables ─────────────────────────────────────────────────────────────

function RecentTable({ title, subtitle, columns, rows }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="border-b">
              {columns.map((c) => (
                <th key={c} className="p-3 text-left text-xs font-medium text-foreground whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </Card>
  );
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function BarangayDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);


useEffect(() => {
  api
    .get("/analytics/dashboard/stats")
    .then((res) => {
      setData(res.data.data);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
    });
}, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading dashboard…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive text-sm">
        Failed to load dashboard data.
      </div>
    );
  }

  const { residents, blotter, complaints, pregnancy, certificates } = data;

  // ── KPI status helpers ──────────────────────────────────────────────────────
  const voterPct = residents.total ? Math.round((residents.registered_voters / residents.total) * 100) : 0;
  const blotterStatus = blotter.pending > 0 ? "at-risk" : "resolve";
  const certStatus = certificates.pending > 0 ? "pending" : certificates.approved > 0 ? "on-track" : "resolve";
  const complaintStatus = complaints.pending > 0 ? "pending" : complaints.resolved > 0 ? "resolve" : "monitoring";

  // ── Age distribution → BarMetricCard data ──────────────────────────────────
  const ageBarData = residents.age_distribution.map((a) => ({
    label: a.label.split(" ")[0],
    value: a.count,
    highlight: a.count === Math.max(...residents.age_distribution.map((x) => x.count)),
  }));

  // ── Gender → DonutMetricCard segments ──────────────────────────────────────
  const genderSegments = [
    { name: "Male",   value: residents.gender_distribution.male   },
    { name: "Female", value: residents.gender_distribution.female },
  ];

  // ── Complaint types → CompactBarMetricCard ──────────────────────────────────
  const complaintBarData = complaints.top_types.map((t, i) => ({
    label: t.complaint_type.split(" ")[0],
    value: t.count,
  }));

  // ── Top requested certs → BarMetricCard ────────────────────────────────────
  const certBarData = certificates.top_requested.map((c) => ({
    label: c.certificate_name.split(" ").slice(-1)[0],
    value: c.count,
    highlight: c.count === Math.max(...certificates.top_requested.map((x) => x.count)),
  }));

  return (
    <div className="flex flex-col gap-6 py-6">

      {/* Quick Actions — kept as-is */}
      <QuickActions />

      {/* ── KPI StatCards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total residents"
          value={residents.total.toLocaleString()}
          status="on-track"
          footer={`${residents.gender_distribution.male}M · ${residents.gender_distribution.female}F · ${voterPct}% registered voters`}
        />
        <StatCard
          label="Registered voters"
          value={residents.registered_voters.toLocaleString()}
          status={residents.registered_voters > 0 ? "on-track" : "monitoring"}
          footer={`${voterPct}% of total residents`}
        />
        <StatCard
          label="Blotter cases"
          value={blotter.total.toLocaleString()}
          status={blotterStatus}
          footer={`${blotter.pending} pending · ${blotter.resolved} resolved · ${blotter.ongoing} ongoing`}
        />
        <StatCard
          label="Certificate requests"
          value={certificates.total.toLocaleString()}
          status={certStatus}
          footer={`${certificates.approved} approved · ${certificates.released} released`}
        />
      </div>

      {/* ── Chart row 1: Age bars + Gender donut ───────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <BarMetricCard
          title="Age distribution"
          subtitle="Residents by age group"
          value={`${residents.total} total`}
          badge={`${ageBarData.find(a => a.highlight)?.label ?? ""} largest group`}
          badgeUp={true}
          data={ageBarData}
        />
        <DonutMetricCard
          title="Gender breakdown"
          subtitle="Male vs Female residents"
          centerLabel={`${residents.total}`}
          segments={genderSegments}
        />
      </div>

      {/* ── Chart row 2: Complaint types + Top cert types ──────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <CompactBarMetricCard
          title={`${complaints.total}`}
          description="Total complaints filed"
          badge={`${complaints.resolved} resolved`}
          badgeUp={complaints.resolved > 0}
          data={complaintBarData}
        />
        <BarMetricCard
          title="Top certificate requests"
          subtitle="By certificate type"
          value={`${certificates.total} total`}
          badge={`${certificates.top_requested[0]?.certificate_name ?? ""}`}
          badgeUp={true}
          data={certBarData}
        />
      </div>

      {/* ── Pregnancy StatCard + Blotter StatCard ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Pregnancy monitoring"
          value={`${pregnancy.total} tracked`}
          status={pregnancy.overdue > 0 ? "at-risk" : pregnancy.due_soon_30_days > 0 ? "monitoring" : "ongoing" in pregnancy && pregnancy.ongoing > 0 ? "on-track" : "resolve"}
          footer={`${pregnancy.ongoing} ongoing · ${pregnancy.delivered} delivered · ${pregnancy.due_soon_30_days} due soon`}
        />
        <StatCard
          label="Active blotter cases"
          value={`${blotter.pending} pending`}
          status={blotter.pending > 2 ? "at-risk" : blotter.pending > 0 ? "pending" : "resolve"}
          footer={`${blotter.total} total · ${blotter.resolved} resolved`}
        />
        <StatCard
          label="Complaints"
          value={`${complaints.total} total`}
          status={complaintStatus}
          footer={`${complaints.resolved} resolved · ${complaints.ongoing} ongoing · ${complaints.pending} pending`}
        />
      </div>

      {/* ── Recent Certificate Transactions table ───────────────────────────── */}
      <RecentTable
        title="Recent certificate transactions"
        subtitle="Latest requests across all types"
        columns={["Resident", "Certificate", "Status", "Date"]}
        rows={certificates.recent.map((c) => (
          <tr key={c.id} className="border-b hover:bg-muted/50 transition-colors">
            <td className="p-3 whitespace-nowrap font-medium">{cap(c.resident.f_name)} {cap(c.resident.l_name)}</td>
            <td className="p-3 whitespace-nowrap text-muted-foreground">{c.certificate_name}</td>
            <td className="p-3"><StatusBadge status={c.status} /></td>
            <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(c.timestamp)}</td>
          </tr>
        ))}
      />

      {/* ── Recent Complaints + Blotter tables ─────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <RecentTable
          title="Recent complaints"
          subtitle="Latest filed cases"
          columns={["Resident", "Type", "Status", "Date"]}
          rows={complaints.recent.map((c) => (
            <tr key={c.id} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-3 whitespace-nowrap font-medium">{cap(c.resident.f_name)} {cap(c.resident.l_name)}</td>
              <td className="p-3 text-muted-foreground">{c.complaint_type}</td>
              <td className="p-3"><StatusBadge status={c.status} /></td>
              <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(c.created_at)}</td>
            </tr>
          ))}
        />
        <RecentTable
          title="Recent blotter cases"
          subtitle="Open and pending blotter entries"
          columns={["Case No.", "Resident", "Status", "Filed"]}
          rows={blotter.recent.map((b) => (
            <tr key={b.case_no} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-3 whitespace-nowrap font-medium">#{b.case_no}</td>
              <td className="p-3 whitespace-nowrap">{cap(b.resident.f_name)} {cap(b.resident.l_name)}</td>
              <td className="p-3"><StatusBadge status={b.status} /></td>
              <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(b.created_at)}</td>
            </tr>
          ))}
        />
      </div>

      {/* ── Pregnancy monitoring table ──────────────────────────────────────── */}
      <RecentTable
        title="Pregnancy monitoring"
        subtitle="Active and recent maternal cases"
        columns={["Patient", "Trimester", "Expected Delivery", "Last Checkup", "Status"]}
        rows={pregnancy.recent_ongoing.map((p) => (
          <tr key={p.id} className="border-b hover:bg-muted/50 transition-colors">
            <td className="p-3 whitespace-nowrap font-medium">{cap(p.resident.f_name)} {cap(p.resident.l_name)}</td>
            <td className="p-3 text-center">T{p.current_trimester}</td>
            <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(p.expected_delivery_date)}</td>
            <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(p.last_checkup)}</td>
            <td className="p-3"><StatusBadge status={p.status} /></td>
          </tr>
        ))}
      />

    </div>
  );
}