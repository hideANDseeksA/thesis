import { useEffect, useMemo, useState } from 'react'
import { getResidents } from './api/resident.api';
import ReusableMantineTable from '@/components/ReusableTable'
import {
  ActionIcon,
  Group,
  Button,
  Flex,
  TextInput,
  Select,
  Modal,
  Stack,
  Text,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconEdit,
  IconTrashFilled,
  IconPlus,
  IconHeartPlus,
  IconCertificate,
  IconReportAnalytics,
  IconUsersGroup,
  IconDotsVertical,
} from "@tabler/icons-react";
import { Search, RefreshCcw, FileDown } from "lucide-react";
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import FormModal from '@/components/forms/ResidentForm';
import RbiFormC from '@/components/forms/RbiFormC';
import { toastDelete, toastError, toastSuccess,toastWarning } from '@/utils/toast';
import { showDeleteConfirmation,showWarningAlert } from '@/utils/dialog';
import { BarMetricCard, DonutMetricCard, AreaMetricCard } from '@/components/StatCard';
import { patchResidentRemarks } from './api/resident.api';
import { useNavigate } from 'react-router-dom'
import { setItem } from '@/utils/localStorageHelper';
import { useAuth } from "@/auth/AuthContext";
import { decodeToken } from "@/lib/jwt";
import { api } from '@/lib/axios';

// shadcn
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Label
} from "@/components/ui/label"
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button as ShadButton } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const Example = () => {
  const { accessToken } = useAuth();
  const currentUser = useMemo(() => decodeToken(accessToken), [accessToken]);
  const isStaff = currentUser?.role === 'staff';
  const healthworker = currentUser?.role === 'healthworker';
  const navigate = useNavigate()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)

  const [employmentSummary, setEmploymentSummary] = useState({})
  const [registeredCount, setRegisteredCount] = useState({})
  const [purokCountSummary, setPurokCountSummary] = useState({})

  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [purokOptions, setPurokOptions] = useState([])
  const [selectedPurok, setSelectedPurok] = useState(null)
  const [columnFilters, setColumnFilters] = useState([])

  const [selectedResident, setSelectedResident] = useState(null)
  const [opened, setOpened] = useState(false)
  const [rbiOpened, setRbiOpened] = useState(false)

  const [actionDialogOpened, setActionDialogOpened] = useState(false)
  const [actionTargetRow, setActionTargetRow] = useState(null)
  const [bdacLoading, setBdacLoading] = useState(false)

  const [exportLoading, setExportLoading] = useState(false)
  const [exportAgeGroup, setExportAgeGroup] = useState("all")
  const [exportModalOpened, setExportModalOpened] = useState(false)

  const INPUT_HEIGHT = 36
  const totalResidentsOnPage = useMemo(() => data.length, [data])

  const handleExportCSV = async () => {
    setExportLoading(true)
    try {
      const res = await api.get("/residents/export/csv", {
        params: { age_group: exportAgeGroup },
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `residents_${exportAgeGroup}_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toastSuccess("Export successful", "Residents CSV has been downloaded.")
      setExportModalOpened(false)
    } catch (err) {
      toastError("Failed to export residents. Please try again.")
    } finally {
      setExportLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue.trim())
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchValue])

  useEffect(() => {
    const fetchPurok = async () => {
      try {
        const res = await api.get("/purok")
        const options = res.data.map((item) => ({
          label: item.name,
          value: item.id,
        }))
        setPurokOptions(options)
      } catch (err) {
        console.error("Failed to load purok types", err)
      }
    }
    fetchPurok()
  }, [])

  const handleOpenActionDialog = (row) => {
    setActionTargetRow(row)
    setActionDialogOpened(true)
  }

  const handleEditFromDialog = () => {
    setActionDialogOpened(false)
    setSelectedResident(actionTargetRow.original)
    setOpened(true)
  }

  const handleAddToBdac = async () => {
    const id = actionTargetRow?.original?.id
    if (!id) return
    setBdacLoading(true)
    try {
      await patchResidentRemarks(id, 'bdac')
      setActionDialogOpened(false)
      toastSuccess("Added to BDAC list", "Resident has been successfully added to the BDAC records.")
      fetchResidents()
    } catch (err) {
      toastError("Failed to add resident to BDAC list. Please try again.")
    } finally {
      setBdacLoading(false)
    }
  }
const handleGenerateCertificate = (row) => {
  const PHT_OFFSET = 8 * 60;

  const toPhilippineDate = (date) => {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    return new Date(utc + PHT_OFFSET * 60000);
  };

  // Debug: check what's actually in row
  console.log("row keys:", Object.keys(row));
  console.log("citizenship_date raw:", row.citizenship_date);

  const rawDate = row.citizenship_date ?? row.original?.citizenship_date;

  if (!rawDate) {
    toastWarning("Generate Certificate", "Missing citizenship date.");
    return;
  }

  const nowPHT = toPhilippineDate(new Date());
  const citizenshipDate = toPhilippineDate(new Date(rawDate));
  const sixMonthsAgoPHT = new Date(nowPHT);
  sixMonthsAgoPHT.setMonth(sixMonthsAgoPHT.getMonth() - 6);

  console.log(
    "PHT Now:", nowPHT.toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
    "PHT Citizenship:", citizenshipDate.toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
    "PHT 6mo ago:", sixMonthsAgoPHT.toLocaleString("en-PH", { timeZone: "Asia/Manila" })
  );

  if (citizenshipDate <= sixMonthsAgoPHT) {
    setItem("Temp_Resident", row.original);
    navigate("/certificates/list");
  } else {
    toastWarning(
      "Generate Certificate",
      "Resident must have been a resident for at least 6 months."
    );
  }
};
  const columns = useMemo(() => [
    {
      accessorKey: 'resident_id',
      header: 'Resident ID',
      aggregationFn: 'count',
      AggregatedCell: ({ cell }) => <strong>{cell.getValue()} residents</strong>,
    },
    {
      header: 'Full Name',
      id: 'full_name',
      accessorFn: (row) => {
        const middleInitial = row.m_name ? `${row.m_name.charAt(0).toUpperCase()}.` : ''
        return `${row.l_name}, ${row.f_name} ${middleInitial}`.trim()
      },
      enableColumnFilter: true,
      filterFn: 'includesString',
      mantineTableBodyCellProps: { className: 'capitalize' },
    },
    {
      id: 'purok',
      header: 'Purok',
      accessorFn: (row) => row.purok?.name || 'N/A',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'house_no',
      header: 'House No.',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
    },
    {
      accessorKey: 'sex',
      header: 'Sex',
      enableColumnFilter: true,
      filterFn: 'includesString',
      mantineTableBodyCellProps: { className: 'capitalize text-sm font-medium' },
    },
    {
      accessorKey: 'b_date',
      header: 'Birth Date',
      Cell: ({ cell }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : '',
    },
    {
      accessorKey: 'b_place',
      header: 'Birth Place',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
      mantineTableBodyCellProps: { className: 'capitalize' },
    },
    {
      accessorKey: 'voting_status',
      header: 'Voting Status',
      enableColumnFilter: true,
      filterFn: 'includesString',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
    },
    {
      accessorKey: 'sector',
      header: 'Sector',
      enableColumnFilter: true,
      filterFn: 'includesString',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
    },
    {
      accessorKey: 'age',
      header: 'Age',
      enableColumnFilter: true,
      filterFn: 'between',
      Cell: ({ cell }) => (cell.getValue() ?? 'N/A'),
    },
    {
      accessorKey: 'contact_no',
      header: 'Contact No.',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
    },
    {
      accessorKey: 'email_address',
      header: 'Email',
      aggregationFn: 'count',
      AggregatedCell: ({ cell }) => (
        <span style={{ color: 'skyblue' }}>{cell.getValue()} with email</span>
      ),
    },
    {
      accessorKey: 'times_tamp',
      header: 'Created At',
      Cell: ({ cell }) => cell.getValue() ? new Date(cell.getValue()).toLocaleString() : '',
    },
    {
      id: "actions",
      header: "Actions",
      mantineTableHeadCellProps: { align: 'center' },
      mantineTableBodyCellProps: {
        sx: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
      },
      Cell: ({ row }) => (
        <Group justify="flex-end" gap="xs">
          {healthworker && (
            <ActionIcon
              color="teal"
              title="Add Health Record"
              onClick={() => navigate(`/health-records-form/${row.original.resident_id}?mode=add`)}
            >
              <IconHeartPlus />
            </ActionIcon>
          )}
          {isStaff && (
            <ActionIcon
              color="violet"
              title="Generate Certificate"
              onClick={() => {
                handleGenerateCertificate(row)
              }}
            >
              <IconCertificate />
            </ActionIcon>
          )}
          <ActionIcon
            color="blue"
            title="More Actions"
            onClick={() => handleOpenActionDialog(row)}
          >
            <IconDotsVertical />
          </ActionIcon>
          <ActionIcon
            color="red"
            title="Archive Resident"
            onClick={() => handleDelete(row)}
          >
            <IconTrashFilled />
          </ActionIcon>
        </Group>
      ),
    },
  ], [totalResidentsOnPage])

  const fetchResidents = async () => {
    setLoading(true)
    try {
      const res = await getResidents({
        page,
        limit,
        search: debouncedSearch || undefined,
        purok_id: selectedPurok || undefined,
      })
      setData(res?.residents ?? [])
      setTotal(res?.meta?.total ?? 0)
      setEmploymentSummary(res?.meta?.employmentSummary ?? {})
      setRegisteredCount(res?.meta?.registeredCount ?? {})
      setPurokCountSummary(res?.meta?.purokCounts ?? {})
    } catch (err) {
      console.error("Failed to load residents", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResidents()
  }, [page, limit, debouncedSearch, selectedPurok])

  const handleDelete = async (row) => {
    const id = row.original.id
    const confirmed = await showDeleteConfirmation({
      title: "Archive Resident Record",
      text: "Are you sure you want to archive this resident? This action cannot be undone.",
    });
    if (!confirmed) return;
    try {
      await patchResidentRemarks(id, 'archive');
      toastDelete("Resident archived successfully", "Resident cannot be recovered after archiving.");
      fetchResidents();
    } catch (err) {
      toastError("Failed to archive resident. Please try again.");
    }
  }

  const dialogResidentName = actionTargetRow
    ? `${actionTargetRow.original.f_name ?? ''} ${actionTargetRow.original.l_name ?? ''}`.trim()
    : ''

  return (
    <>
      <FormModal
        opened={opened}
        onClose={() => setOpened(false)}
        initialData={selectedResident}
        onSuccess={fetchResidents}
      />

      {/* ── Export CSV Modal (shadcn) ────────────────────────────────── */}
      <Dialog open={exportModalOpened} onOpenChange={setExportModalOpened}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Export Residents CSV</DialogTitle>
            <DialogDescription>
              Residents will be grouped by Purok and sorted by house number.
              The CSV will download automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="age-group">Age Group</Label>
              <ShadSelect value={exportAgeGroup} onValueChange={setExportAgeGroup}>
                <SelectTrigger id="age-group" className="w-full">
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Residents</SelectItem>
                  <SelectItem value="1-19">Ages 1–19</SelectItem>
                  <SelectItem value="20-59">Ages 20–59</SelectItem>
                  <SelectItem value="60+">Ages 60+</SelectItem>
                </SelectContent>
              </ShadSelect>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <ShadButton
              variant="outline"
              onClick={() => setExportModalOpened(false)}
              disabled={exportLoading}
            >
              Cancel
            </ShadButton>
            <ShadButton
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleExportCSV}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download CSV
                </>
              )}
            </ShadButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Action Selection Dialog (Mantine — keep as-is) ───────────── */}
      <Modal
        opened={actionDialogOpened}
        onClose={() => setActionDialogOpened(false)}
        title={
          <Box>
            <Text fw={600} size="sm">Select Action</Text>
            {dialogResidentName && (
              <Text size="xs" c="dimmed" mt={2} className="capitalize">
                {dialogResidentName}
              </Text>
            )}
          </Box>
        }
        size="xs"
        centered
        styles={{ body: { padding: '0.5rem 1rem 1rem' } }}
      >
        <Divider mb="md" />
        <Stack gap="sm">
          <Button
            fullWidth
            variant="light"
            color="blue"
            leftSection={<IconEdit size={16} />}
            justify="start"
            onClick={handleEditFromDialog}
          >
            Edit Resident Data
          </Button>
          {isStaff && (
            <Button
              fullWidth
              variant="light"
              color="orange"
              leftSection={<IconUsersGroup size={16} />}
              justify="start"
              loading={bdacLoading}
              onClick={handleAddToBdac}
            >
              Add to BDAC Records
            </Button>
          )}
        </Stack>
        <Divider mt="md" mb="sm" />
        <Button
          fullWidth
          variant="subtle"
          color="gray"
          size="xs"
          onClick={() => setActionDialogOpened(false)}
        >
          Cancel
        </Button>
      </Modal>

      <div className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        <div className="sm:col-span-2 xl:col-span-1">
          <BarMetricCard
            title="Employment Summary"
            subtitle="Overall employment status of residents"
            value={`${employmentSummary.student ?? 0} Students`}
            badge={employmentSummary.employed + " Employed"}
            data={Object.entries(employmentSummary ?? {}).map(([k, v]) => ({
              label: k === "null" ? "Unknown" : String(k).charAt(0).toUpperCase() + String(k).slice(1),
              value: Number(v) || 0,
              highlight: String(k).toLowerCase() === "employed",
            }))}
            formatter={(v) => `${v}`}
          />
        </div>

        <div className="sm:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <AreaMetricCard
            title="Population by Purok"
            subtitle="Distribution of residents across different puroks"
            value={`${total ?? 0}`}
            data={Object.entries(purokCountSummary ?? {}).map(([k, v]) => ({
              label: k === "null" ? "Unknown" : String(k).charAt(0).toUpperCase() + String(k).slice(1),
              value: Number(v) || 0,
              highlight: false,
            }))}
            formatter={(v) => `${v}`}
          />
          <DonutMetricCard
            title="Voting Status"
            subtitle="Distribution of voting status among residents"
            value={`${total ?? 0}`}
            centerLabel={registeredCount.registered}
            trend={registeredCount.unregistered + " Unregistered"}
            segments={Object.entries(registeredCount ?? {}).map(([k, v]) => ({
              name: k === "null" ? "Unknown" : String(k),
              value: Number(v) || 0,
            }))}
          />
        </div>
      </div>

      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableColumnFilters: true,
          enableGlobalFilter: false,
          enablePagination: true,
          enablePinning: true,
          enableGrouping: true,
          enableColumnAggregation: true,
          enableStickyFooter: true,
          enableStickyHeader: true,
          manualPagination: true,
          manualFiltering: false,
          rowCount: total,
          mantineTableContainerProps: {
            style: {
              maxHeight: "calc(100vh - 320px)",
              overflowY: "auto",
              tableLayout: "auto",
            },
          },
          initialState: {
            grouping: ['purok'],
            expanded: true,
            columnFilters: [],
            density: 'xs',
            columnPinning: { right: ['actions'] },
          },
          state: {
            isLoading: loading,
            columnFilters,
            pagination: { pageIndex: page - 1, pageSize: limit },
          },
          onColumnFiltersChange: (updater) => {
            const next = typeof updater === 'function' ? updater(columnFilters) : updater
            setColumnFilters(next)
          },
          onPaginationChange: (updater) => {
            const next = typeof updater === 'function'
              ? updater({ pageIndex: page - 1, pageSize: limit })
              : updater
            setPage(next.pageIndex + 1)
            setLimit(next.pageSize)
          },
        }}
        renderToolbar={({ table }) => (
          <Flex p="md" justify="space-between">
            <Flex gap="xs" align="center" wrap="wrap">
              <Flex
                align="center"
                style={{ border: "1px solid #ced4da", borderRadius: 4, overflow: "hidden" }}
              >
                <ActionIcon
                  variant="subtle"
                  style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT, borderRight: "1px solid #ced4da", borderRadius: 0 }}
                >
                  <Search size={16} />
                </ActionIcon>
                <TextInput
                  placeholder="Search by resident ID or last name..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  styles={{ input: { height: INPUT_HEIGHT, border: "none", borderRadius: 0 } }}
                  style={{ width: 250 }}
                />
              </Flex>

              <Select
                placeholder="Filter by purok"
                data={purokOptions}
                value={selectedPurok}
                onChange={(value) => {
                  setSelectedPurok(value)
                  setPage(1)
                }}
                clearable
                searchable
                style={{ width: 220 }}
              />

              <ActionIcon
                variant="outline"
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
                onClick={() => fetchResidents()}
              >
                <RefreshCcw size={16} />
              </ActionIcon>

              <MRT_ToggleFiltersButton table={table} />
              <MRT_ShowHideColumnsButton table={table} />
            </Flex>

            <Flex gap="xs" align="center">
              <Button
                variant="outline"
                color="green"
                leftIcon={<IconReportAnalytics size={16} />}
                style={{ height: INPUT_HEIGHT }}
                onClick={() => setRbiOpened(true)}
              >
                RBI Form C
              </Button>

              <Modal
                opened={rbiOpened}
                onClose={() => setRbiOpened(false)}
                title="RBI Form C"
                centered
                size="sm"
              >
                {rbiOpened && <RbiFormC onDone={() => setRbiOpened(false)} />}
              </Modal>

              {/* Export CSV trigger */}
              <Button
                variant="outline"
                color="teal"
                leftIcon={<FileDown size={16} />}
                style={{ height: INPUT_HEIGHT }}
                onClick={() => setExportModalOpened(true)}
              >
                Export CSV
              </Button>

              <Button
                className="btn-primary"
                leftIcon={<IconPlus />}
                onClick={() => {
                  setSelectedResident(null)
                  setOpened(true)
                }}
              >
                Add Residents
              </Button>
            </Flex>
          </Flex>
        )}
      />
    </>
  )
}

export default Example