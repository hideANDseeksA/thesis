import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getPrenatalRecordById } from "@/api/pregant";
import MaternalHealthRecord from "../maternal-form-template";

export default function PrintPrenatalPage() {
  const { id } = useParams();
  const { state } = useLocation();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const fetchId = state?.record?.id ?? id;
      if (!fetchId) throw new Error("No record ID");

      // Always fetch fresh — router state won't have health_record.resident
      const res = await getPrenatalRecordById(fetchId);
      const r = res?.data ?? res;

      if (!r) throw new Error("Empty response");

      setRecord({
        ...r,
        details:
          typeof r.details === "string"
            ? JSON.parse(r.details)
            : r.details ?? {},
      });
    } catch (err) {
      console.error("Failed to load prenatal record:", err);
      setError("Could not load the record. Please go back and try again.");
    } finally {
      setLoading(false);
    }
  };

  load();
}, [id]);
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Arial, sans-serif", fontSize: "14pt", color: "#555" }}>
        Loading record…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Arial, sans-serif", gap: 12 }}>
        <span style={{ fontSize: "14pt", color: "red" }}>{error}</span>
        <button onClick={() => window.history.back()} style={{ padding: "6px 18px", cursor: "pointer" }}>
          ← Go Back
        </button>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Arial, sans-serif", fontSize: "14pt", color: "#555" }}>
        Record not found.
      </div>
    );
  }

  return <MaternalHealthRecord record={record} />;
}