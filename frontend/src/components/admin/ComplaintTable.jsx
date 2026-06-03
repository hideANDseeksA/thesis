import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReusableMantineTable from "@/components/ReusableTable";
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
  Badge,
  Image,
  
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import { Archive, Search } from "lucide-react";
import { capitalizeWords } from "@/lib/capitalizer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getItem } from "@/utils/localStorageHelper";
import { MoreHorizontal, CheckCircle, XCircle,Eye } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { AreaMetricCard } from "@/components/StatCard";
import { StatCard } from "../StatCardV_2";
import { apiWithLoading } from "@/lib/axios";
import { showWarningAlert } from "@/utils/dialog";
import { toastError,toastSuccess } from "@/utils/toast";

const STATUS_COLOR = {
  pending: "orange",
  "on action": "green",
  declined: "red",
  resolved: "blue",

  "on process": "green",
};

const TransactionTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const INPUT_HEIGHT = 36;
  const [monthlyCount, setMonthlyCount] = useState({})
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    on_process: 0,
    resolved: 0,
    declined: 0,
  });


  const userId = getItem("resident_id");
  const { resident_data } = useAuth();
  const [columnFilters, setColumnFilters] = useState([]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await apiWithLoading.get(
        `/complaints`
      );
      setData(res.data.complaints || []);
      setMonthlyCount(res.data.monthlyResolvedCount ?? {})
      setStatusCounts(res.data.statusCounts ?? {});
    } catch (err) {
      console.error("Failed to load complaints", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

const handleStatusUpdate = async (complaint, status) => {

  const confirm = await showWarningAlert({
    title: `Update Status`,
     text: `Are you sure you want to change the status of this complaint to "${capitalizeWords(status)}"? This action cannot be undone.`,
  }
  
  );


  if (!confirm) return;


  try {
    // Optional: prevent invalid transitions at function level
    if (complaint.status === status) return;

    try {      await apiWithLoading.put(
        `/complaints/${complaint.id}`,
        { status, handler: userId }
      
      );
        toastSuccess(
  `Complaint status updated to ${capitalizeWords(status)}`,
  "The complaint status has been successfully updated."
);  
    } catch (err) {
     
       toastError(
        err.response?.data?.error || `Failed to update status to ${capitalizeWords(status)}`,
        "Status Update Error"
      );
      return; 
    }

      
    fetchComplaints(); // refresh table once
  } catch (err) {
    console.error(`Failed to update status to ${status}`, err);
  }
};

const isVideo = (url) => {
  if (!url) return false;
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"];
  const lower = url.toLowerCase().split("?")[0]; // strip query params
  return videoExtensions.some((ext) => lower.endsWith(ext));
};

  const columns = useMemo(
    () => [
      {
        header: "Resident",
        accessorFn: (row) =>
          `${capitalizeWords(row.resident?.f_name ?? "")} ${capitalizeWords(row.resident?.l_name ?? "")}`,
      },
      {
        header: "Resident ID",
        accessorFn: (row) => row.resident?.resident_id ?? '',
        size: 120,
      },
      {
        header: "Purok",
        accessorFn: (row) => row.resident?.purok?.name ?? "",
        Cell: ({ cell }) => capitalizeWords(cell.getValue() ?? ""),
        size: 100,
      },
      {
        header: "Complaint Type",
       accessorFn: (row) => row.complaint_type ?? "",
        Cell: ({ cell }) =>
          capitalizeWords((cell.getValue() ?? "").replace(/_/g, " ")),
      },
      {
        header: "Description",
        accessorKey: "description",
        Cell: ({ cell }) => (
          <Text size="sm" lineClamp={1} style={{ maxWidth: 200 }}>
            {cell.getValue() || "—"}
          </Text>
        ),
      },
      {
        header: "Status",
        accessorFn: (row) => row.status,
        Cell: ({ cell }) => (
          <Badge
            color={STATUS_COLOR[cell.getValue()] ?? "gray"}
            variant="light"
            radius="sm"
            tt="capitalize"
          >
            {(cell.getValue() ?? "").replace(/_/g, " ")}
          </Badge>
        ),
        size: 110,
      },
      {
        header: "Created At",
        accessorFn: (row) => row.created_at,
        Cell: ({ cell }) =>
          cell.getValue()
            ? new Date(cell.getValue()).toLocaleString()
            : "",
        size: 160,
      },
    {
  header: "Actions",
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
        <DropdownMenuContent align="end" className="w-44">

          {/* pending → on review */}
          <DropdownMenuItem
            className="text-yellow-600 focus:text-yellow-700 focus:bg-yellow-50 cursor-pointer"
            onClick={() => handleStatusUpdate(row.original.complaints || row.original, "on review")}
            disabled={status !== "pending"}
          >
            <Eye className="mr-2 h-4 w-4" />
            Review
          </DropdownMenuItem>

          {/* on review → on action */}
          <DropdownMenuItem
            className="text-green-600 focus:text-green-700 focus:bg-green-50 cursor-pointer"
            onClick={() => handleStatusUpdate(row.original.complaints || row.original, "on action")}
            disabled={status !== "on review"}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            On Action
          </DropdownMenuItem>

          {/* on action → resolved */}
          <DropdownMenuItem
            className="text-blue-600 focus:text-blue-700 focus:bg-blue-50 cursor-pointer"
            onClick={() => handleStatusUpdate(row.original.complaints || row.original, "resolved")}
            disabled={status !== "on action"}
          >
            <Archive className="mr-2 h-4 w-4" />
            Resolved
          </DropdownMenuItem>

          {/* on review → declined (false complaint) */}
          <DropdownMenuItem
            className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
            onClick={() => handleStatusUpdate(row.original.complaints || row.original, "declined")}
            disabled={status !== "on review"}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
  size: 80,
},
    ],
    []
  );

  return (
    <>
      {/* Stat Cards */}
   <div className="grid gap-3 mb-4 grid-cols-1 xl:grid-cols-2">
  
  <AreaMetricCard
    title="Over All Complaint"
    subtitle="Over All Complaint Has Been Resolved with this year."
    value=""
    data={Object.entries(monthlyCount ?? {}).map(([k, v]) => ({
      label:
        k === "null"
          ? "Unknown"
          : String(k).charAt(0).toUpperCase() + String(k).slice(1),
      value: Number(v) || 0,
      highlight: false,
    }))}
    formatter={(v) => `${v}`}
  />

  {/* Stat Cards */}
  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
    <StatCard
      label="Complaint Request"
      value={statusCounts.pending || "0"}
      status="pending"
      goalsAchieved={0}
      goalsTotal={6}
    />
    <StatCard
      label="Complaint Request"
      value={statusCounts.on_process || "0"}
      status="action"
      goalsAchieved={0}
      goalsTotal={6}
    />
    <StatCard
      label="Complaint Request"
      value={statusCounts.declined || "0"}
      status="decline"
      goalsAchieved={0}
      goalsTotal={6}
    />
    <StatCard
      label="Complaint Request"
      value={statusCounts.resolved || "0"}
      status="resolve"
      goalsAchieved={0}
      goalsTotal={6}
    />
  </div>

</div>

      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableStickyHeader: true,
          enableTopToolbar: true,
          enablePagination: true,
          enableExpanding: true,
            enableColumnFilters: true,   // ← add
  enableGlobalFilter: true,    // ← add
          mantineTableContainerProps: {
            style: {
              maxHeight: "calc(100vh - 320px)",
              overflowY: "auto",
            },
          },
       state: {
    isLoading: loading,
    columnFilters,             // ← add
  },
  onColumnFiltersChange: (updater) => {
    const next = typeof updater === "function" ? updater(columnFilters) : updater;
    setColumnFilters(next);
  },
          /* ─── Expanded detail panel ─────────────────────────────── */
          renderDetailPanel: ({ row }) => {
            const complaint = row.original;


          

            const CARD_SIZE = 500;

            return (
              <Box p="lg">
                <Flex justify="center" align="stretch" gap="lg">
                  {/* LEFT — Image */}
                 {/* LEFT — Image or Video */}
<Box
  style={{
    width: CARD_SIZE,
    height: CARD_SIZE,
    flexShrink: 0,
    border: "1px solid #e9ecef",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    background: "#f8f9fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {isVideo(complaint.image_url) ? (
    <video
      src={complaint.image_url}
      controls
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
      }}
    >
      Your browser does not support the video tag.
    </video>
  ) : (
    <Image
      src={complaint.image_url}
      alt="Complaint evidence"
      fit="contain"
      fallbackSrc="https://placehold.co/260x260?text=No+Image"
    />
  )}
</Box>

                  {/* RIGHT — Details Card */}
                  <Box
                    p="lg"
                    style={{
                      width: CARD_SIZE,
                      height: CARD_SIZE,
                      flexShrink: 0,
                      borderRadius: 10,
                      border: "1px solid #e9ecef",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Header */}
                    <Flex justify="space-between" align="center" mb="sm">
                      <Text size="sm" fw={700}>
                        Complaint Details
                      </Text>
                      <Badge
                        color={STATUS_COLOR[complaint.status] ?? "gray"}
                        variant="filled"
                        radius="sm"
                        size="sm"
                        tt="capitalize"
                      >
                        {(complaint.status ?? "").replace(/_/g, " ")}
                      </Badge>
                    </Flex>

                    <Divider mb="sm" />

                    <Stack spacing="sm" style={{ flex: 1, overflow: "hidden" }}>
                      {/* Complaint Type */}
                      <Box>
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                          Complaint Type
                        </Text>
                        <Text size="sm" fw={500} tt="capitalize">
                          {capitalizeWords((complaint.complaint_type ?? "").replace(/_/g, " ")) || "—"}
                        </Text>
                      </Box>

                      <Divider />

                      {/* Description */}
                      <Box style={{ flex: 1, overflow: "hidden" }}>
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                          Description
                        </Text>
                        <Text
                          size="sm"
                          fw={400}
                          style={{
                            lineHeight: 1.6,
                            wordBreak: "break-word",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {complaint.description || "—"}
                        </Text>
                      </Box>
                    </Stack>
                  </Box>
                </Flex>
              </Box>
            );
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
                  }}
                  onClick={() => table.setGlobalFilter(searchValue)}
                >
                  <Search size={16} />
                </ActionIcon>

                <TextInput
                  placeholder="Search complaints..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    table.setGlobalFilter(e.target.value);
                  }}
                  styles={{
                    input: {
                      height: INPUT_HEIGHT,
                      border: "none",
                    },
                  }}
                  style={{ width: 260 }}
                />
              </Flex>

              <ActionIcon
                variant="outline"
                onClick={fetchComplaints}
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
              >
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