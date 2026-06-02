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
import { Search, MoreHorizontal, CheckCircle, XCircle, FileText, CheckCheck } from "lucide-react";
import { capitalizeWords } from "@/lib/capitalizer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import DynamicForm from "@/components/forms/CertificateGenerator";
import { getItem } from "@/utils/localStorageHelper";
import { useAuth } from "@/auth/AuthContext";
import { api, apiWithLoading } from "@/lib/axios";
import { getSocket } from "@/utils/socket";
import {showWarningAlert} from "@/utils/dialog";

const AppointmentTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const adminId = getItem("resident_id");
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { resident_data } = useAuth();
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState("");

    const INPUT_HEIGHT = 36;

    /* ================= FETCH ================= */
    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await apiWithLoading.get(`/transactions/appointment-test`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to load appointments", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // ✅ Real-time: refetch when a new transaction is submitted
    useEffect(() => {
        let socket;

        try {
            socket = getSocket();
        } catch (err) {
            console.warn("Socket not available:", err.message);
            return;
        }

        const handleNewTransaction = () => {
            fetchAppointments();
        };

        const handleUpdatedTransaction = ({ id, status }) => {
            if (status === "declined" || status === "cancelled") {
                setData((prev) => prev.filter((row) => row.id !== id));
            } else {
                setData((prev) =>
                    prev.map((row) =>
                        row.id === id ? { ...row, status } : row
                    )
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
    const handleDecline = async (appointment) => {
        try {
            if (!appointment?.id || !appointment?.resident_id) {
                throw new Error("Invalid appointment data");
            }

            await apiWithLoading.patch(
                `/transactions/${appointment.id}`,
                { status: "declined", handled_by_id: adminId }
            );

            fetchAppointments();
        } catch (err) {
            console.error("Failed to decline appointment", err);
        }
    };

    const handleComplete = async (appointment) => {

        const confirm = await showWarningAlert({
            title: "Update Status",
            text: "Are you sure you want to mark this appointment as completed ? This action cannot be undone.",
            confirmText: "Yes, complete it",
        });
        if (!confirm) return;

        try {
            if (!appointment?.id || !appointment?.resident_id) {
                throw new Error("Invalid appointment data");
            }

            await apiWithLoading.patch(
                `/transactions/${appointment.id}`,
                { status: "completed", handled_by_id: adminId }
            );

            fetchAppointments();
        } catch (err) {
            console.error("Failed to complete appointment", err);
        }
    };

    /* ================= TABLE COLUMNS ================= */
    const columns = useMemo(
        () => [
            {
                header: "Resident",
                accessorFn: (row) =>
                    `${capitalizeWords(row.resident?.f_name ?? "")} ${capitalizeWords(
                        row.resident?.l_name ?? ""
                    )}`,
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
                    const status = cell.getValue();
                    const colorMap = {
                        pending:    { bg: "#fff3e0", text: "#e65100" },
                        approved:   { bg: "#e8f5e9", text: "#2e7d32" },
                        "on process": { bg: "#f3e5f5", text: "#6a1b9a" },
                        completed:  { bg: "#e3f2fd", text: "#1565c0" },
                        declined:   { bg: "#ffebee", text: "#c62828" },
                    };
                    const config = colorMap[status] ?? { bg: "#f5f5f5", text: "#616161" };
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
                            {status}
                        </Text>
                    );
                },
            },
            {
                header: "Appointment Date",
                accessorKey: "appointment_date",
                Cell: ({ cell }) =>
                    cell.getValue()
                        ? new Date(cell.getValue()).toLocaleString()
                        : "Not scheduled",
            },
            {
                header: "Actions",
                Cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <ActionIcon variant="subtle">
                                <MoreHorizontal size={16} />
                            </ActionIcon>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                                disabled={["approved","completed","on process"].includes(row.original.status)}
                                className="text-green-600 cursor-pointer"
                                onClick={() => {
                                    setSelectedAppointment(row.original);
                                    setApproveModalOpen(true);
                                }}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                disabled={["approved","completed","on process"].includes(row.original.status)}
                                onClick={() => handleDecline(row.original)}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Decline
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="text-blue-600 cursor-pointer"
                                disabled={row.original.status !== "on process"}
                                onClick={() => handleComplete(row.original)}
                            >
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Completed
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                disabled={!["approved", "on process"].includes(row.original.status)}
                                onClick={() => {
                                    setEditingAppointment(row.original);
                                    setIsEditModalOpen(true);
                                }}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Generate
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    return (
        <>
            {/* ================= APPROVE MODAL ================= */}
            {approveModalOpen && selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
                        <Text fw={600} size="lg">
                            Schedule Appointment
                        </Text>

                        <Text size="sm" c="dimmed">
                            Select appointment date and time
                        </Text>

                        <TextInput
                            type="datetime-local"
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                        />

                        <Flex justify="flex-end" gap="sm">
                            <Button
                                variant="default"
                                onClick={() => {
                                    setApproveModalOpen(false);
                                    setSelectedAppointment(null);
                                    setAppointmentDate("");
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                color="green"
                                disabled={!appointmentDate}
                                onClick={async () => {
                                    try {
                                        await apiWithLoading.patch(
                                            `/transactions/${selectedAppointment.id}`,
                                            {
                                                status: "approved",
                                                appointment_date: appointmentDate,
                                                handled_by_id: adminId,
                                                handler_name: resident_data?.resident_name,
                                            }
                                        );

                                        setApproveModalOpen(false);
                                        setSelectedAppointment(null);
                                        setAppointmentDate("");
                                        fetchAppointments();
                                    } catch (err) {
                                        console.error("Failed to approve appointment", err);
                                    }
                                }}
                            >
                                Approve & Schedule
                            </Button>
                        </Flex>
                    </div>
                </div>
            )}

            {/* ================= EDIT MODAL ================= */}
            {isEditModalOpen && editingAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <DynamicForm
                        transactionId={editingAppointment.id}
                        templateId={editingAppointment.certificate_id}
                        initialData={editingAppointment.details || {}}
                        submitLabel="Generate"
                        onSubmit={async () => {
                            try {
                                await apiWithLoading.patch(
                                    `/transactions/${editingAppointment.id}`,
                                    { status: "on process", handled_by_id: adminId }
                                );
                            } catch (err) {
                                console.error("Failed to update status to on process", err);
                            } finally {
                                setIsEditModalOpen(false);
                                setEditingAppointment(null);
                                fetchAppointments();
                            }
                        }}
                        onCancel={() => {
                            setIsEditModalOpen(false);
                            setEditingAppointment(null);
                        }}
                    />
                </div>
            )}

            {/* ================= TABLE ================= */}
            <ReusableMantineTable
                columns={columns}
                data={data}
                state={{ isLoading: loading }}
                renderToolbar={({ table }) => (
                    <Flex p="md" justify="space-between">
                        <Flex gap="xs" align="center">
                            <Flex
                                align="center"
                                style={{ border: "1px solid #ced4da", borderRadius: 4 }}
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
                                    placeholder="Search appointments..."
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
                                onClick={fetchAppointments}
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

export default AppointmentTable;