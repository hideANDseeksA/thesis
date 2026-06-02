import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReusableMantineTable from "./../ReusableTable";
import {
  ActionIcon,
  Flex,
  TextInput,
  Box,
  Text,
  Divider,
  Badge,
  Group,
  SimpleGrid,
  Button,
  Tooltip,
} from "@mantine/core";
import { IconRefresh, IconEdit, IconTrash, IconPlus, IconHeartPlus, IconTrashFilled, IconBabyCarriage } from "@tabler/icons-react";
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import { Search } from "lucide-react";
import { capitalizeWords } from "@/lib/capitalizer";
import { AreaMetricCard } from "@/components/StatCard";
import { showDeleteConfirmation } from "@/utils/dialog";
import { getHealthRecords, deleteHealthRecord } from "@/api/health";
import { toastDelete } from "@/utils/toast";
import { IconHeartExclamation } from "@tabler/icons-react";

/* ─── BMI helpers ──────────────────────────────────────────────────── */
const BMI_COLOR = (bmi) => {
  if (!bmi) return "gray";
  if (bmi < 18.5) return "blue";
  if (bmi < 25)   return "green";
  if (bmi < 30)   return "orange";
  return "red";
};
const BMI_LABEL = (bmi) => {
  if (!bmi)       return "Unknown";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25)   return "Normal";
  if (bmi < 30)   return "Overweight";
  return "Obese";
};

/* ─── Parse details safely (stored as JSON string in DB) ───────────── */
function parseDetails(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

/* ─── UI helpers ───────────────────────────────────────────────────── */
const Field = ({ label, value }) => (
  <Flex py={6} style={{ borderBottom: "1px solid #f1f3f5" }}>
    <Text size="sm" c="dimmed" style={{ width: 150, flexShrink: 0 }}>{label}</Text>
    <Text size="sm" fw={500} tt="capitalize">{value || "—"}</Text>
  </Flex>
);
const Section = ({ title }) => (
  <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4} mt={2}>{title}</Text>
);

/* ─── Address / name builders ──────────────────────────────────────── */
const buildAddress = (resident) => {
  if (!resident) return "";
  const parts = [resident.house_no, resident.purok?.name].filter(Boolean);
  return capitalizeWords(parts.join(", "));
};
const buildFullName = (resident) => {
  if (!resident) return "";
  return [
    capitalizeWords(resident.f_name ?? ""),
    capitalizeWords(resident.m_name ?? ""),
    capitalizeWords(resident.l_name ?? ""),
    resident.s_name ? capitalizeWords(resident.s_name) : "",
  ].filter(Boolean).join(" ").trim();
};

/* ─── Main component ───────────────────────────────────────────────── */
const HealthRecordsTable = () => {
  const navigate = useNavigate();

  const [data,          setData]          = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searchValue,   setSearchValue]   = useState("");
  const [columnFilters, setColumnFilters] = useState([]);   // ← controlled filter state

  const INPUT_HEIGHT = 36;

  /* ── Fetch ── */
  const fetchHealthRecords = async () => {
    setLoading(true);
    try {
      const records = await getHealthRecords();
      setData(Array.isArray(records) ? records : records.health_records ?? []);
    } catch (err) {
      console.error("Failed to load health records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealthRecords(); }, []);

  /* ── Action handlers ── */
  const handleEditClick = (row) => {
    navigate(`/health-records-form/${row.id}?mode=edit`);
  };

  const handleDeleteClick = async (row) => {
    const confirmed = await showDeleteConfirmation({
      title: "Delete Health Record",
      text: "Are you sure you want to delete this record? This action cannot be undone.",
    });
    if (!confirmed) return;

    try {
      await deleteHealthRecord(row.id);
      toastDelete(
        "Health Record deleted successfully.",
        "The health record was permanently removed."
      );
      fetchHealthRecords();
    } catch (err) {
      console.error("Failed to delete health record", err);
    }
  };

  /* ── Derived stats ── */
  const monthlyNormalCount = useMemo(() => {
    const counts = {};
    data.forEach((r) => {
      const date = new Date(r.created_at);
      if (isNaN(date)) return;
      const month = date.toLocaleString("default", { month: "long" });
      if (BMI_LABEL(r.bmi) === "Normal") counts[month] = (counts[month] || 0) + 1;
    });
    return counts;
  }, [data]);

  const totalRecords   = data.length;
  const normalBmiCount = data.filter((r) => BMI_LABEL(r.bmi) === "Normal").length;

  /* ── Columns ── */
  const columns = useMemo(() => [
    {
      id: "name",
      header: "Name",
      accessorFn: (row) => buildFullName(row.resident),
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      id: "resident_id",
      header: "Resident ID",
      accessorFn: (row) => row.resident?.resident_id ?? row.resident_id,
      size: 130,
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => (
        <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
          {cell.getValue() ?? "—"}
        </Text>
      ),
    },
    {
      id: "blood_type",
      header: "Blood Type",
      accessorFn: (row) => row.resident?.blood_type ?? "",
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => (
        <Badge variant="outline" color="red" radius="sm" size="sm" tt="uppercase">
          {cell.getValue() || "—"}
        </Badge>
      ),
      size: 100,
    },
    {
      header: "BMI",
      accessorKey: "bmi",
      size: 130,
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => {
        const bmi = parseFloat(cell.getValue());
        return (
          <Badge color={BMI_COLOR(bmi)} variant="light" radius="sm" tt="capitalize">
            {isNaN(bmi) ? "—" : `${bmi.toFixed(1)} · ${BMI_LABEL(bmi)}`}
          </Badge>
        );
      },
    },
    {
      id: "address",
      header: "Address",
      accessorFn: (row) => buildAddress(row.resident),
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => cell.getValue() || "—",
      size: 150,
    },
    {
      id: "philhealth",
      header: "PhilHealth",
      accessorFn: (row) => {
        const d = parseDetails(row.details);
        return d.philHealth?.member === "yes" ? "Member" : "Non-member";
      },
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => (
        <Badge color={cell.getValue() === "Member" ? "teal" : "gray"} variant="light" radius="sm">
          {cell.getValue()}
        </Badge>
      ),
      size: 120,
    },
    {
      id: "fourps",
      header: "4Ps",
      accessorFn: (row) => {
        const d = parseDetails(row.details);
        return d.fourPs ?? "";
      },
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => (
        <Badge
          color={cell.getValue()?.toLowerCase() === "yes" ? "indigo" : "gray"}
          variant="light" radius="sm" tt="capitalize"
        >
          {cell.getValue() || "—"}
        </Badge>
      ),
      size: 80,
    },
    {
      header: "Recorded At",
      accessorKey: "created_at",
      enableColumnFilter: false,
      Cell: ({ cell }) => cell.getValue() ? new Date(cell.getValue()).toLocaleString() : "—",
      size: 170,
    },
    {
      header: "Actions",
      id: "actions",
      size: 130,
      enableSorting: false,
      enableColumnFilter: false,
      Cell: ({ row }) => (
        <Group gap={4} wrap="nowrap">
          {row.original.resident?.sex === "female" && (
            <Tooltip label="Add Prenatal Record" withArrow position="top">
              <ActionIcon
                
                color="pink"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/pregnancy-form/${row.original.id}?mode=add`);
                }}
              >
                <IconBabyCarriage  />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip label="Edit" withArrow position="top">
            <ActionIcon  color="blue"
              onClick={(e) => { e.stopPropagation(); handleEditClick(row.original); }}>
              <IconEdit />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Delete" withArrow position="top">
            <ActionIcon  color="red"
              onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.original); }}>
              <IconTrashFilled  />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ], [data]);

  return (
    <>
      {/* ── Stat Cards ── */}
      <div className="grid gap-3 mb-4 grid-cols-2 xl:grid-cols-2">
        <AreaMetricCard
          title="Normal BMI Records"
          subtitle="Monthly count of residents with normal BMI range this year."
          value={normalBmiCount}
          data={Object.entries(monthlyNormalCount).map(([k, v]) => ({
            label: k === "null" ? "Unknown" : String(k).charAt(0).toUpperCase() + String(k).slice(1),
            value: Number(v) || 0,
            highlight: false,
          }))}
          formatter={(v) => `${v}`}
        />
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:col-span-1">
          <AreaMetricCard
            title="Total Health Records"
            subtitle="Total number of health records on file."
            value={totalRecords}
            data={[{ label: "Total", value: totalRecords, highlight: false }]}
            formatter={(v) => `${v}`}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableStickyHeader: true,
          enableTopToolbar: true,
          enablePagination: true,
          enableExpanding: true,
          enableColumnFilters: true,       // ← enable column filters
          enableGlobalFilter: false,       // ← off; search bar uses setGlobalFilter manually
          manualFiltering: false,          // ← filter local data, not server
          mantineTableContainerProps: {
            style: { maxHeight: "calc(100vh - 320px)", overflowY: "auto" },
          },
          initialState: {
            columnFilters: [],
          },
          state: {
            isLoading: loading,
            columnFilters,                 // ← pass controlled filter state
          },
          onColumnFiltersChange: (updater) => {
            const next =
              typeof updater === "function" ? updater(columnFilters) : updater;
            setColumnFilters(next);
          },

          renderDetailPanel: ({ row }) => {
            const r        = row.original;
            const d        = parseDetails(r.details);
            const res      = r.resident ?? {};
            const bmi      = parseFloat(r.bmi);
            const fullName = buildFullName(res);
            const address  = buildAddress(res);

            return (
              <Box p="lg">
                <Flex align="center" justify="space-between" mb="md" pb="sm"
                  style={{ borderBottom: "2px solid #e9ecef" }}>
                  <Box>
                    <Text size="lg" fw={700}>{fullName || "—"}</Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      Resident ID: {res.resident_id ?? "—"} &nbsp;·&nbsp; Recorded:{" "}
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                    </Text>
                  </Box>
                  <Badge color={BMI_COLOR(bmi)} variant="light" size="md" radius="sm">
                    BMI {isNaN(bmi) ? "—" : bmi.toFixed(1)} · {BMI_LABEL(bmi)}
                  </Badge>
                </Flex>

                <SimpleGrid cols={3} spacing="xl">
                  <Box>
                    <Section title="Personal Information" />
                    <Field label="Full Name"     value={fullName} />
                    <Field label="Sex"           value={res.sex} />
                    <Field label="Civil Status"  value={res.civil_status} />
                    <Field label="Birth Date"    value={res.b_date ? new Date(res.b_date).toLocaleDateString() : null} />
                    <Field label="Birth Place"   value={res.b_place} />
                    <Field label="Address"       value={address} />
                    <Field label="Blood Type"    value={res.blood_type?.toUpperCase()} />
                    <Field label="Mother's Name" value={d.motherName} />
                    {d.spouseName && <Field label="Spouse Name" value={d.spouseName} />}
                  </Box>

                  <Box>
                    <Section title="Health Metrics" />
                    <Field label="Weight" value={r.weight ? `${r.weight} kg` : null} />
                    <Field label="Height" value={r.height ? `${r.height} cm` : null} />
                    <Field label="BMI"    value={!isNaN(bmi) ? `${bmi.toFixed(2)} (${BMI_LABEL(bmi)})` : null} />
                    <Divider my="sm" />
                    <Section title="Background" />
                    <Field label="Education"       value={res.education} />
                    <Field label="Employment"      value={res.emp_status} />
                    <Field label="Family Position" value={d.familyPosition} />
                    <Field label="Family No."      value={d.familyNo} />
                  </Box>

                  <Box>
                    <Section title="Benefits & Membership" />
                    <Field label="4Ps Member" value={d.fourPs} />
                    <Field label="PCB Member" value={d.pcbMember} />
                    <Divider my="sm" />
                    <Section title="PhilHealth" />
                    <Field label="Member" value={d.philHealth?.member} />
                    {d.philHealth?.member === "yes" && (
                      <>
                        <Field label="Status"          value={d.philHealth?.status} />
                        <Field label="No."             value={d.philHealth?.no} />
                        <Field label="Employment Type" value={d.philHealth?.employmentType} />
                      </>
                    )}
                  </Box>
                </SimpleGrid>
              </Box>
            );
          },
        }}
        renderToolbar={({ table }) => (
          <Flex p="md" justify="space-between">
            <Flex gap="xs" align="center">
              <Flex
                align="center"
                style={{ border: "1px solid #ced4da", borderRadius: 4, overflow: "hidden" }}
              >
                <ActionIcon
                  variant="subtle"
                  style={{
                    height: INPUT_HEIGHT,
                    width: INPUT_HEIGHT,
                    borderRight: "1px solid #ced4da",
                    borderRadius: 0,
                  }}
                >
                  <Search size={16} />
                </ActionIcon>
                <TextInput
                  placeholder="Search health records..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    table.setGlobalFilter(e.target.value);
                  }}
                  styles={{ input: { height: INPUT_HEIGHT, border: "none", borderRadius: 0 } }}
                  style={{ width: 260 }}
                />
              </Flex>

              <ActionIcon
                variant="outline"
                onClick={fetchHealthRecords}
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
              >
                <IconRefresh size={16} />
              </ActionIcon>

              <MRT_ToggleFiltersButton table={table} />
              <MRT_ShowHideColumnsButton table={table} />
            </Flex>

            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate("/resident-list/")}
              style={{ height: INPUT_HEIGHT }}
            >
              Add Record
            </Button>
          </Flex>
        )}
      />
    </>
  );
};

export default HealthRecordsTable;