import { useEffect, useState } from "react";
import ResponsiveForm from "@/components/ResponsiveForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ShadCnRoute from "@/ShadCnRoute";
import { showSuccessAlert } from "@/utils/swal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/axios";
export default function FormModal({
  opened,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const [purok, setpurok] = useState([]);

  const isEdit = Boolean(initialData);

  useEffect(() => {
    const fetchpurok = async () => {
      try {
        const res = await api.get("/purok");
        const options = res.data.map((item) => ({
          label: item.name,
          value: item.id,
        }));
        setpurok(options);
      } catch (err) {
        console.error("Failed to load purok types", err);
      }
    };

    if (opened) fetchpurok();
  }, [opened]);

  const fields = [
    { name: "f_name", label: "First Name", type: "text", required: true },
    { name: "m_name", label: "Middle Name", type: "text", required: false },
    { name: "l_name", label: "Last Name", type: "text", required: true },
    { name: "s_name", label: "Suffix Name", type: "text", required: false },
    { name: "purok_id", label: "Purok", type: "select", required: true, options: purok },
    { name: "house_no", label: "House Number", type: "number", required: true },
    {
      name: "sex", label: "Sex", type: "select", required: true, options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
    },
    { name: "b_date", label: "Birth Date", type: "date", required: true },
    { name: "b_place", label: "Birth Place", type: "text", required: true },
    {
  name: "blood_type",
  label: "Blood Type",
  type: "select",
  required: true,
  options: [
    { label: "A+", value: "a+" },
    { label: "A-", value: "a-" },
    { label: "B+", value: "b+" },
    { label: "B-", value: "b-" },
    { label: "AB+", value: "ab+" },
    { label: "AB-", value: "ab-" },
    { label: "O+", value: "o+" },
    { label: "O-", value: "o-" },
  ],
},

    {
      name: "education", label: "Education", type: "select", required: true, options: [
        { label: "None", value: "none" },
        { label: "Elementary", value: "elementary" },
        { label: "High School", value: "highschool" },
        { label: "College", value: "college" },
        { label: "Vocational", value: "vocational" },
        { label: "Post Graduate", value: "postgraduate" },
      ],
    },
    {
      name: "civil_status", label: "Civil Status ", type: "select", required: true, options: [
        { label: "Single", value: "single" },
        { label: "Married", value: "married" },
        { label: "Widow", value: "widow" },
        { label: "Separated", value: "Seperated" },
        { label: "Annulled", value: "annulled" },
        { label: "Co-Habitation", value: "co_habitation" },
      ],
    },

    {
      name: "emp_status", label: "Employment Status ", type: "select", required: true, options: [
        { label: "Student", value: "student" },
        { label: "Retired", value: "retired" },
        { label: "Employed", value: "employed" },
        { label: "Unemployed", value: "unemployed" },
        { label: "Unknown", value: "unknown" },

      ],
    },
    {
      name: "voting_status", label: "Voting Status", type: "select", required: true, options: [
        { label: "Registered", value: "registered" },
        { label: "Unregistered", value: "unregistered" },
      ],
    },
    { name: "sector", label: "Sector", type: "text", required: true },
    { name: "contact_no", label: "Contact Number", type: "text", required: true },
    { name: "email_address", label: "Email Address", type: "email", placeholder: "example@domain.com", required: true },
    { name: "remarks", label: "Remarks", type: "text", placeholder: "", required: false },
  ];

  // Use initialData for editing resident
  const defaultValues = isEdit
    ? {
      f_name: initialData.f_name || "",
      m_name: initialData.m_name || "",
      l_name: initialData.l_name || "",
      s_name: initialData.s_name || null,
      purok_id: initialData.purok_id || "",
      house_no: initialData.house_no || "",
      sex: initialData.sex || "",

      b_date: initialData.b_date
        ? new Date(initialData.b_date).toISOString().split("T")[0]
        : "",

      b_place: initialData.b_place || "",
      blood_type:initialData.blood_type || "",
      education: initialData.education || "",
      civil_status: initialData.civil_status || "",
      emp_status: initialData.emp_status || "",
      voting_status: initialData.voting_status || "",
      sector: initialData.sector || "",
      contact_no: initialData.contact_no || "",
      email_address: initialData.email_address || "",
      remarks: initialData.remarks || null,
    }
    : {};


  const handleSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        b_date: data.b_date
          ? new Date(data.b_date).toISOString()
          : null,
      };

      if (isEdit) {
        await api.put(`/api/residents/${initialData.id}`, payload);
      } else {
        await api.post("/api/residents", payload);
      }

      onClose();
      await showSuccessAlert(
        isEdit
          ? "Resident updated successfully"
          : "Resident uploaded successfully"
      );
      onSuccess?.();
    } catch (err) {
      console.error("Save failed", err);
    }
  };


  return (
    <Dialog open={opened} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Resident" : "Upload Resident"}
          </DialogTitle>
        </DialogHeader>

        <ShadCnRoute>
          <ScrollArea className="max-h-[70vh] pr-4">
            <ResponsiveForm
              fields={fields}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              submitText={isEdit ? "Update Resident" : "Upload Resident"}
            />
          </ScrollArea>
        </ShadCnRoute>


      </DialogContent>
    </Dialog>
  );
}
