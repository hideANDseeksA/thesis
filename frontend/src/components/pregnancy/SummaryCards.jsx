import { VisitTableHeader, VisitTableBody, PatientCell, RiskCell } from "./VisitTable";

const SummaryCard = ({ title, heroValue, heroColor, subtitle, children }) => (
  <div className="bg-card text-card-foreground border border-border rounded-xl p-4 flex flex-col gap-1 h-full">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
    <p className={`text-2xl font-medium ${
      heroColor === "red"   ? "text-red-600 dark:text-red-400"
      : heroColor === "teal" ? "text-teal-600 dark:text-teal-400"
      : "text-foreground"
    }`}>
      {heroValue}
    </p>
    {subtitle && <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>}
    {children}
  </div>
);

const MiniRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium text-foreground">{value}</span>
  </div>
);

const VISIT_COLS = ["42%", "26%", "32%"];

export const PrenatalSummaryCards = ({
  totalRecords,
  monthlyData,
  totalMissed,
  patientsWithMissed,
  totalIncoming,
  overdueRows,
  incomingRows,
}) => (
  // On mobile: single column stack. sm: two columns. lg: four columns (original layout).
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

    {/* Monthly — spans full width on mobile/sm, 2 cols on lg */}
    <div className="col-span-1 sm:col-span-2">
      <SummaryCard
        title="Monthly pregnancies recorded"
        heroValue={totalRecords}
        subtitle="Total records across all months"
      >
        <div className="mt-1 grid grid-cols-2 gap-x-6">
          {Object.keys(monthlyData).length === 0 ? (
            <p className="col-span-2 text-xs text-muted-foreground">No data yet</p>
          ) : (
            Object.entries(monthlyData).map(([month, count]) => (
              <MiniRow key={month} label={month} value={count} />
            ))
          )}
        </div>
      </SummaryCard>
    </div>

    {/* Overdue — full width on mobile, 1 col on sm+, 1 col on lg */}
    <div className="col-span-1">
      <SummaryCard
        title="Overdue pre-natal visits"
        heroValue={totalMissed}
        heroColor={totalMissed > 0 ? "red" : "teal"}
        subtitle={
          totalMissed > 0
            ? `${patientsWithMissed} patient${patientsWithMissed !== 1 ? "s" : ""} with missed visits`
            : "All patients are on track"
        }
      >
        <div className="mt-1.5 border border-border rounded-lg overflow-hidden">
          <VisitTableHeader cols={VISIT_COLS} />
          <VisitTableBody
            rows={overdueRows}
            emptyText="No overdue visits"
            hoverClass="hover:bg-red-50 dark:hover:bg-red-950/20"
            cols={VISIT_COLS}
            renderRow={(r) => (
              <>
                <PatientCell
                  r={r}
                  dayValue={r.most_overdue_days != null ? `${r.most_overdue_days}d` : "—"}
                  dayColor="red"
                />
                <RiskCell r={r} badgeColor="red" />
              </>
            )}
          />
        </div>
      </SummaryCard>
    </div>

    {/* Incoming — full width on mobile, 1 col on sm+, 1 col on lg */}
    <div className="col-span-1">
      <SummaryCard
        title="Incoming pre-natal visits"
        heroValue={totalIncoming}
        heroColor={totalIncoming > 0 ? "teal" : undefined}
        subtitle={
          totalIncoming > 0
            ? `${incomingRows.length} patient${incomingRows.length !== 1 ? "s" : ""} with upcoming visits`
            : "No upcoming visits scheduled"
        }
      >
        <div className="mt-1.5 border border-border rounded-lg overflow-hidden">
          <VisitTableHeader cols={VISIT_COLS} dayLabel="In (days)" />
          <VisitTableBody
            rows={incomingRows}
            emptyText="No upcoming visits"
            hoverClass="hover:bg-teal-50 dark:hover:bg-teal-950/20"
            cols={VISIT_COLS}
            renderRow={(r) => (
              <>
                <PatientCell
                  r={r}
                  dayValue={r.next_incoming_days != null ? `${r.next_incoming_days}d` : "—"}
                  dayColor="teal"
                />
                <RiskCell r={r} badgeColor="orange" />
              </>
            )}
          />
        </div>
      </SummaryCard>
    </div>

  </div>
);