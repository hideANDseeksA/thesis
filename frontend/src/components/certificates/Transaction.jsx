import { useEffect, useMemo, useState } from "react";
import ReusableMantineTable from "./../ReusableTable";
import {
  ActionIcon,
  Group,
  Button,
  Flex,
  TextInput,
  Box,
  Text,
  Stack,
  Divider,
} from "@mantine/core";
import { IconEye, IconRefresh } from "@tabler/icons-react";
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import { PackageCheckIcon, Search } from "lucide-react";
import { capitalizeWords } from "@/lib/capitalizer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getItem } from "@/utils/localStorageHelper";
import { MoreHorizontal, CheckCircle, XCircle, FileText, PackageCheck, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import DynamicForm from "@/components/forms/CertificateGenerator";
import { api, apiWithLoading } from "@/lib/axios";
import { getSocket } from "@/utils/socket";
import { toastError, toastSuccess } from "@/utils/toast";
import { showWarningAlert } from "@/utils/dialog";

const STATUS_CONFIG = {
  pending:          { color: "orange", bg: "orange.1", text: "orange.7" },
  "on process":     { color: "blue",   bg: "blue.1",   text: "blue.7"   },
  "ready to claim": { color: "violet", bg: "violet.1", text: "violet.7" },
  completed:        { color: "green",  bg: "green.1",  text: "green.7"  },
  declined:         { color: "red",    bg: "red.1",    text: "red.7"    },
  cancelled:        { color: "gray",   bg: "gray.1",   text: "gray.7"   },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status?.toLowerCase()] ?? { color: "gray", bg: "gray.1", text: "gray.7" };

const TransactionTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);   // ← added
  const INPUT_HEIGHT = 36;
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const userId = getItem("resident_id");
  const { resident_data } = useAuth();

  /* ================= FETCH ================= */
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/transactions`);
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

  /* ================= SOCKET ================= */
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch (err) {
      console.warn("Socket not available:", err.message);
      return;
    }

    const handleNewTransaction = () => fetchTransactions();

    const handleUpdatedTransaction = ({ id, status }) => {
      if (status === "declined" || status === "cancelled" || status === "completed") {
        setData((prev) => prev.filter((row) => row.id !== id));
      } else {
        setData((prev) =>
          prev.map((row) => (row.id === id ? { ...row, status } : row))
        );
      }
    };

    socket.on("transaction:new", handleNewTransaction);
    socket.on("transaction:updated", handleUpdatedTransaction);

    return () => {
      socket.off("transaction:new", handleNewTransaction);
      socket.off("transaction:updated", handleUpdatedTransaction);
    };
  }, []);

  /* ================= ACTIONS ================= */
  const handleStatusUpdate = async (transaction, status) => {
    const confirm = await showWarningAlert({
      title: `Update Certificate Status`,
      text: `Are you sure you want to change the status to "${status}"?`,
    });
    if (!confirm) return;

    try {
      await apiWithLoading.patch(`/transactions/${transaction.id}`, {
        status,
        handled_by_id: userId,
      });
      toastSuccess("Certificate Status Updated", `Transaction status has been updated to "${status}".`);
      if (["declined", "cancelled", "completed", "unclaimed"].includes(status)) {
        setData((prev) => prev.filter((row) => row.id !== transaction.id));
      } else {
        setData((prev) =>
          prev.map((row) => (row.id === transaction.id ? { ...row, status } : row))
        );
      }
    } catch (err) {
      toastError("Failed to Update Status", `An error occurred while updating the transaction status to "${status}". Please try again.`);
      console.error(`Failed to update status to ${status}`, err);
    }
  };

  const handleGenerate = async (transaction) => {
    try {
      const res = await apiWithLoading.post(
        `/transactions/${transaction.id}/generate`,
        {},
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${transaction.certificate?.template_name ?? "certificate"}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      fetchTransactions();
    } catch (err) {
      console.error("Failed to generate certificate", err);
    }
  };

  /* ================= COLUMNS ================= */
  const columns = useMemo(() => [
    {
      header: "Resident",
      id: "resident_name",
      accessorFn: (row) =>
        `${capitalizeWords(row.resident?.f_name ?? "")} ${capitalizeWords(row.resident?.l_name ?? "")}`,
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      header: "Resident ID",
      accessorKey: "resident.resident_id",
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      header: "Certificate",
      accessorKey: "certificate.template_name",
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => capitalizeWords(cell.getValue() ?? ""),
    },
    {
      header: "Price",
      accessorKey: "certificate.template_price",
      enableColumnFilter: false,
      Cell: ({ cell }) =>
        new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(cell.getValue() ?? 0),
    },
    {
      header: "Status",
      accessorKey: "status",
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => {
        const config = getStatusConfig(cell.getValue());
        return (
          <Text
            fw={600}
            size="xs"
            px="sm"
            py={4}
            bg={config.bg}
            c={config.text}
            style={{ borderRadius: 12, display: "inline-block" }}
          >
            {cell.getValue()}
          </Text>
        );
      },
    },
    {
      header: "Created At",
      accessorKey: "timestamp",
      enableColumnFilter: false,
      Cell: ({ cell }) =>
        cell.getValue() ? new Date(cell.getValue()).toLocaleString() : "",
    },
    {
      header: "Actions",
      id: "actions",
      enableSorting: false,
      enableColumnFilter: false,
      Cell: ({ row }) => {
        const status = row.original.status;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ActionIcon variant="subtle">
                <MoreHorizontal size={16} />
              </ActionIcon>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="text-green-600 focus:text-green-700 focus:bg-green-50 cursor-pointer"
                onClick={() => handleStatusUpdate(row.original, "on process")}
                disabled={status !== "pending"}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                disabled={status !== "pending"}
                onClick={() => handleStatusUpdate(row.original, "declined")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-violet-600 focus:text-violet-700 focus:bg-violet-50 cursor-pointer"
                disabled={status !== "on process"}
                onClick={() => handleStatusUpdate(row.original, "ready to claim")}
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Ready to Claim
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                disabled={status !== "ready to claim"}
                onClick={() => handleStatusUpdate(row.original, "completed")}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Completed
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                disabled={status !== "ready to claim"}
                onClick={() => handleStatusUpdate(row.original, "unclaimed")}
              >
                <PackageCheckIcon className="mr-2 h-4 w-4" />
                Unclaimed
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleGenerate(row.original)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  return (
    <>
      {/* ================= EDIT MODAL ================= */}
      {isEditModalOpen && editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md lg:max-w-xl">
            <DynamicForm
              transactionId={editingTransaction.id}
              templateId={editingTransaction.certificate_id}
              initialData={editingTransaction.details || {}}
              submitLabel="Generate"
              onSubmit={(formData, template) => {
                console.log("Updated data:", formData, template);
                setIsEditModalOpen(false);
                setEditingTransaction(null);
                fetchTransactions();
              }}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingTransaction(null);
              }}
            />
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableStickyFooter: true,
          enableStickyHeader: true,
          enableTopToolbar: true,
          enablePagination: true,
          enableExpanding: true,
          enableColumnFilters: true,        // ← added
          enableGlobalFilter: true,         // ← added
          manualFiltering: false,           // ← added
          mantineTableContainerProps: {
            style: {
              maxHeight: "calc(100vh - 320px)",
              overflowY: "auto",
              tableLayout: "auto",
            },
          },
          initialState: {
            columnFilters: [],
          },
          state: {
            isLoading: loading,
            columnFilters,                  // ← added
          },
          onColumnFiltersChange: (updater) => {
            const next =
              typeof updater === "function" ? updater(columnFilters) : updater;
            setColumnFilters(next);
          },
          renderDetailPanel: ({ row }) => {
            const details = row.original.details || {};
            const transaction = row.original;
            const hasDetails = Object.keys(details).length > 0;
            const detailsCount = Object.keys(details).length;
            const statusConfig = getStatusConfig(transaction.status);

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
                      bg={statusConfig.bg}
                      c={statusConfig.text}
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
                            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(transaction.certificate?.template_price ?? 0)}
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
                            detailsCount <= 3
                              ? `repeat(${detailsCount}, 1fr)`
                              : detailsCount <= 6
                              ? "repeat(3, 1fr)"
                              : "repeat(4, 1fr)",
                          gap: "1rem",
                        }}
                      >
                        {Object.entries(details).map(([key, value]) => (
                          <Box
                            key={key}
                            p="md"
                            style={{ borderRadius: 8, border: "1px solid #e9ecef", borderLeft: "3px solid #228be6", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                          >
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
                  style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT, borderRight: "1px solid #ced4da", borderRadius: 0 }}
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
                  styles={{ input: { height: INPUT_HEIGHT, border: "none", borderRadius: 0 } }}
                  style={{ width: 260 }}
                />
              </Flex>
              <ActionIcon variant="outline" onClick={fetchTransactions} style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}>
                <IconRefresh size={16} />
              </ActionIcon>
              <MRT_ToggleFiltersButton table={table} />
              <MRT_ShowHideColumnsButton table={table} />
            </Flex>
          </Flex>
        )}
      />
    </>
  );
};

export default TransactionTable;