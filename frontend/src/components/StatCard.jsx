/**
 * MetricCards.jsx
 *
 * All colors are driven by your index.css CSS custom properties:
 *   --primary, --primary-foreground, --ring,
 *   --card, --card-foreground, --border,
 *   --muted, --muted-foreground, --foreground, --background
 *
 * Dark mode is handled automatically — just toggle the `dark` class on
 * your <html> element and every card adapts instantly.
 *
 * Fixes applied:
 *  - First XAxis label no longer clipped (left margin added to all charts)
 *  - Recharts width/height -1 warning resolved (minWidth:0 + minHeight on wrappers)
 *  - All chart containers use explicit height so ResponsiveContainer can measure correctly
 */

import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";

// ─── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Custom XAxis tick — truncates long labels and angles them.
 * Recharts passes x, y, payload automatically.
 */
function ResponsiveTick({ x, y, payload, maxChars = 5, fill }) {
  const label = String(payload.value);
  const truncated =
    label.length > maxChars ? label.slice(0, maxChars) + "…" : label;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="end"
        fill={fill}
        fontSize={10}
        transform="rotate(-35)"
      >
        {truncated}
      </text>
    </g>
  );
}

// ─── Runtime CSS variable resolvers ──────────────────────────────────────────

function getCSSVar(name) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
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
  if (raw && !raw.includes("(") && !raw.startsWith("#")) {
    return `hsl(${raw} / ${opacity})`;
  }
  const base = resolveColor(raw, "hsl(221 83% 53%)");
  return `color-mix(in srgb, ${base} ${Math.round(opacity * 100)}%, transparent)`;
}

function mutedFgColor() {
  return resolveColor(getCSSVar("--muted-foreground"), "#71717a");
}

function cardBgColor() {
  return resolveColor(getCSSVar("--card"), "#ffffff");
}

// ─── Primitive components ─────────────────────────────────────────────────────

function Card({ className, children }) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground border border-border rounded-2xl shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Badge
 * Accepts either:
 *   badge="+15%"
 *   badge={{ text: "+15%", variant: "positive" | "negative" | "neutral", className: "" }}
 */
function Badge({ value, className: outerClass }) {
  const config =
    typeof value === "object" && value !== null ? value : { text: value };

  const { text = "", variant, className: innerClass } = config;
  const textStr = String(text);

  const resolved =
    variant ??
    (textStr.startsWith("+") ||
    (!isNaN(Number(text)) && Number(text) > 0)
      ? "positive"
      : textStr.startsWith("-")
      ? "negative"
      : "neutral");

  const variantClass = {
    positive: "bg-primary/10 text-primary",
    negative: "bg-destructive/10 text-destructive",
    neutral: "bg-muted text-muted-foreground",
  }[resolved] ?? "bg-primary/10 text-primary";

  const Icon =
    resolved === "positive"
      ? ArrowUp
      : resolved === "negative"
      ? ArrowDown
      : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
        variantClass,
        innerClass,
        outerClass
      )}
    >
      {Icon && <Icon size={10} />}
      {textStr}
    </span>
  );
}

/**
 * Normalise a field that can be a plain string or { text, className }.
 */
function resolveField(field, fallback = "") {
  if (field === null || field === undefined)
    return { text: fallback, className: "" };
  if (typeof field === "object")
    return { text: field.text ?? fallback, className: field.className ?? "" };
  return { text: String(field), className: "" };
}

// ─── Shared Recharts tooltip ──────────────────────────────────────────────────

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

// ─── 1. BarMetricCard ─────────────────────────────────────────────────────────
/**
 * @param {string|{text,className}}          title
 * @param {string|{text,className}}          subtitle
 * @param {string|{text,className}}          value
 * @param {string|{text,variant,className}}  badge
 * @param {Array}                            data       — [{ label, value, highlight? }]
 * @param {Function}                         formatter  — (v: number) => string for tooltip
 */
export function BarMetricCard({
  title = "Revenue Growth",
  subtitle = "Weekly Report",
  value = "$3,234",
  badge = "+15%",
  data = defaultWeeklyBarData,
  formatter,
}) {
  const primary = primaryColor();
  const dimmed = primaryMuted(0.2);
  const tickColor = mutedFgColor();

  const t = resolveField(title, "Revenue Growth");
  const s = resolveField(subtitle, "Weekly Report");
  const v = resolveField(value, "$3,234");

  return (
    <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 shrink-0">
        <div>
          <p className={cn("font-semibold text-foreground", t.className)}>
            {t.text}
          </p>
          <p className={cn("text-sm text-muted-foreground", s.className)}>
            {s.text}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className={cn("text-2xl font-bold text-foreground", v.className)}>
            {v.text}
          </span>
          <Badge value={badge} />
        </div>
      </div>

      {/* FIX: explicit height on wrapper + minWidth:0 prevents -1 measurement */}
      <div className="w-full h-44" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart
            data={data}
            barSize={12}
            /* FIX: left:12 gives first tick label room to render without clipping */
            margin={{ top: 4, right: 4, bottom: 32, left: 12 }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={(props) => (
                <ResponsiveTick {...props} fill={tickColor} maxChars={6} />
              )}
            />
            <Tooltip
              content={<ChartTooltip formatter={formatter} />}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 6, 6]}
              isAnimationActive
              fill={dimmed}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.highlight ? primary : dimmed} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── 2. DonutMetricCard ───────────────────────────────────────────────────────
/**
 * @param {string}   title
 * @param {string}   subtitle
 * @param {string}   trend        — e.g. "+18.2%"
 * @param {string}   centerLabel  — text inside the donut, e.g. "$23K"
 * @param {Array}    segments     — [{ name, value }]
 */
export function DonutMetricCard({
  title = "Generated Leads",
  subtitle = "Weekly Report",
  trend = "+18.2%",
  centerLabel = "$23K",
  segments = defaultDonutSegments,
}) {
  const t = resolveField(title, "Generated Leads");
  const s = resolveField(subtitle, "Weekly Report");
  const cl = resolveField(centerLabel, "$23K");
  const trendBadge = typeof trend === "object" ? trend : { text: trend };
  const primary = primaryColor();
  const seg60 = primaryMuted(0.6);
  const seg20 = primaryMuted(0.2);
  const segColors = [seg60, primary, seg20];
  const cardBg = cardBgColor();

  return (
    <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 shrink-0">
        <div>
          <p className={cn("font-semibold text-foreground", t.className)}>
            {t.text}
          </p>
          <p className={cn("text-sm text-muted-foreground", s.className)}>
            {s.text}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge value={trendBadge} />
        </div>
      </div>

      <div className="w-full flex justify-center">
        {/* FIX: explicit width/height on wrapper so PieChart always has real dimensions */}
        <div
          className="relative"
          style={{ width: 150, height: 150, minWidth: 150 }}
        >
          <PieChart width={150} height={150}>
            <Pie
              data={segments}
              cx={75}
              cy={75}
              innerRadius={50}
              outerRadius={70}
              strokeWidth={0}
              stroke={cardBg}
              dataKey="value"
              isAnimationActive
            >
              {segments.map((_, i) => (
                <Cell key={i} fill={segColors[i % segColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className={cn(
                "text-lg font-semibold text-foreground",
                cl.className
              )}
            >
              {cl.text}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── 3. AreaMetricCard ────────────────────────────────────────────────────────
/**
 * @param {string}   title
 * @param {string}   subtitle
 * @param {Array}    data      — [{ label, value }]
 * @param {Function} formatter — tooltip formatter
 */
export function AreaMetricCard({
  title = "Activity",
  subtitle = "Weekly Report",
  data = defaultWeeklyAreaData,
  formatter,
}) {
  const t = resolveField(title, "Activity");
  const s = resolveField(subtitle, "Weekly Report");

  const primary = primaryColor();
  const tickColor = mutedFgColor();

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className={cn("font-medium text-foreground", t.className)}>
          {t.text}
        </span>
        <span className={cn("text-sm text-muted-foreground", s.className)}>
          {s.text}
        </span>
      </div>

      {/* FIX: explicit height + minWidth:0 so ResponsiveContainer gets real dimensions */}
      <div style={{ width: "100%", height: 144, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <AreaChart
            data={data}
            /* FIX: left:12 prevents first tick label from being clipped */
            margin={{ top: 4, right: 0, bottom: 0, left: 12 }}
          >
            <defs>
              <linearGradient
                id="areaGradientPrimary"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="10%" stopColor={primary} stopOpacity={0.4} />
                <stop offset="90%" stopColor={primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              /* FIX: padding prevents first/last label from being clipped */
              padding={{ left: 8, right: 8 }}
              tick={{ fontSize: 10, fill: tickColor }}
            />
            <Tooltip content={<ChartTooltip formatter={formatter} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={primary}
              strokeWidth={2}
              fill="url(#areaGradientPrimary)"
              dot={false}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── 4. CompactBarMetricCard ──────────────────────────────────────────────────
/**
 * @param {string}   title
 * @param {string}   description
 * @param {string}   badge
 * @param {Array}    data        — [{ label, value }]
 * @param {Function} formatter
 */
export function CompactBarMetricCard({
  title = "2.84k",
  description = "Average Profile Traffic",
  badge = "+15%",
  data = defaultCompactBarData,
  formatter,
}) {
  const t = resolveField(title, "2.84k");
  const d = resolveField(description, "Average Profile Traffic");
  const primary = primaryColor();
  const tickColor = mutedFgColor();

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className={cn("text-2xl font-bold text-foreground", t.className)}>
          {t.text}
        </span>
        <Badge value={badge} />
      </div>
      <p className={cn("text-sm text-muted-foreground -mt-2", d.className)}>
        {d.text}
      </p>

      {/* FIX: explicit height + minWidth:0 */}
      <div style={{ width: "100%", height: 144, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart
            data={data}
            barSize={12}
            /* FIX: left:12 so first tick label isn't clipped */
            margin={{ top: 4, right: 4, bottom: 32, left: 12 }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={(props) => (
                <ResponsiveTick {...props} fill={tickColor} maxChars={6} />
              )}
            />
            <Tooltip
              content={<ChartTooltip formatter={formatter} />}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 6, 6]}
              fill={primary}
              isAnimationActive
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── Default data ─────────────────────────────────────────────────────────────

const defaultWeeklyBarData = [
  { label: "M", value: 50 },
  { label: "T", value: 83 },
  { label: "W", value: 63 },
  { label: "T", value: 97, highlight: true },
  { label: "F", value: 73 },
  { label: "S", value: 117 },
  { label: "S", value: 83 },
];

const defaultDonutSegments = [
  { name: "January", value: 400 },
  { name: "February", value: 300 },
  { name: "March", value: 200 },
];

const defaultWeeklyAreaData = [
  { label: "Mo", value: 64 },
  { label: "Tu", value: 42 },
  { label: "We", value: 66 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 44 },
  { label: "Sa", value: 34 },
  { label: "Su", value: 57 },
];

const defaultCompactBarData = [
  { label: "01", value: 35 },
  { label: "02", value: 59 },
  { label: "03", value: 45 },
  { label: "04", value: 68 },
  { label: "05", value: 52 },
  { label: "06", value: 83 },
  { label: "07", value: 59 },
];

// ─── Demo page ────────────────────────────────────────────────────────────────

export default function MetricCardDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-8">Metric Cards</h1>

      <div className="grid gap-4 xl:grid-cols-2">
        <BarMetricCard />
        <DonutMetricCard />
        <AreaMetricCard />
        <CompactBarMetricCard />
      </div>

      <h2 className="text-xl font-semibold mt-12 mb-4">Custom data example</h2>
      <div className="grid gap-4 xl:grid-cols-2">
        <BarMetricCard
          title="Monthly Sales"
          subtitle="Q1 2025"
          value="$12,400"
          badge="+22%"
          data={[
            { label: "Jan", value: 40 },
            { label: "Feb", value: 75 },
            { label: "Mar", value: 60, highlight: true },
            { label: "Apr", value: 90 },
            { label: "May", value: 55 },
            { label: "Jun", value: 110 },
            { label: "Jul", value: 80 },
          ]}
          formatter={(v) => `$${v}k`}
        />
        <CompactBarMetricCard
          title="9,200"
          description="Daily Active Users"
          badge="+5.4%"
          data={[
            { label: "M", value: 60 },
            { label: "T", value: 80 },
            { label: "W", value: 55 },
            { label: "T", value: 90 },
            { label: "F", value: 70 },
            { label: "S", value: 40 },
            { label: "S", value: 30 },
          ]}
          formatter={(v) => `${v}k users`}
        />
        <DonutMetricCard
          title="Market Share"
          subtitle="2025"
          trend="+3.2%"
          centerLabel="45%"
          segments={[
            { name: "Product A", value: 45 },
            { name: "Product B", value: 30 },
          ]}
        />
      </div>
    </div>
  );
}