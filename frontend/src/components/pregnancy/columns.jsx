import { useMemo } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconEdit, IconTrash, IconPrinter, IconCircleCheck } from "@tabler/icons-react";
import { Pill } from "./atoms";
import { trimesterTw, statusTw, deliveryTypeTw, TRIMESTER_LABEL, RISK_CODES } from "./constants";
import { IconTrashFilled } from "@tabler/icons-react";

export const visitCount = (visits) => {
  if (!visits) return 0;
  return Object.values(visits).flat().filter((v) => v?.date).length;
};

const initVisit = () => ({
  date: "", weight: "", iron: "", aog: "", tt: "", urinalysis: "", remarks: "",
});

const initPP = () => ({
  date: "", bp: "", fh: "", b: false, bo: false, mix: false,
  vaginal: "", iron: "", observation: "", remarks: "",
});

const normalizeVisits = (arr = []) => {
  const filled = arr.map((v) => ({ ...initVisit(), ...v }));
  while (filled.length < 4) filled.push(initVisit());
  return filled.slice(0, 4);
};

const normalizePP = (arr = []) => {
  const filled = arr.map((r) => ({ ...initPP(), ...r }));
  while (filled.length < 4) filled.push(initPP());
  return filled.slice(0, 4);
};

export function mapRecordToFormData(record) {
  const d = record.details ?? {};
  const info = d.patientInfo ?? {};
  const history = d.preNatalHistory ?? {};
  const compl = history.complications ?? {};
  const fp = d.familyPlanning ?? {};
  const pp = d.presentPregnancy ?? {};
  const delivery = d.delivery ?? {};
  const risk = d.risk ?? {};
  const visits = d.visits ?? {};
  const postPartum = d.postPartum ?? [];

  return {
    familyNumber: info.familyNumber ?? "",
    name: info.name ?? "",
    dateOfBirth: info.dateOfBirth ?? "",
    age: info.age != null ? String(info.age) : "",
    husbandName: info.husbandName ?? "",
    husbandOccupation: info.husbandOccupation ?? "",
    address: info.address ?? "",
    childrenAlive: history.childrenAlive ?? "",
    livingChildren: history.livingChildren ?? "",
    abortions: history.abortions ?? "",
    stillBirths: history.stillBirths ?? "",
    hemorrhage: compl.hemorrhage ?? "",
    toxemia: compl.toxemia ?? "",
    placentaPrevia: compl.placentaPrevia ?? "",
    sepsis: compl.sepsis ?? "",
    otherComplication: compl.other ?? "",
    familyPlanningPracticed: fp.practiced ?? "",
    familyPlanningMethod: fp.method ?? "",
    willingToPractice: fp.willingToPractice ?? "",
    familyHistoryYes: fp.familyHistoryYes ?? "",
    familyHistorySpecify: fp.familyHistorySpecify ?? "",
    gravidaChecked: pp.gravida != null,
    gravida: pp.gravida != null ? String(pp.gravida) : "",
    paraChecked: pp.para != null,
    para: pp.para != null ? String(pp.para) : "",
    lastMenstruation: pp.lastMenstruation ?? "",
    expectedConfinement: pp.expectedConfinement ?? "",
    specialCases: pp.specialCases ?? "",
    checklist: {
      nausea: pp.checklist?.nausea ?? false,
      dizziness: pp.checklist?.dizziness ?? false,
      constipation: pp.checklist?.constipation ?? false,
      cramps: pp.checklist?.cramps ?? false,
      pruritus: pp.checklist?.pruritus ?? false,
      leukorrhea: pp.checklist?.leukorrhea ?? false,
      headache: pp.checklist?.headache ?? false,
      bleeding: pp.checklist?.bleeding ?? false,
      edema: pp.checklist?.edema ?? false,
      vomiting: pp.checklist?.vomiting ?? false,
      blurring: pp.checklist?.blurring ?? false,
    },
    riskCode: risk.code ?? "",
    riskDate: risk.date ?? "",
    deliveryDate: delivery.date ?? "",
    childName: delivery.childName ?? "",
    sex: delivery.sex ?? "",
    weight: delivery.weight ?? "",
    place: delivery.place ?? "",
    attendedBy: delivery.attendedBy ?? "",
    deliveryType: delivery.deliveryType ?? "Normal",
    abnormalSpec: delivery.abnormalSpec ?? "",
    abnormality: delivery.abnormality ?? "",
    newBornScreening: delivery.newBornScreening ?? "",
    visits: {
      "1st": normalizeVisits(visits["1st"]),
      "2nd": normalizeVisits(visits["2nd"]),
      "3rd": normalizeVisits(visits["3rd"]),
    },
    postPartum: normalizePP(postPartum),
  };
}

export const useColumns = (
  data,
  openEditDialog,
  handleDeleteClick,
  openPrintView,
  handleDeliveredClick,   // ← new
) =>
  useMemo(
    () => [
      {
        header: "Patient Name",
        accessorFn: (row) => row.resident?.full_name ?? "",
        Cell: ({ cell }) => (
          <span className="text-sm font-medium capitalize text-foreground">
            {cell.getValue() || "—"}
          </span>
        ),
      },
      {
        header: "Trimester",
        accessorKey: "current_trimester",
        size: 130,
        Cell: ({ cell }) => (
          <Pill className={trimesterTw(cell.getValue())}>
            {TRIMESTER_LABEL(cell.getValue())}
          </Pill>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 110,
        Cell: ({ cell }) => {
          const val = cell.getValue();
          return <Pill className={`capitalize ${statusTw(val)}`}>{val || "—"}</Pill>;
        },
      },
      {
        header: "Risk Code",
        accessorFn: (row) => row.details?.risk?.code ?? "",
        size: 100,
        Cell: ({ cell }) => {
          const code = cell.getValue();
          if (!code) return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <Tooltip label={RISK_CODES[code] ?? code} withArrow multiline maw={240}>
              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border border-red-400 text-red-600 dark:border-red-500 dark:text-red-400 cursor-default">
                {code}
              </span>
            </Tooltip>
          );
        },
      },
      {
        header: "Gravida / Para",
        accessorFn: (row) => {
          const pp = row.details?.presentPregnancy ?? {};
          const g = pp.gravida != null ? "Gravida" : null;
          const p = pp.para != null ? "Para" : null;
          return [g, p].filter(Boolean).join(" / ") || "—";
        },
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm font-mono text-foreground">{cell.getValue()}</span>
        ),
      },
      {
        header: "Expected Delivery",
        accessorKey: "expected_delivery_date",
        size: 140,
        Cell: ({ cell }) =>
          cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : "—",
      },
      {
        header: "Last Menstruation",
        accessorKey: "pregnancy_start_date",
        size: 130,
        Cell: ({ cell }) =>
          cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : "—",
      },
      {
        header: "Delivery Type",
        accessorFn: (row) => row.details?.delivery?.deliveryType ?? "",
        size: 120,
        Cell: ({ cell }) => {
          const val = cell.getValue();
          if (!val) return <span className="text-sm text-muted-foreground">—</span>;
          return <Pill className={deliveryTypeTw(val)}>{val}</Pill>;
        },
      },
      {
        header: "Actions",
        id: "actions",
        size: 160,                          // wider to fit 4 buttons
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const isDelivered = row.original.status === "delivered";
          return (
            <div className="flex items-center gap-1.5 flex-nowrap">
              <Tooltip label="Edit" withArrow position="top">
                <ActionIcon
           
                  color="blue"
      
                  onClick={(e) => { e.stopPropagation(); openEditDialog(row.original); }}
                >
                  <IconEdit  />
                </ActionIcon>
              </Tooltip>

              {/* ── Mark as Delivered ── */}
              <Tooltip
                label={isDelivered ? "Already delivered" : "Mark as Delivered"}
                withArrow
                position="top"
              >
                <ActionIcon
           
                  color="green"
        
                  disabled={isDelivered}
                  onClick={(e) => { e.stopPropagation(); handleDeliveredClick(row.original); }}
                >
                  <IconCircleCheck />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Print" withArrow position="top">
                <ActionIcon
                
                  color="dark"
                  
                  onClick={(e) => { e.stopPropagation(); openPrintView(row.original); }}
                >
                  <IconPrinter  />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Delete" withArrow position="top">
                <ActionIcon
               
                  color="red"
             
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.original); }}
                >
                  <IconTrashFilled  />
                </ActionIcon>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [data]
  );