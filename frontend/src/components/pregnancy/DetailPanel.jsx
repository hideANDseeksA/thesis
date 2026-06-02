import {
  Avatar, Button, Tooltip, ThemeIcon, Timeline, Text, Accordion,
} from "@mantine/core";
import {
  IconUser, IconNotes, IconBabyCarriage, IconCalendar,
  IconMedicalCross, IconShieldCheck, IconAlertTriangle,
  IconCircleCheck, IconActivity, IconEdit,
} from "@tabler/icons-react";
import { Pill, InfoRow, YesNoBadge, ChecklistBadges } from "./atoms";
import { VisitTimeline, PostPartumRows } from "./VisitComponents";
import {
  RISK_CODES, TRIMESTER_COLOR, TRIMESTER_LABEL,
  trimesterTw, statusTw, deliveryTypeTw,
} from "./constants";
import { visitCount } from "./columns";

export const DetailPanel = ({ row, onEdit }) => {
  const r = row.original;
  const d = r.details ?? {};
  const info = d.patientInfo ?? {};
  const history = d.preNatalHistory ?? {};
  const fp = d.familyPlanning ?? {};
  const pp = d.presentPregnancy ?? {};
  const delivery = d.delivery ?? {};
  const risk = d.risk ?? {};
  const visits = d.visits ?? {};
  const postPartum = d.postPartum ?? [];
  const totalVisits = visitCount(visits);

  const initials = (r.resident?.full_name || "?")
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const visitsByTrimester = {
    "1st": (visits?.["1st"] ?? []).filter((v) => v?.date).length,
    "2nd": (visits?.["2nd"] ?? []).filter((v) => v?.date).length,
    "3rd": (visits?.["3rd"] ?? []).filter((v) => v?.date).length,
  };

  return (
    <div className="p-4 rounded-xl">
      {/* Hero header */}
      <div className="bg-card border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Avatar radius="xl" size="lg" color={TRIMESTER_COLOR(r.current_trimester)} variant="filled">
              {initials}
            </Avatar>
            <div>
              <p className="text-xl font-bold capitalize text-foreground leading-tight">
                {r.resident?.full_name || "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Family No: <strong>{r.health_record?.fam_no || "—"}</strong>
                &nbsp;·&nbsp; Age: <strong>{info.age ? `${info.age} yrs` : "—"}</strong>
                &nbsp;·&nbsp; Recorded:{" "}
                <strong>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Pill className={trimesterTw(r.current_trimester)}>
              {TRIMESTER_LABEL(r.current_trimester)}
            </Pill>
            <Pill className={`capitalize ${statusTw(r.status)}`}>
              {r.status || "—"}
            </Pill>
            {risk.code && (
              <Tooltip label={RISK_CODES[risk.code] ?? risk.code} withArrow multiline maw={220}>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-red-400 text-red-600 dark:border-red-500 dark:text-red-400 cursor-default">
                  <IconAlertTriangle size={10} />
                  Risk: {risk.code}
                </span>
              </Tooltip>
            )}
            <Button
              size="xs" variant="light" color="blue" radius="xl"
              leftSection={<IconEdit size={13} />}
              onClick={() => onEdit(r)}
            >
              Edit Record
            </Button>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: "Gravida",          value: pp.gravida != null ? "Yes" : "—", accent: "border-t-blue-500",   text: "text-blue-600 dark:text-blue-400" },
            { label: "Para",             value: pp.para != null ? "Yes" : "—",    accent: "border-t-violet-500", text: "text-violet-600 dark:text-violet-400" },
            { label: "Total Visits",     value: totalVisits,                       accent: "border-t-teal-500",   text: "text-teal-600 dark:text-teal-400" },
            {
              label: "Expected Delivery",
              value: r.expected_delivery_date
                ? new Date(r.expected_delivery_date).toLocaleDateString() : "—",
              accent: "border-t-pink-500",
              text: "text-pink-600 dark:text-pink-400",
            },
          ].map(({ label, value, accent, text }) => (
            <div key={label} className={`bg-muted rounded-md p-3 border-t-2 ${accent}`}>
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-base font-bold ${text}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion */}
      <Accordion
        multiple
        defaultValue={["patient", "history", "pregnancy", "visits", "postpartum"]}
        variant="separated"
        radius="md"
        styles={{
          item:    { border: "1px solid #e9ecef", marginBottom: 8 },
          control: { padding: "10px 16px" },
          content: { padding: "0 16px 16px" },
          label:   { fontWeight: 600, fontSize: 13 },
        }}
      >
        {/* Patient Info */}
        <Accordion.Item value="patient">
          <Accordion.Control icon={<ThemeIcon size="sm" color="blue" variant="light" radius="sm"><IconUser size={13} /></ThemeIcon>}>
            Patient Information
          </Accordion.Control>
          <Accordion.Panel>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Personal Details</p>
                <InfoRow label="Full Name"    value={r.resident?.full_name} />
                <InfoRow label="Date of Birth" value={r.resident?.b_date ? new Date(r.resident.b_date).toLocaleDateString() : null} />
                <InfoRow label="Age"          value={info.age ? `${info.age} years` : null} />
                <InfoRow label="Address"      value={info.address} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Household</p>
                <InfoRow label="Husband's Name"       value={info.husbandName} />
                <InfoRow label="Husband's Occupation" value={info.husbandOccupation} />
                <InfoRow label="LMP / Start Date"     value={r.pregnancy_start_date ? new Date(r.pregnancy_start_date).toLocaleDateString() : null} />
                <InfoRow label="Last Checkup"         value={r.last_checkup ? new Date(r.last_checkup).toLocaleDateString() : null} />
              </div>
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Medical History */}
        <Accordion.Item value="history">
          <Accordion.Control icon={<ThemeIcon size="sm" color="grape" variant="light" radius="sm"><IconNotes size={13} /></ThemeIcon>}>
            Medical & Family History
          </Accordion.Control>
          <Accordion.Panel>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pre-Natal History</p>
                <InfoRow label="Children Born Alive" value={history.childrenAlive} />
                <InfoRow label="Living Children"     value={history.livingChildren} />
                <InfoRow label="Abortions"           value={history.abortions} />
                <InfoRow label="Still Births"        value={history.stillBirths} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Previous Complications</p>
                {[
                  ["Hemorrhage",     history.complications?.hemorrhage],
                  ["Toxemia",        history.complications?.toxemia],
                  ["Placenta Previa",history.complications?.placentaPrevia],
                  ["Sepsis",         history.complications?.sepsis],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center py-1.5 border-b border-border">
                    <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
                    <YesNoBadge value={val} />
                  </div>
                ))}
                {history.complications?.other && (
                  <InfoRow label="Other" value={history.complications.other} />
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Family Planning</p>
                <div className="flex items-center py-1.5 border-b border-border">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Practiced</span>
                  <YesNoBadge value={fp.practiced} />
                </div>
                <InfoRow label="Method" value={fp.method} />
                <div className="flex items-center py-1.5 border-b border-border">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Willing to Practice</span>
                  <YesNoBadge value={fp.willingToPractice} />
                </div>
                <InfoRow label="Family History" value={fp.familyHistorySpecify} />
              </div>
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Present Pregnancy, Risk & Delivery */}
        <Accordion.Item value="pregnancy">
          <Accordion.Control icon={<ThemeIcon size="sm" color="pink" variant="light" radius="sm"><IconBabyCarriage size={13} /></ThemeIcon>}>
            Present Pregnancy, Risk & Delivery
          </Accordion.Control>
          <Accordion.Panel>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Present Pregnancy</p>
                <InfoRow label="Gravida"             value={pp.gravida != null ? String(pp.gravida) : null} />
                <InfoRow label="Para"                value={pp.para != null ? String(pp.para) : null} />
                <InfoRow label="Last Menstruation"   value={pp.lastMenstruation} />
                <InfoRow label="Expected Confinement" value={pp.expectedConfinement} />
                <div className="flex items-center py-1.5 border-b border-border">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Special Cases</span>
                  <YesNoBadge value={pp.specialCases} />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1.5">Checklist</p>
                  <ChecklistBadges checklist={pp.checklist} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Risk Assessment</p>
                {risk.code ? (
                  <div className="p-3 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
                    <div className="flex items-center gap-2 mb-2">
                      <IconAlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">Risk Code {risk.code}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{RISK_CODES[risk.code] ?? risk.code}</p>
                    {risk.date && <p className="text-xs text-muted-foreground mt-2">Detected: {risk.date}</p>}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2">
                      <IconCircleCheck size={16} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">No risk code assigned</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Delivery</p>
                {delivery.date ? (
                  <div className="p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className={deliveryTypeTw(delivery.deliveryType)}>
                        {delivery.deliveryType || "Normal"}
                      </Pill>
                      <span className="text-xs text-muted-foreground">{delivery.date}</span>
                    </div>
                    <InfoRow label="Child's Name"     value={delivery.childName} />
                    <InfoRow label="Sex"              value={delivery.sex} />
                    <InfoRow label="Birth Weight"     value={delivery.weight ? `${delivery.weight} kg` : null} />
                    <InfoRow label="Place"            value={delivery.place} />
                    <InfoRow label="Attended By"      value={delivery.attendedBy} />
                    <InfoRow label="Newborn Screening" value={delivery.newBornScreening} />
                    {delivery.deliveryType === "Abnormal" && (
                      <InfoRow label="Abnormality" value={delivery.abnormalSpec || delivery.abnormality} />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No delivery recorded yet</p>
                )}
              </div>
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Pre-natal Visits */}
        <Accordion.Item value="visits">
          <Accordion.Control icon={<ThemeIcon size="sm" color="teal" variant="light" radius="sm"><IconCalendar size={13} /></ThemeIcon>}>
            Pre-Natal Visits ({totalVisits} recorded)
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-wrap gap-2 mb-4">
              {["1st", "2nd", "3rd"].map((tr, i) => {
                const count = visitsByTrimester[tr];
                const colors = [
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
                  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
                ];
                return (
                  <Pill key={tr} className={colors[i]}>
                    {tr} Trimester: {count} visit{count !== 1 ? "s" : ""}
                  </Pill>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-8">
              {["1st", "2nd", "3rd"].map((tr, i) => {
                const colors = [
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
                  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
                ];
                return (
                  <div key={tr}>
                    <div className="flex items-center gap-2 mb-3">
                      <Pill className={colors[i]}>{tr}</Pill>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Trimester Visits
                      </p>
                    </div>
                    <VisitTimeline visits={visits} trimester={tr} />
                  </div>
                );
              })}
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Post Partum */}
        <Accordion.Item value="postpartum">
          <Accordion.Control icon={<ThemeIcon size="sm" color="orange" variant="light" radius="sm"><IconMedicalCross size={13} /></ThemeIcon>}>
            Post Partum Follow-Up
          </Accordion.Control>
          <Accordion.Panel>
            <PostPartumRows postPartum={postPartum} />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* Risk code reference */}
      <div className="rounded-lg border border-border p-4 mt-3">
        <div className="flex items-center gap-2 mb-3">
          <ThemeIcon size="sm" color="red" variant="light" radius="sm">
            <IconShieldCheck size={13} />
          </ThemeIcon>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Risk Code Reference
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(RISK_CODES).map(([code, desc]) => (
            <div key={code} className="flex items-start gap-2 py-1">
              <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded-full border border-red-400 text-red-600 dark:border-red-500 dark:text-red-400 shrink-0 mt-0.5">
                {code}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};