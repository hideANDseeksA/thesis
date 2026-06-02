import { useEffect, useState } from "react";
import ResponsiveForm from "@/components/ResponsiveForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ShadCnRoute from "@/ShadCnRoute";
import { createResident, updateResident } from "../resident-managements/api/resident.api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showWarningAlert } from "@/utils/dialog";
import { toastError, toastSuccess } from "@/utils/toast";
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
    { name: "f_name", label: "First Name", type: "text", required: true, maxLength: 35 },
    { name: "m_name", label: "Middle Name", type: "text", required: false, maxLength: 35 },
    {name: "md_name", label: "Maiden Name", type: "text", required: false, maxLength: 35 },
    { name: "l_name", label: "Last Name", type: "text", required: true, maxLength: 35 },
    { name: "s_name", label: "Suffix Name", type: "text", required: false, maxLength: 35 },
    { name: "purok_id", label: "Purok", type: "select", required: true, options: purok },
    { name: "house_no", label: "House Number", type: "number", required: true },
    {
      name: "sex", label: "Sex", type: "select", required: true, options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
    },
    { name: "b_date", label: "Birth Date", type: "date", required: true },
    { name: "b_place", label: "Birth Place", type: "text", required: true, maxLength: 100 },
    {
      name: "blood_type",
      label: "Blood Type",
      type: "select",
      required: false,
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
      name: "civil_status", label: "Civil Status", type: "select", required: true, options: [
        { label: "Single", value: "single" },
        { label: "Married", value: "married" },
        { label: "Widow", value: "widow" },
        { label: "Separated", value: "Seperated" },
        { label: "Annulled", value: "annulled" },
        { label: "Co-Habitation", value: "co_habitation" },
      ],
    },
    {
      name: "emp_status", label: "Employment Status", type: "select", required: true, options: [
        { label: "Student", value: "student" },
        { label: "Retired", value: "retired" },
        { label: "Employed", value: "employed" },
        { label: "Unemployed", value: "unemployed" },
        { label: "Unknown", value: "unknown" },
      ],
    },
    {
      name: "citizenship", label: "Citizenship", type: "select", required: true, options: [
        { label: "Filipino", value: "filipino" },
        { label: "Foreign", value: "foreign" },
        { label: "Dual", value: "dual" },
      ],
    },
    { name: "occupation", label: "Occupation", type: "text", required: false, maxLength: 50 },
    {
      name: "voting_status", label: "Voting Status", type: "select", required: true, options: [
        { label: "Registered", value: "registered" },
        { label: "Unregistered", value: "unregistered" },
      ],
    },
    { name: "sector", label: "Sector", type: "text", required: false, maxLength: 100, placeholder: "e.g. Informal Settler, Indigenous, etc.(do not add n/a)" },
    { name: "contact_no", label: "Contact Number", type: "number", required: false, maxLength: 10, min: 10, prefix: "+63" },
    { name: "email_address", label: "Email Address", type: "email", placeholder: "example@domain.com" },
    { name: "citizenship_date", label: "Citizenship Date", type: "date", required: false },
  ];

  const defaultValues = isEdit
    ? {
      f_name: initialData.f_name || "",
      m_name: initialData.m_name || "",
      md_name: initialData.md_name || "",
      l_name: initialData.l_name || "",
      s_name: initialData.s_name || null,
      purok_id: initialData.purok_id || "",
      house_no: initialData.house_no || "",
      sex: initialData.sex || "",
      b_date: initialData.b_date
        ? new Date(initialData.b_date).toISOString().split("T")[0]
        : "",
      b_place: initialData.b_place || "",
      blood_type: initialData.blood_type || "",
      education: initialData.education || "",
      civil_status: initialData.civil_status || "",
      emp_status: initialData.emp_status || "",
      citizenship: initialData.citizenship || "",
      occupation: initialData.occupation || "",
      voting_status: initialData.voting_status || "",
      sector: initialData.sector || "",
      contact_no: initialData.contact_no || "",
      email_address: initialData.email_address || null,
      citizenship_date: initialData.citizenship_date
        ? new Date(initialData.citizenship_date).toISOString().split("T")[0]
        : "",
      remarks: initialData.remarks || null,
    }
    : {};

const handleSubmit = async (data) => {
  onClose();
  const confirmed = await showWarningAlert({
    title: isEdit ? "Confirm Update" : "Confirm Addition",
    text: isEdit
      ? "Are you sure you want to update this resident's information?"
      : "Are you sure you want to add this resident's information?",
    confirmText: isEdit ? "Yes, Update" : "Yes, Add",
    cancelText: "No, Cancel",
  });

  if (!confirmed) return;

  const payload = {
    ...data,
    b_date: data.b_date ? new Date(data.b_date).toISOString() : null,
  };

  try {
    if (isEdit) {
      await updateResident(initialData.id, payload);
    } else {
      await createResident(payload);
    }

    toastSuccess(
      isEdit ? "Resident Record Updated" : "Resident Record Created",
      isEdit
        ? "Resident information has been successfully updated."
        : "Resident information has been successfully recorded."
    );
    onSuccess?.();
  } catch (err) {
    // 409 only applies to create
    if (!isEdit && err.response?.status === 409) {
      const forceConfirmed = await showWarningAlert({
        title: "Duplicate Resident Detected",
        text: "A resident with the same name and birthdate already exists. Do you want to proceed anyway?",
        confirmText: "Yes, Proceed",
        cancelText: "No, Cancel",
      });

      if (!forceConfirmed) return;

      try {
        await createResident(payload, true); // force flag
        toastSuccess(
          "Resident Record Created",
          "Resident information has been successfully recorded."
        );
        onSuccess?.();
      } catch (forceErr) {
        console.error("Force create failed", forceErr);
        toastError(
          "Operation Failed",
           "Email address already exists. An error occurred while saving resident information."
        );
      }
    } else {
      console.error("Save failed", err);
      toastError(
        "Operation Failed",
        err.response?.data?.error || "An error occurred while saving resident information."
      );
    }
  }
};

  return (
    <Dialog open={opened} onOpenChange={onClose}>
      {/* Wider on large screens to fit 2-column layout */}
      <DialogContent className="sm:max-w-md lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Resident" : "Add Resident"}
          </DialogTitle>
        </DialogHeader>

        <ShadCnRoute>
          <ScrollArea className="max-h-[70vh] pr-4">
            <ResponsiveForm
              fields={fields}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              submitText={isEdit ? "Update Resident" : "Add Resident"}
              fieldClassName="grid grid-cols-1 lg:grid-cols-2 gap-x-4"
            />
          </ScrollArea>
        </ShadCnRoute>

      </DialogContent>
    </Dialog>
  );
}