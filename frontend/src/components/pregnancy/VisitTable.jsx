import { Tooltip } from "@mantine/core";
import { RISK_CODES } from "./constants";

export const VisitTableHeader = ({ cols, dayLabel = "Days" }) => (
  <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
    <colgroup>
      {cols.map((w, i) => <col key={i} style={{ width: w }} />)}
    </colgroup>
    <thead>
      <tr className="bg-muted">
        {["Patient", dayLabel, "Risk"].map((h) => (
          <th
            key={h}
            className="text-left px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider
                       text-muted-foreground border-b border-border whitespace-nowrap"
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
  </table>
);

export const VisitTableBody = ({ rows, emptyText, hoverClass, cols, renderRow }) => (
  <div className="max-h-48 overflow-y-auto">
    <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
      <colgroup>
        {cols.map((w, i) => <col key={i} style={{ width: w }} />)}
      </colgroup>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center py-5 text-[11px] text-muted-foreground">
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((r, idx) => (
            <tr
              key={r.id ?? idx}
              className={`border-b border-border last:border-0 transition-colors ${hoverClass}`}
            >
              {renderRow(r)}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export const PatientCell = ({ r, dayValue, dayColor }) => {
  const visitDate = r.missed_visits?.[0]?.date ?? r.incoming_visits?.[0]?.date;
  return (
    <>
      <td className="px-2 py-1.5 align-middle">
        <p className="text-xs font-medium capitalize text-foreground truncate">
          {r.resident?.full_name || "—"}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {visitDate
            ? new Date(visitDate).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })
            : "—"}
        </p>
      </td>
      <td className="px-2 py-1.5 align-middle">
        <span className={`text-xs font-semibold ${
          dayColor === "red"
            ? "text-red-600 dark:text-red-400"
            : "text-teal-600 dark:text-teal-400"
        }`}>
          {dayValue}
        </span>
      </td>
    </>
  );
};

export const RiskCell = ({ r, badgeColor }) => (
  <td className="px-2 py-1.5 align-middle">
    {r.risk?.code ? (
      <Tooltip label={RISK_CODES[r.risk.code] ?? r.risk.code} withArrow multiline maw={200}>
        <span className={`inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded-full border cursor-default
          ${badgeColor === "red"
            ? "border-red-400 text-red-600 dark:border-red-500 dark:text-red-400"
            : "border-orange-400 text-orange-600 dark:border-orange-500 dark:text-orange-400"
          }`}
        >
          Risk {r.risk.code}
        </span>
      </Tooltip>
    ) : (
      <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
        None
      </span>
    )}
  </td>
);