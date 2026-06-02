    "use client";

    import { useEffect, useState } from "react";
    import axios from "axios";
    import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    } from "@/components/ui/card";
    import { Input } from "@/components/ui/input";
    import { Button } from "@/components/ui/button";
    import { Label } from "@/components/ui/label";
    import { Spinner } from "@/components/ui/spinner";
    import { capitalizeWords } from "@/lib/capitalizer";
    import { getItem,clearStorage } from "@/utils/localStorageHelper";
    import { useAuth } from "@/auth/AuthContext";
    import { getCertificateTemplate } from "@/api/user.certificate";
import { toastSuccess } from "@/utils/toast";
import { apiWithLoading } from "@/lib/axios";
    

    const READ_ONLY_FIELDS = ["full_name", "age", "sex", "purok", "birthdate"];

    export default function DynamicForm({
    templateId,
    transactionId,
    submitLabel = "Generate",
    cancelLabel = "Cancel",
    onSubmit,
    onCancel,
    }) {
    const [template, setTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resident_tempt = getItem("Temp_Resident");
    const resident_id = getItem("resident_id");

    const getFullName = (resident) => {
        if (!resident) return "";
        return [resident.f_name, resident.m_name, resident.l_name, resident.s_name]
        .filter(Boolean)
        .join(" ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    useEffect(() => {
        if (!templateId) return;

        getCertificateTemplate(templateId)
        .then((data) => {
            setTemplate(data);

            const initialData = {};
            data.fields.forEach((field) => {
            switch (field.name) {
                case "full_name":
                initialData[field.name] = getFullName(resident_tempt);
                break;
                case "age":
                initialData[field.name] = resident_tempt?.age ?? "";
                break;
                case "sex":
                initialData[field.name] = resident_tempt?.sex
                    ? resident_tempt.sex.charAt(0).toUpperCase() +
                    resident_tempt.sex.slice(1)
                    : "";
                break;
                case "purok":
                initialData[field.name] = resident_tempt?.purok?.name ?? "";
                break;
                case "civil_status":
                initialData[field.name] = resident_tempt?.civil_status ?? "";
                break;
                case "birthdate":
                initialData[field.name] = resident_tempt?.b_date
                    ? new Date(resident_tempt.b_date).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })
                    : "";
                break;
                default:
                initialData[field.name] = "";
            }
            });

            setFormData(initialData);
        })
        .catch((err) => console.error("Failed to load template:", err))
        .finally(() => setLoading(false));
    }, [templateId]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
        const response = await apiWithLoading.post(
            `/generator/transactions/generate-certificate`,
            {
            resident_id: resident_tempt?.id,
            certificate_id: templateId,
            details: formData,
            handler: resident_id,
            },
            { responseType: "blob" }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
            "download",
            `${template?.template_name || "certificate"}.docx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        onSubmit?.(formData, template);
        clearStorage("Temp_Resident");
        toastSuccess("Certificate has been generated successfully!","Your certificate was generated and downloaded successfully.");
        } catch (error) {
        toastError("Generate failed:", error.response?.data || error.message);
        } finally {
        setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData(
        Object.fromEntries(Object.keys(formData).map((key) => [key, ""]))
        );
        onCancel?.();
    };

    if (loading) {
        return (
        <div className="flex min-h-screen items-center justify-center">
            <Spinner />
        </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-gray-10">
        <Card className="w-full max-w-md sm:max-w-lg lg:max-w-xl max-h-[85vh] flex flex-col">
            <CardHeader className="shrink-0">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">
                {capitalizeWords(template.template_name)}
            </CardTitle>
            </CardHeader>

            <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
            >
            <CardContent className="flex-1 overflow-auto scrollbar-hide space-y-4">
                {template.fields.map((field) => (
                <div key={field.name} className="flex flex-col">
                    <Label htmlFor={field.name} className="mb-1">
                    {capitalizeWords(field.label)}
                    </Label>

                    <Input
                    id={field.name}
                    name={field.name}
                    type={field.type || "text"}
                    required={field.required}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    disabled={READ_ONLY_FIELDS.includes(field.name)}
                    />

                    {field.helperText && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {field.helperText}
                    </p>
                    )}
                </div>
                ))}
            </CardContent>

            <CardFooter className="shrink-0 flex gap-2 border-t pt-4">
                <Button
                type="submit"
                className="flex-1 btn-primary"
                disabled={isSubmitting}
                >
                {isSubmitting ? (
                    <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    Generating...
                    </span>
                ) : (
                    submitLabel
                )}
                </Button>

                <Button
                type="button"
                variant="ghost"
                className="flex-1 text-red-500"
                onClick={handleCancel}
                disabled={isSubmitting}
                >
                {cancelLabel}
                </Button>
            </CardFooter>
            </form>
        </Card>
        </div>
    );
    }