import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReusableMantineTable from "./../ReusableTable";
import {
  ActionIcon,
  Group,
  Flex,
  TextInput,
  Box,
  Text,
  Stack,
  Divider,
  Tooltip,
  Button,
} from "@mantine/core";
import { IconRefresh, IconFileAnalytics } from "@tabler/icons-react";
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import { Search } from "lucide-react";
import { capitalizeWords } from "@/lib/capitalizer";
import { api } from "@/lib/axios";
import {
  pdf,
  Document,
  Page,
  Text as PdfText,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// ── PDF Styles ──────────────────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#111",
    backgroundColor: "#fff",
  },
  headerBar: {
    borderBottomWidth: 2,
    borderBottomColor: "#1c7ed6",
    borderBottomStyle: "solid",
    paddingBottom: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1c7ed6",
  },
  headerSub: {
    fontSize: 10,
    color: "#666",
    marginTop: 3,
  },
  metaRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 20,
  },
  metaLabel: {
    fontSize: 9,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#111",
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#555",
    marginTop: 20,
    marginBottom: 6,
  },
  table: {
    width: "100%",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#1c7ed6",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    borderBottomStyle: "solid",
  },
  tableRowEven: {
    backgroundColor: "#f8f9fa",
  },
  thCell: {
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    padding: "6 8",
    flex: 1,
  },
  tdCell: {
    fontSize: 9,
    padding: "6 8",
    flex: 1,
    color: "#333",
  },
  tdCellCenter: {
    fontSize: 9,
    padding: "6 8",
    flex: 1,
    color: "#333",
    textAlign: "center",
  },
  footer: {
    marginTop: 40,
    fontSize: 9,
    color: "#aaa",
    textAlign: "center",
  },
});

// ── PDF Document Component ──────────────────────────────────────────────────
const ReportDocument = ({ report, reportType, reportYear, monthLabel }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.headerBar}>
        <PdfText style={pdfStyles.headerTitle}>Transaction Report</PdfText>
        <PdfText style={pdfStyles.headerSub}>
          {reportType === "yearly" ? `Year ${reportYear}` : monthLabel} — Completed Transactions Only
        </PdfText>
      </View>

      {/* Meta */}
      <View style={pdfStyles.metaRow}>
        <View>
          <PdfText style={pdfStyles.metaLabel}>Total Transactions</PdfText>
          <PdfText style={pdfStyles.metaValue}>{report.total_transactions}</PdfText>
        </View>
        <View>
          <PdfText style={pdfStyles.metaLabel}>Total Revenue</PdfText>
          <PdfText style={pdfStyles.metaValue}>
            {Number(report.total_revenue).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </PdfText>
        </View>
      </View>

      {/* Summary by Certificate */}
      <PdfText style={pdfStyles.sectionTitle}>Summary by Certificate</PdfText>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeaderRow}>
          <PdfText style={pdfStyles.thCell}>Certificate</PdfText>
          <PdfText style={[pdfStyles.thCell, { textAlign: "center" }]}>Total</PdfText>
          <PdfText style={pdfStyles.thCell}>Status Breakdown</PdfText>
        </View>
        {report.summary.map((s, i) => (
          <View
            key={i}
            style={[pdfStyles.tableRow, i % 2 === 1 ? pdfStyles.tableRowEven : {}]}
          >
            <PdfText style={pdfStyles.tdCell}>{capitalizeWords(s.template_name)}</PdfText>
            <PdfText style={pdfStyles.tdCellCenter}>{s.count}</PdfText>
            <PdfText style={pdfStyles.tdCell}>
              {Object.entries(s.statuses)
                .map(([status, count]) => `${capitalizeWords(status)}: ${count}`)
                .join(", ")}
            </PdfText>
          </View>
        ))}
      </View>

      {/* Monthly Breakdown */}
      {report.by_month && Object.keys(report.by_month).length > 0 && (
        <>
          <PdfText style={pdfStyles.sectionTitle}>Monthly Breakdown</PdfText>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeaderRow}>
              <PdfText style={pdfStyles.thCell}>Month</PdfText>
              <PdfText style={[pdfStyles.thCell, { textAlign: "center" }]}>Total Transactions</PdfText>
            </View>
            {Object.entries(report.by_month).map(([m, c], i) => (
              <View
                key={m}
                style={[pdfStyles.tableRow, i % 2 === 1 ? pdfStyles.tableRowEven : {}]}
              >
                <PdfText style={pdfStyles.tdCell}>{m}</PdfText>
                <PdfText style={pdfStyles.tdCellCenter}>{c}</PdfText>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Footer */}
      <PdfText style={pdfStyles.footer}>
        Generated on {new Date().toLocaleString("en-PH")}
      </PdfText>
    </Page>
  </Document>
);

// ── Month / Year constants ──────────────────────────────────────────────────
const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return { value: String(y), label: String(y) };
});

// ── Main Component ──────────────────────────────────────────────────────────
const HistoryTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(CURRENT_YEAR));
  const [generatingReport, setGeneratingReport] = useState(false);

  const INPUT_HEIGHT = 36;

  // ── Generate & Auto-Download PDF ──────────────────────────────────────────
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const params = { type: reportType, year: reportYear };
      if (reportType === "monthly") params.month = reportMonth;

      const { data: report } = await api.get("/transactions/report", { params });

      const monthLabel = report.label ?? reportYear;

      const blob = await pdf(
        <ReportDocument
          report={report}
          reportType={reportType}
          reportYear={reportYear}
          monthLabel={monthLabel}
        />
      ).toBlob();

      const fileName =
        reportType === "yearly"
          ? `transaction-report-${reportYear}.pdf`
          : `transaction-report-${monthLabel.replace(/\s+/g, "-")}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      setReportModalOpen(false);
    } catch (err) {
      console.error("Failed to generate report", err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        header: "Resident",
        accessorFn: (row) =>
          `${capitalizeWords(row.resident?.f_name ?? "")} ${capitalizeWords(row.resident?.l_name ?? "")}`,
      },
      {
        header: "Resident ID",
        accessorKey: "resident.resident_id",
      },
      {
        header: "Certificate",
        accessorKey: "certificate.template_name",
        Cell: ({ cell }) => capitalizeWords(cell.getValue() ?? ""),
      },
      {
        header: "Price",
        accessorKey: "certificate.template_price",
        Cell: ({ cell }) =>
          new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(cell.getValue() ?? 0),
      },
     {
  header: "Status",
  accessorKey: "status",
  Cell: ({ cell }) => {
    const status = cell.getValue()?.toLowerCase();

    const colorMap = {
      completed: {
        bg: "#e8f5e9",
        text: "#2e7d32",
      },
      unclaimed: {
        bg: "#fff8e1",
        text: "#f57f17",
      },
      cancelled: {
        bg: "#ffebee",
        text: "#c62828",
      },
      declined: {
        bg: "#eceff1",
        text: "#455a64",
      },
    };

    const config = colorMap[status] ?? {
      bg: "#f5f5f5",
      text: "#616161",
    };

    return (
      <Text
        fw={600}
        size="xs"
        px="sm"
        py={4}
        bg={config.bg}
        c={config.text}
        style={{
          borderRadius: 12,
          display: "inline-block",
        }}
      >
        {status}
      </Text>
    );
  },
      },
      {
        header: "Issued By",
        accessorFn: (row) =>
          `${capitalizeWords(row.handled_by?.f_name ?? "")} ${capitalizeWords(row.handled_by?.l_name ?? "N/A")}`,
      },
      {
        header: "Created At",
        accessorKey: "timestamp",
        Cell: ({ cell }) =>
          cell.getValue() ? new Date(cell.getValue()).toLocaleString() : "",
      },
    ],
    []
  );

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/transactions/history`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <>
      {/* ── Report Modal ─────────────────────────────────────────────────── */}
  <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
  <DialogContent className="sm:max-w-sm">
    <DialogHeader>
      <DialogTitle>Generate Transaction Report</DialogTitle>
      <DialogDescription>
        Shows completed transactions only. The PDF will download automatically.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-2">
      {/* Report Type */}
      <div className="space-y-1.5">
        <Label>Report Type</Label>
        <ShadSelect value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </ShadSelect>
      </div>

      {/* Month (only for monthly) */}
      {reportType === "monthly" && (
        <div className="space-y-1.5">
          <Label>Month</Label>
          <ShadSelect value={reportMonth} onValueChange={setReportMonth}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </ShadSelect>
        </div>
      )}

      {/* Year */}
      <div className="space-y-1.5">
        <Label>Year</Label>
        <ShadSelect value={reportYear} onValueChange={setReportYear}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y.value} value={y.value}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </ShadSelect>
      </div>
    </div>

    <DialogFooter className="gap-2">
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
          <>
            <IconFileAnalytics size={15} />
            Download PDF
          </>
        )}
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableStickyFooter: true,
          enableStickyHeader: true,
          enableTopToolbar: true,
          enablePagination: true,
          enableExpanding: true,
          mantineTableContainerProps: {
            style: {
              maxHeight: "calc(100vh - 320px)",
              overflowY: "auto",
              tableLayout: "auto",
            },
          },
          state: { isLoading: loading },
          renderDetailPanel: ({ row }) => {
            const details = row.original.details || {};
            const transaction = row.original;
            const hasDetails = Object.keys(details).length > 0;
            const detailsCount = Object.keys(details).length;

            const formatFieldName = (key) =>
              key
                .replace(/_/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

            return (
              <Box p="xl">
                <Stack spacing="lg">
                  <Flex justify="space-between" align="center">
                    <div>
                      <Text size="lg" fw={600}>Transaction Details</Text>
                      <Text size="sm" c="dimmed" mt={4}>
                        {transaction.certificate?.template_name || "Certificate"} Request
                      </Text>
                    </div>
                    <Text
                      size="xs"
                      fw={600}
                      px="md"
                      py={6}
                      bg={transaction.status === "completed" ? "green.1" : "red.1"}
                      c={transaction.status === "completed" ? "green.7" : "red.7"}
                      style={{ borderRadius: 16 }}
                    >
                      {transaction.status?.toUpperCase()}
                    </Text>
                  </Flex>

                  <Divider />

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                    <Box p="md" style={{ borderRadius: 8, border: "1px solid #e9ecef", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <Flex align="center" mb="sm">
                        <Box style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#228be6", marginRight: 8 }} />
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase">Resident</Text>
                      </Flex>
                      <Stack spacing={10}>
                        <div>
                          <Text size="xs" c="dimmed" mb={4}>Name</Text>
                          <Text size="sm" fw={500} lineClamp={1} tt="capitalize">
                            {transaction.resident?.f_name} {transaction.resident?.m_name} {transaction.resident?.l_name}
                          </Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" mb={4}>ID</Text>
                          <Text size="sm" fw={500}>{transaction.resident?.resident_id || "N/A"}</Text>
                        </div>
                      </Stack>
                    </Box>

                    <Box p="md" style={{ borderRadius: 8, border: "1px solid #e9ecef", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <Flex align="center" mb="sm">
                        <Box style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#40c057", marginRight: 8 }} />
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase">Certificate</Text>
                      </Flex>
                      <Stack spacing={10}>
                        <div>
                          <Text size="xs" c="dimmed" mb={4}>Type</Text>
                          <Text size="sm" fw={500} lineClamp={1} tt="capitalize">
                            {transaction.certificate?.template_name || "N/A"}
                          </Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" mb={4}>Price</Text>
                          <Text size="md" fw={700} c="blue.6">
                            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
                              transaction.certificate?.template_price ?? 0
                            )}
                          </Text>
                        </div>
                      </Stack>
                    </Box>

                    <Box p="md" style={{ borderRadius: 8, border: "1px solid #e9ecef", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <Flex align="center" mb="sm">
                        <Box style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#fa5252", marginRight: 8 }} />
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase">Date & Time</Text>
                      </Flex>
                      <Stack spacing={10}>
                        <div>
                          <Text size="xs" c="dimmed" mb={4}>Created At</Text>
                          <Text size="sm" fw={500}>
                            {transaction.timestamp
                              ? new Date(transaction.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "N/A"}
                          </Text>
                          <Text size="xs" c="dimmed" mt={2}>
                            {transaction.timestamp
                              ? new Date(transaction.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </Text>
                        </div>
                      </Stack>
                    </Box>
                  </div>

                  {hasDetails && (
                    <>
                      <Divider
                        label={
                          <Group spacing={6}>
                            <Text size="sm" fw={600} c="dimmed">Request Information</Text>
                            <Text size="xs" c="dimmed" px={8} py={2} bg="blue.0" style={{ borderRadius: 12 }}>
                              {detailsCount} {detailsCount === 1 ? "field" : "fields"}
                            </Text>
                          </Group>
                        }
                        labelPosition="center"
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            detailsCount <= 3 ? `repeat(${detailsCount}, 1fr)`
                            : detailsCount <= 6 ? "repeat(3, 1fr)"
                            : "repeat(4, 1fr)",
                          gap: "1rem",
                        }}
                      >
                        {Object.entries(details).map(([key, value]) => (
                          <Box key={key} p="md" style={{ borderRadius: 8, border: "1px solid #e9ecef", borderLeft: "3px solid #228be6", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                            <Text size="xs" fw={600} c="blue.6" mb={8} tt="capitalize" style={{ letterSpacing: 0.5 }}>
                              {formatFieldName(key)}
                            </Text>
                            <Text size="sm" fw={500} tt="capitalize" style={{ wordBreak: "break-word", lineHeight: 1.5 }}>
                              {value || "—"}
                            </Text>
                          </Box>
                        ))}
                      </div>
                    </>
                  )}

                  {!hasDetails && (
                    <Box p="xl" bg="gray.1" style={{ borderRadius: 8, border: "1px dashed #ced4da", textAlign: "center" }}>
                      <Text size="sm" c="dimmed" fw={500}>No additional request information provided</Text>
                    </Box>
                  )}
                </Stack>
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
                  style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT, borderRight: "1px solid #ced4da" }}
                  onClick={() => table.setGlobalFilter(searchValue)}
                >
                  <Search size={16} />
                </ActionIcon>
                <TextInput
                  placeholder="Search transactions..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    table.setGlobalFilter(e.target.value);
                  }}
                  styles={{ input: { height: INPUT_HEIGHT, border: "none" } }}
                  style={{ width: 260 }}
                />
              </Flex>

              <ActionIcon
                variant="outline"
                onClick={fetchTransactions}
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
              >
                <IconRefresh size={16} />
              </ActionIcon>

              <MRT_ToggleFiltersButton table={table} />
              <MRT_ShowHideColumnsButton table={table} />
            </Flex>

            <Tooltip label="Generate Report" withArrow>
              <Button
                variant="filled"
                leftIcon={<IconFileAnalytics size={16} />}
                color="green"
                onClick={() => setReportModalOpen(true)}
              >
                Generate Report
              </Button>
            </Tooltip>
          </Flex>
        )}
      />
    </>
  );
};

export default HistoryTable;