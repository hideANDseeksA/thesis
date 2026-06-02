import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
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

/**
 * StatusConfig maps status keys to their icon, color classes, and label.AC
 * Extend this object to add new statuses.
 */
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

/**
 * StatCard — A reusable financial/metric summary card.
 *
 * @param {string}   label          - Card description label (e.g. "Q1 Net Revenue")
 * @param {string}   value          - Primary display value (e.g. "$512,800")
 * @param {"on-track"|"monitoring"|"at-risk"|"under-review"|"pending"|"on-review"|"action"|"resolve"|"decline"} status - Status key
 * @param {number}   goalsAchieved  - Number of goals achieved
 * @param {number}   goalsTotal     - Total number of goals
 * @param {Function} onDetailClick  - Optional callback when the detail button is clicked
 * @param {string}   className      - Optional extra class names for the Card
 */
export function StatCard({
  label,
  value,
  status = "on-track",
  goalsAchieved = 0,
  goalsTotal = 6,
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
        <button
          onClick={onDetailClick}
          className="bg-muted/60 hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
          aria-label={`${label} — ${status} — ${goalsAchieved} of ${goalsTotal} goals`}
        >
          {/* Status Icon */}
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md text-white [&>svg]:size-4",
              config.iconBg
            )}
          >
            <Icon aria-hidden="true" />
          </span>

          {/* Goals & Status Text */}
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

/**
 * StatCardGrid — Convenience wrapper that renders a responsive 4-column grid of StatCards.
 *
 * @param {Array<object>} cards - Array of prop objects passed to each StatCard
 */
export function StatCardGrid({ cards = [] }) {
  return (
    <div className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:px-8 xl:grid-cols-4">
        {cards.map((cardProps, i) => (
          <StatCard key={i} {...cardProps} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example usage (can be removed in production)
// ---------------------------------------------------------------------------
const EXAMPLE_CARDS = [
  {
    label: "Q1 Net Revenue",
    value: "$512,800",
    status: "on-track",
    goalsAchieved: 6,
    goalsTotal: 6,
    onDetailClick: () => console.log("Q1 Net Revenue clicked"),
  },
  {
    label: "Operational Costs",
    value: "$198,450",
    status: "monitoring",
    goalsAchieved: 3,
    goalsTotal: 6,
  },
  {
    label: "Outstanding Invoices",
    value: "$74,120",
    status: "at-risk",
    goalsAchieved: 1,
    goalsTotal: 6,
  },
  {
    label: "Annual Tax Provision",
    value: "$93,600",
    status: "under-review",
    goalsAchieved: 2,
    goalsTotal: 6,
  },
];

export default function App() {
  return <StatCardGrid cards={EXAMPLE_CARDS} />;
}