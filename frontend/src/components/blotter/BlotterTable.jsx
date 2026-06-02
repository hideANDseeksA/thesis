import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReusableMantineTable from './../ReusableTable'
import { ActionIcon, Group, Flex, TextInput, Tooltip,Button } from "@mantine/core";
import { IconTrashFilled, IconPencil, IconPlus, IconPrinter, IconFileAnalytics, IconChevronDown } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, RefreshCcw } from "lucide-react";
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import {
  showErrorAlert,
  showDeleteConfirmation,
  showWarningAlert,
} from "@/utils/dialog";
import { toastDelete } from "@/utils/toast";
import { api,apiWithLoading } from '@/lib/axios';

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: "1",  label: "January"   },
  { value: "2",  label: "February"  },
  { value: "3",  label: "March"     },
  { value: "4",  label: "April"     },
  { value: "5",  label: "May"       },
  { value: "6",  label: "June"      },
  { value: "7",  label: "July"      },
  { value: "8",  label: "August"    },
  { value: "9",  label: "September" },
  { value: "10", label: "October"   },
  { value: "11", label: "November"  },
  { value: "12", label: "December"  },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return { value: String(y), label: String(y) };
});

const STATUS_OPTIONS = [
  { value: "pending",    label: "Pending",    color: "#f59e0b" },
  { value: "on process", label: "On Process", color: "#3b82f6" },
  { value: "resolved",   label: "Resolved",   color: "#10b981" },
  { value: "closed",     label: "Closed",     color: "#6b7280" },
];

const statusColor = (status) =>
  STATUS_OPTIONS.find((s) => s.value === status?.toLowerCase())?.color ?? "#9ca3af";

// ── Status Dropdown Cell ───────────────────────────────────────────────────────

const StatusCell = ({ row, onStatusUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const current = row.original.status ?? "pending";
  const color = statusColor(current);

  const handleSelect = async (e, value) => {
    // Prevent Radix from closing the menu before the async confirm resolves
    e.preventDefault();

    if (value === current.toLowerCase()) return;

    const confirmed = await showWarningAlert({
      title: "Blotter Update Status",
      text: `Are you sure you want to update the status to "${value}" of this blotter record?`,
      confirmText: "Update",
      confirmColor: "blue",
    });

    if (!confirmed) return;

    setUpdating(true);
    try {
      await apiWithLoading.patch(`/blotter/${row.original.id}/status`, { status: value });
      onStatusUpdated(row.original.id, value);
    } catch (err) {
      showErrorAlert(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        disabled={updating}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          borderRadius: 999,
          border: `1.5px solid ${color}`,
          background: `${color}18`,
          color,
          fontSize: 12,
          fontWeight: 600,
          cursor: updating ? "not-allowed" : "pointer",
          opacity: updating ? 0.6 : 1,
          whiteSpace: "nowrap",
          textTransform: "capitalize",
          minWidth: 95,
          justifyContent: "space-between",
        }}
      >
        {updating ? "Saving…" : current}
        <IconChevronDown size={12} style={{ flexShrink: 0 }} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="duration-0"
        style={{ minWidth: 150, zIndex: 9999 }}
      >
        {STATUS_OPTIONS.map((opt) => {
          const isActive = opt.value === current.toLowerCase();
          return (
            <DropdownMenuItem
              key={opt.value}
              // onSelect receives the native Event — pass it + value to handler
              onSelect={(e) => handleSelect(e, opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? opt.color : undefined,
                background: isActive ? `${opt.color}12` : undefined,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: opt.color,
                  flexShrink: 0,
                }}
              />
              {opt.label}
              {isActive && (
                <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.6 }}>✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const BlotterTable = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const totalOnPage = useMemo(() => data.length, [data]);
  const [searchValue, setSearchValue] = useState("");
  const [generatingIds, setGeneratingIds] = useState(new Set());

  // ── Report Modal State ───────────────────────────────────────────────────────
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(CURRENT_YEAR));
  const [generatingReport, setGeneratingReport] = useState(false);

  const INPUT_HEIGHT = 36;

  // ── Optimistic status update ─────────────────────────────────────────────────
  const handleStatusUpdated = (id, newStatus) => {
    setData((prev) =>
      prev.map((record) =>
        record.id === id ? { ...record, status: newStatus } : record
      )
    );
  };

  // ── Generate Report ──────────────────────────────────────────────────────────
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const params = { type: reportType, year: reportYear };
      if (reportType === "monthly") params.month = reportMonth;

      const res = await apiWithLoading.get("/blotter/report", { params });
      const report = res.data;
      const monthLabel = report.label ?? reportYear;

      const rows = report.summary
        .map((s) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #ddd">${s.complaint_type}</td>
            <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${s.count}</td>
          </tr>`)
        .join("");

      const byMonthRows = report.by_month
        ? Object.entries(report.by_month)
            .map(([m, c]) => `
              <tr>
                <td style="padding:8px 12px;border:1px solid #ddd">${m}</td>
                <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${c}</td>
              </tr>`)
            .join("")
        : "";

      const html = `
        <html>
          <head>
            <title>Blotter Report - ${monthLabel}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
              h1 { font-size: 20px; margin-bottom: 4px; }
              h2 { font-size: 15px; color: #555; margin-bottom: 24px; font-weight: normal; }
              h3 { font-size: 14px; margin: 24px 0 8px; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; }
              th { background: #1c7ed6; color: white; padding: 8px 12px; text-align: left; border: 1px solid #ddd; }
              tr:nth-child(even) { background: #f8f9fa; }
              .total { margin-top: 12px; font-size: 13px; color: #444; }
            </style>
          </head>
          <body>
            <h1>Blotter Report</h1>
            <h2>${reportType === "yearly" ? `Year ${reportYear}` : monthLabel}</h2>
            <h3>Summary by Complaint Type</h3>
            <table>
              <thead><tr><th>Complaint Type</th><th>Total Cases</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <p class="total"><strong>Total Cases:</strong> ${report.total_cases}</p>
            ${byMonthRows ? `
              <h3>Cases by Month</h3>
              <table>
                <thead><tr><th>Month</th><th>Total Cases</th></tr></thead>
                <tbody>${byMonthRows}</tbody>
              </table>` : ""}
          </body>
        </html>
      `;

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
      }
      setReportModalOpen(false);
    } catch (err) {
      showErrorAlert("Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAdd  = () => navigate('/blotter/blotter-form');
  const handleEdit = (row) => navigate(`/blotter/blotter-form/${row.original.id}`);

  const handleDelete = async (row) => {
    const id = row.original.id;
    const confirmed = await showDeleteConfirmation({
      title: "Delete Blotter Record",
      text: "Are you sure you want to delete this? This action cannot be undone.",
    });
    if (!confirmed) return;
    try {
      await apiWithLoading.delete(`/blotter/${id}`);
      toastDelete("Record deleted", "Blotter record was permanently removed.");
      fetchBlotters();
    } catch (error) {
      showErrorAlert(error?.response?.data?.message || "Failed to delete record.");
    }
  };

  const handleGenerate = async (row) => {
    const id = row.original.id;
    const caseNo = row.original.details?.case_no ?? row.original.case_no ?? id;
    const confirmed = await showWarningAlert({
      title: "Generate Blotter Document",
      text: `Generate a Word document for Case No. ${caseNo}?`,
      confirmText: "Generate",
      confirmColor: "blue",
    });
    if (!confirmed) return;
    setGeneratingIds((prev) => new Set(prev).add(id));
    try {
      const res = await apiWithLoading.post(
        `/generator/blotter/${id}/generate`,
        {},
        { responseType: 'blob' }
      );
      const disposition = res.headers?.['content-disposition'];
      let filename = `blotter-${caseNo}.docx`;
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match?.[1]) filename = match[1].replace(/['"]/g, '');
      }
      const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showErrorAlert(error?.response?.data?.message || "Failed to generate document.");
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      accessorFn: (row) => row.details?.date,
      header: 'Date Filed',
      enableColumnFilter: false,
    },
    {
      accessorFn: (row) => row.details?.case_no,
      header: 'Case #',
      mantineTableBodyCellProps: { className: 'capitalize' },
    },
    {
      id: 'complaint_type',
      accessorFn: (row) => row.details?.complaint_type,
      header: 'Complaint',
      enableColumnFilter: true,
      aggregationFn: 'count',
      mantineTableBodyCellProps: { className: 'capitalize' },
      AggregatedCell: ({ cell }) => <strong>{cell.getValue()} cases</strong>,
    },
    {
      accessorFn: (row) => row.details?.name1,
      header: 'Complainant',
      mantineTableBodyCellProps: { className: 'capitalize' },
    },
    {
      accessorFn: (row) => row.details?.name2,
      header: 'Accused',
      mantineTableBodyCellProps: { className: 'capitalize' },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      Cell: ({ cell }) => {
        const val = cell.getValue();
        const color = statusColor(val);
        return (
          <span style={{
            padding: "2px 10px",
            borderRadius: 999,
            border: `1.5px solid ${color}`,
            background: `${color}18`,
            color,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "capitalize",
            whiteSpace: "nowrap",
          }}>
            {val ?? "pending"}
          </span>
        );
      },
    },
    {
      accessorKey: 'updated_at',
      header: 'Last Updated',
      Cell: ({ cell }) =>
        cell.getValue() ? new Date(cell.getValue()).toLocaleString() : '',
    },
    {
      accessorKey: 'file_url',
      header: 'File',
      Cell: ({ cell }) => {
        const url = cell.getValue();
        return url ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            View
          </a>
        ) : 'N/A';
      },
    },
    {
      id: "actions",
      header: "Actions",
      Cell: ({ row }) => {
        const id = row.original.id;
        const isGenerating = generatingIds.has(id);
        return (
          <Group spacing="xs" align="center" noWrap>
            <Tooltip label="Edit record" withArrow>
              <ActionIcon color="black" onClick={() => handleEdit(row)}>
                <IconPencil size={20} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Generate document" withArrow>
              <ActionIcon
                color="blue"
                onClick={() => handleGenerate(row)}
                loading={isGenerating}
                disabled={isGenerating}
              >
                <IconPrinter size={20} />
              </ActionIcon>
            </Tooltip>

            {/* ── Status dropdown ── */}
            <StatusCell row={row} onStatusUpdated={handleStatusUpdated} />

            <Tooltip label="Delete record" withArrow>
              <ActionIcon color="red" onClick={() => handleDelete(row)}>
                <IconTrashFilled size={20} color="red" />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    },
  ], [totalOnPage, generatingIds]);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchBlotters = async () => {
    setLoading(true);
    try {
      const res = await api.get("/blotter", {
        params: { page, limit },
      });
      const list = res.data.data || res.data.residents || [];
      setData(list);
      setTotal(res.data.meta?.total ?? list.length);
    } catch (err) {
      console.error('Failed to load blotter records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlotters();
  }, [page, limit]);

  return (
    <>
      {/* ── Report Modal ──────────────────────────────────────────────────────── */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Generate Blotter Report
            </h2>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {reportType === "monthly" && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
              >
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              This will open a print dialog — save as PDF from there.
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setReportModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
                onClick={handleGenerateReport}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <><IconFileAnalytics size={15} /> Generate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableColumnFilters: true,
          enableGlobalFilter: true,
          enablePagination: true,
          enableGrouping: true,
          enableColumnAggregation: true,
          enableStickyFooter: true,
          enableStickyHeader: true,
          mantineTableContainerProps: {
            style: {
              maxHeight: "calc(100vh - 320px)",
              overflowY: "auto",
              tableLayout: "auto",
            },
          },
          manualPagination: true,
          rowCount: total,
          initialState: {
            grouping: ['complaint_type'],
            expanded: true,
            density: 'xs',
          },
          state: {
            isLoading: loading,
            pagination: {
              pageIndex: page - 1,
              pageSize: limit,
            },
          },
          onPaginationChange: (updater) => {
            const next =
              typeof updater === 'function'
                ? updater({ pageIndex: page - 1, pageSize: limit })
                : updater;
            setPage(next.pageIndex + 1);
            setLimit(next.pageSize);
          },
        }}
        renderToolbar={({ table }) => (
          <Flex p="md" justify="space-between">
            <Flex gap="xs" align="center">
              <Flex
                align="center"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <ActionIcon
                  variant="subtle"
                  style={{
                    height: INPUT_HEIGHT,
                    width: INPUT_HEIGHT,
                    borderRight: "1px solid #ced4da",
                    borderRadius: 0,
                  }}
                  onClick={() => table.setGlobalFilter(searchValue)}
                >
                  <Search size={20} />
                </ActionIcon>
                <TextInput
                  placeholder="Search cases..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    table.setGlobalFilter(e.target.value);
                  }}
                  styles={{
                    input: { height: INPUT_HEIGHT, border: "none", borderRadius: 0 },
                  }}
                  style={{ width: 250 }}
                />
              </Flex>

              <ActionIcon
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
                onClick={() => fetchBlotters()}
              >
                <RefreshCcw size={20} />
              </ActionIcon>

              <MRT_ToggleFiltersButton table={table} />
              <MRT_ShowHideColumnsButton table={table} />
            </Flex>

        <Flex gap="xs">
  <Tooltip label="Generate Report" withArrow>
    <Button
      variant="filled"
      color="green"
      leftIcon={<IconFileAnalytics size={16} />}
      style={{ height: INPUT_HEIGHT }}
      onClick={() => setReportModalOpen(true)}
    >
      Generate Report
    </Button>
  </Tooltip>

  <Button
    variant="filled"
    className='btn-primary'
    leftIcon={<IconPlus size={16} />}
    style={{ height: INPUT_HEIGHT }}
    onClick={handleAdd}
  >
    Add Blotter
  </Button>
</Flex>
          </Flex>
        )}
      />
    </>
  );
};

export default BlotterTable;