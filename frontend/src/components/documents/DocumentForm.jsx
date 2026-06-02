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
import { toastSuccess } from "@/utils/toast";
import { showWarningAlert } from "@/utils/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiWithLoading } from "@/lib/axios";
export default function FormModal({
  opened,
  onClose,
  onSuccess,
  initialData = null, 
}) {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const isEdit = Boolean(initialData);

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const res = await apiWithLoading.get("/document_types");
        const options = res.data.map((item) => ({
          label: item.name,
          value: item.id,
        }));
        setDocumentTypes(options);
      } catch (err) {
        console.error("Failed to load document types", err);
      }
    };

    if (opened) fetchDocumentTypes();
  }, [opened]);

  const fields = [
    {
      name: "title",
      label: "Document Title",
      type: "text",
      required: true,
    },
    {
      name: "document_type_id",
      label: "Document Type",
      type: "select",
      required: true,
      options: documentTypes,
    },
    {
      name: "purpose",
      label: "Purpose",
      type: "textarea",
      required: true,
    },
    {
      name: "issued_date",
      label: "Issued Date",
      type: "datetime-local",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Active", value: "Active" },
        { label: "Archive", value: "Archive" },
      ],
    },
    {
      name: "pin",
      label: "Pin",
      type: "select",
      required: true,
      options: [
          { label: "Unpin", value: "false" },
        { label: "Pin", value: "true" },
      
      ],
    },

    {
      name: "is_public",
      label: "Public View",
      type: "select",
      required: true,
      options: [
        { label: "No", value: "false" },
        { label: "Yes", value: "true" },
   
      ],
    },
    {
      name: "file",
      label: "Document File (.pdf)",
      type: "file",
      accept: ".pdf",   
      required: !isEdit, 
    },
  ];

  const defaultValues = isEdit
    ? {
        title: initialData.title,
        document_type_id: initialData.document_type_id,
        purpose: initialData.purpose,
        issued_date: initialData.issued_date?.slice(0, 16),
        status: initialData.status,
        pin: initialData.pin ? "true" : "false",
        is_public: initialData.is_public ? "true" : "false",
      }
    : {};

  const handleSubmit = async (data) => {
    onClose();
    try {
      const formData = new FormData();

      formData.append("title", data.title);
      formData.append("document_type_id", data.document_type_id);
      formData.append("purpose", data.purpose);
      formData.append(
        "issued_date",
        new Date(data.issued_date).toISOString()
      );
      formData.append("status", data.status);
      formData.append("pin", data.pin === "true");
      formData.append("is_public", data.is_public === "true");
      
      const title = isEdit ? "Update this document" : "Add this document";
      const description = isEdit        ? "Are you sure you want to update this document? This action cannot be undone."
        : "Are you sure you want to add this document?";



      if (data.file) {
        formData.append("file", data.file);
      }
setIsConfirming(true); 
      const result = await showWarningAlert({
        title,
        text: description
      });

      if (!result) {
        onClose();
      return;
      }
      setIsConfirming(false); 

      if (isEdit) {
        await apiWithLoading.put(`/documents/${initialData.id}`, formData);
        toastSuccess("Document updated successfully","The document has been updated.");
      } else {
        await apiWithLoading.post("/documents", formData);
        toastSuccess("Document added successfully","The document has been added.");
      }

      
      
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
            {isEdit ? "Edit Document" : "Upload Document"}
          </DialogTitle>
        </DialogHeader>

       <ShadCnRoute>
  <ScrollArea className="max-h-[70vh] pr-4">
    <ResponsiveForm
      fields={fields}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitText={isEdit ? "Update Document" : "Upload Document"}
    />
  </ScrollArea>
</ShadCnRoute>

      </DialogContent>
    </Dialog>
  );
}
