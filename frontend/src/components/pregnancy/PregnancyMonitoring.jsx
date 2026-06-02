/**
 * PregnancyMonitoringTable.jsx
 *
 * Changes from original:
 * - Adds a "Print Record" button in the table's row actions that navigates to
 *   /print/prenatal/:id, which should render <MaternalHealthRecord record={...} />
 * - Passes the full record via router state so no extra API call is needed on
 *   the print page (the print page can also re-fetch by id as a fallback).
 * - Adds "Mark as Delivered" row action using patchPrenatalRecord.
 */

import { useEffect, useMemo, useState } from "react";
import { ActionIcon, TextInput, Tooltip } from "@mantine/core";
import { IconRefresh, IconPrinter } from "@tabler/icons-react";
import { MRT_ToggleFiltersButton, MRT_ShowHideColumnsButton } from "mantine-react-table";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ReusableMantineTable from "./../ReusableTable";
import {
  getPrenatalRecord,
  deletePrenatalRecord,
  getMissedVisit,
  patchPrenatalRecord,          // ← import the patch helper
} from "@/api/pregant";
import { showDeleteConfirmation,showWarningAlert } from "@/utils/dialog";
import { toastDelete, toastSuccess } from "@/utils/toast";

import { PrenatalSummaryCards } from "./SummaryCards";
import { DetailPanel } from "./DetailPanel";
import { useColumns, mapRecordToFormData } from "./columns";

const INPUT_HEIGHT = 36;

const PregnancyMonitoringTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [missedVisits, setMissedVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await getPrenatalRecord();
      const raw = Array.isArray(res) ? res : res.records ?? res.data ?? [];
      setData(
        raw.map((r) => ({
          ...r,
          details:
            typeof r.details === "string"
              ? JSON.parse(r.details)
              : r.details ?? {},
        }))
      );
    } catch (err) {
      console.error("Failed to load pregnancy monitoring records", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissedVisits = async () => {
    try {
      const res = await getMissedVisit();
      setMissedVisits(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load missed visits", err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchMissedVisits();
  }, []);

  // ─── Row actions ──────────────────────────────────────────────────────────

  const openEditDialog = (record) => {
    navigate(`/pregnancy-form/${record.id}`, {
      state: { recordId: record.id, initialForm: mapRecordToFormData(record) },
    });
  };

  /** Mark a patient as delivered via PATCH /pregnancy-monitoring/:id */
  const handleDeliveredClick = async (row) => {
    const patientName = row?.details?.patientInfo?.name || "this patient";

    const confirmed = await showWarningAlert({
      title: "Mark as Delivered",
      message: `Mark ${patientName} as delivered? This will update the record status.`,
      confirmLabel: "Mark Delivered",
      color: "green",
    });
    if (!confirmed) return;

    try {
      await patchPrenatalRecord(row.id, "delivered");   // ← correct function
      toastSuccess("Status updated", `${patientName} has been marked as delivered.`);
      fetchRecords();
    } catch (err) {
      console.error("Failed to update delivered status", err);
    }
  };

  /** Navigate to the dedicated print page, passing full record in router state */
  const openPrintView = (record) => {
    navigate(`/print/prenatal/${record.id}`, {
      state: { record },
    });
  };

  const handleDeleteClick = async (row) => {
    const confirmed = await showDeleteConfirmation({
      title: "Delete Pregnancy Record",
      message: `Are you sure you want to delete the pregnancy record for ${
        row?.details?.patientInfo?.name || "this patient"
      }? This action cannot be undone.`,
    });
    if (!confirmed) return;

    await deletePrenatalRecord(row.id);
    toastDelete(
      "Pregnancy record deleted",
      "Successfully deleted the pregnancy record."
    );
    fetchRecords();
  };

  // ─── Columns (pass all action handlers) ──────────────────────────────────

  const columns = useColumns(
    data,
    openEditDialog,
    handleDeleteClick,
    openPrintView,
    handleDeliveredClick,   // ← pass delivered handler to columns
  );

  // ─── Summary card data ────────────────────────────────────────────────────

  const monthlyData = useMemo(() => {
    const counts = {};
    data.forEach((r) => {
      const date = new Date(r.created_at);
      if (isNaN(date)) return;
      const month = date.toLocaleString("default", { month: "short" });
      counts[month] = (counts[month] || 0) + 1;
    });
    return counts;
  }, [data]);

  const totalMissed        = missedVisits.reduce((s, r) => s + (r.total_missed   ?? 0), 0);
  const patientsWithMissed = missedVisits.filter((r) => r.total_missed   > 0).length;
  const totalIncoming      = missedVisits.reduce((s, r) => s + (r.total_incoming ?? 0), 0);
  const overdueRows        = missedVisits.filter((r) => r.total_missed   > 0);
  const incomingRows       = missedVisits.filter((r) => r.total_incoming > 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <PrenatalSummaryCards
        totalRecords={data.length}
        monthlyData={monthlyData}
        totalMissed={totalMissed}
        patientsWithMissed={patientsWithMissed}
        totalIncoming={totalIncoming}
        overdueRows={overdueRows}
        incomingRows={incomingRows}
      />

      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableStickyHeader: true,
          enableTopToolbar: true,
          enablePagination: true,
          enableExpanding: true,
          mantineTableContainerProps: {
            style: { maxHeight: "calc(100vh - 320px)", overflowY: "auto" },
          },
          state: { isLoading: loading },
          renderDetailPanel: ({ row }) => (
            <DetailPanel row={row} onEdit={openEditDialog} />
          ),
        }}
        renderToolbar={({ table }) => (
          <div className="flex p-3 justify-start">
            <div className="flex gap-2 items-center">
              <div className="flex items-center border border-border rounded overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring">
                <ActionIcon
                  variant="subtle"
                  style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
                  className="border-r border-border"
                  onClick={() => table.setGlobalFilter(searchValue)}
                >
                  <Search size={16} />
                </ActionIcon>
                <TextInput
                  placeholder="Search pregnancy records..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    table.setGlobalFilter(e.target.value);
                  }}
                  styles={{ input: { height: INPUT_HEIGHT, border: "none" } }}
                  style={{ width: 260 }}
                />
              </div>
              <ActionIcon
                variant="outline"
                onClick={fetchRecords}
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
              >
                <IconRefresh size={16} />
              </ActionIcon>
              <MRT_ToggleFiltersButton table={table} />
              <MRT_ShowHideColumnsButton table={table} />
            </div>
          </div>
        )}
      />
    </>
  );
};

export default PregnancyMonitoringTable;