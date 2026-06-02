import ResponsiveForm from "@/components/ResponsiveForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ShadCnRoute from "@/ShadCnRoute";
import { showWarningAlert } from "@/utils/dialog";
import { toastSuccess, toastError } from "@/utils/toast";
import { createCertificate, updateCertificate } from "./certficate";

export default function FormModal({
  opened,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const isEdit = Boolean(initialData);

  const fields = [
    {
      name: "template_name",
      label: "Certificate Name",
      type: "text",
      required: true,
    },
    {
      name: "template_requirements",
      label: "Certificate Requirements",
      type: "textarea",
      required: true,
    },
    {
      name: "template_price",
      label: "Price",
      type: "number",
      required: true,
    },
    {
      name: "requestType",
      label: "Request Type",
      type: "select",
      options: [
        { label: "Online Request", value: "true" },
        { label: "Appointment Only", value: "false" },
      ],
      required: true,
    },
    {
      name: "public_view",
      label: "Public View",
      type: "select",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
      required: true,
    },
    {
      name: "template",
      label: "Document File (.docx)",
      type: "file",
      accept: ".docx",
      required: !isEdit,
    },
  ];

  const defaultValues = isEdit
    ? {
        template_name: initialData.template_name,
        template_requirements: initialData.template_requirements,
        template_price: initialData.template_price,
        requestType: String(initialData.requestType),
        public_view: String(initialData.public_view),
      }
    : {};

  const handleSubmit = async (data) => {
    onClose();
    const confirm = await showWarningAlert({
      title: isEdit ? "Confirm Update" : "Confirm Creation",
      text: isEdit
        ? "Are you sure you want to update this certificate?"
        : "Are you certain you want to proceed with creating this certificate?",
    });

    if (!confirm) return;

    try {
      const formData = new FormData();

      formData.append("template_name", data.template_name);
      formData.append("template_requirements", data.template_requirements);
      formData.append("template_price", data.template_price);
      formData.append("requestType", data.requestType === "true");
      formData.append("public_view", data.public_view === "true");

      if (data.template) {
        formData.append("template", data.template);
      }

      if (isEdit) {
        await updateCertificate(initialData.id, formData);
      } else {
        await createCertificate(formData);
      }

      if (isEdit) {
        toastSuccess(
          "Certificate updated successfully",
          "The certificate has been updated."
        );
      } else {
        toastSuccess(
          "Certificate created successfully",
          "The certificate has been created."
        );
      }
      onSuccess?.();
    } catch (err) {
      console.error("Save failed", err);
      toastError(
        "Failed to save certificate",
        "An error occurred while saving the certificate."
      );
    }
  };

  return (
    <Dialog open={opened} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Certificate" : "Upload Certificate"}
          </DialogTitle>
        </DialogHeader>

        <ShadCnRoute>
          <ResponsiveForm
            fields={fields}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitText={isEdit ? "Update Certificate" : "Upload Certificate"}
          />
        </ShadCnRoute>
      </DialogContent>
    </Dialog>
  );
}