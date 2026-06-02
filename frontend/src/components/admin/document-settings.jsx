"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { showDeleteConfirmation, showWarningAlert } from "@/utils/dialog";
import { toastSuccess,toastDelete } from "@/utils/toast";
import { apiWithLoading } from "@/lib/axios";

export default function DocumentTypeSettings() {
  const [types, setTypes] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadTypes = async () => {
    try {
      const { data } = await apiWithLoading.get("/document_types");
      setTypes(data || []);
    } catch {
      toastError("Failed to load document types", "An error occurred while fetching document types.");
    }
  };

  const addType = async () => {
    if (!name.trim()) return;

    const confirm = await showWarningAlert({
      title: "Add Document Type",
      text: "Are you sure you want to add this document type?",
    });

      if (!confirm) return;
    try {
      setLoading(true);
      await apiWithLoading.post("/document_types", { name, description });
      toastSuccess("Document type added", "The new document type was successfully added.");
      setName("");
      setDescription("");
      loadTypes();
    } catch {
      toastError("Failed to add document type", "An error occurred while adding the document type.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (doc) => {
    setEditingId(doc.id);
    setEditName(doc.name);
    setEditDescription(doc.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;

    const confirm = await showWarningAlert({
      title: "Update Document Type",
      text: "Are you sure you want to update this document type?",
    });

      if (!confirm) return;

    try {
      await apiWithLoading.put(`/document_types/${id}`, {
        name: editName,
        description: editDescription,
      });
      toastSuccess("Document type updated", "The document type was successfully updated.");
      cancelEdit();
      loadTypes();
    } catch {
      toastError("Failed to update document type", "An error occurred while updating the document type.");
    }
  };

  const deleteType = async (id) => {
    const confirm = await showDeleteConfirmation({
      title: "Delete Document Type",
      text: "Are you sure you want to delete this document type?",
    });

    if (!confirm) return;

    try {
      await apiWithLoading.delete(`/document_types/${id}`);
      toastDelete("Document type deleted", "The document type was successfully deleted.");
      loadTypes();
    } catch {
      toastError("Failed to delete document type", "An error occurred while deleting the document type.");
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Types
        </CardTitle>
        <CardDescription>
          Configure available document requests
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ADD */}
        <div className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input
              placeholder="Barangay Clearance"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button onClick={addType} disabled={loading} className="w-fit btn-primary">
            <Plus className="h-4 w-4 mr-1" />
            Add Document Type
          </Button>
        </div>

        {/* LIST */}
        <div className="border rounded-lg divide-y">
          {types.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              No document types added yet.
            </p>
          )}

{[...types].sort((a, b) => a.name.localeCompare(b.name)).map((d) => (            <div
              key={d.id}
              className="p-4 flex justify-between gap-4"
            >
              <div className="flex-1 space-y-1">
                {editingId === d.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <Textarea
                      value={editDescription}
                      onChange={(e) =>
                        setEditDescription(e.target.value)
                      }
                    />
                  </>
                ) : (
                  <>
                    <p className="font-medium">{d.name}</p>
                    {d.description && (
                      <p className="text-sm text-muted-foreground">
                        {d.description}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-1">
                {editingId === d.id ? (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => saveEdit(d.id)}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(d)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteType(d.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
