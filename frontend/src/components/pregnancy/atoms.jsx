import { Tooltip } from "@mantine/core";
import { RISK_CODES } from "./constants";

export const Pill = ({ children, className = "" }) => (
  <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${className}`}>
    {children}
  </span>
);

export const InfoRow = ({ label, value }) => (
  <div className="flex items-center py-1.5 border-b border-border gap-2">
    <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
    <span className="text-sm font-medium capitalize text-foreground">{value || "—"}</span>
  </div>
);

export const YesNoBadge = ({ value }) => {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>;
  const isYes = value === "YES";
  return (
    <Pill
      className={
        isYes
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      }
    >
      {isYes ? "Yes" : "No"}
    </Pill>
  );
};

export const ChecklistBadges = ({ checklist }) => {
  if (!checklist) return <span className="text-sm text-muted-foreground">—</span>;
  const active = Object.entries(checklist)
    .filter(([, v]) => v)
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
  if (!active.length)
    return (
      <Pill className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">None</Pill>
    );
  return (
    <div className="flex flex-wrap gap-1">
      {active.map((item) => (
        <Pill key={item} className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
          {item}
        </Pill>
      ))}
    </div>
  );
};

export const RiskBadge = ({ code, size = "sm" }) => {
  if (!code) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <Tooltip label={RISK_CODES[code] ?? code} withArrow multiline maw={240}>
      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border border-red-400 text-red-600 dark:border-red-500 dark:text-red-400 cursor-default">
        {size === "sm" ? code : `Risk ${code}`}
      </span>
    </Tooltip>
  );
};