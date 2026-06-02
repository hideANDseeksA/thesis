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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { toastSuccess,toastError,toastDelete } from "@/utils/toast";
import { apiWithLoading } from "@/lib/axios";
import { showDeleteConfirmation,showWarningAlert } from "@/utils/dialog";

export default function PurokSettings() {
  const [puroks, setPuroks] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const loadPuroks = async () => {
    try {
      const { data } = await apiWithLoading.get("/purok");
      setPuroks(data || []);
    } catch {
      toastError("Failed to load puroks", "An error occurred while fetching puroks.");
    }
  };

  const addPurok = async () => {
    if (!name.trim()) return;


    const confirm = await showWarningAlert({
      title: "Add Purok",
      text: "Are you sure you want to add this purok?",
    });

    if (!confirm) return;

    try {
      setLoading(true);
      await apiWithLoading.post("/purok", { name });
      toastSuccess("Purok added", "The new purok was successfully added.");
      setName("");
      loadPuroks();
    } catch {
      toastError("Failed to add purok", "An error occurred while adding the purok.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (purok) => {
    setEditingId(purok.id);
    setEditName(purok.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;

    const confirm = await showWarningAlert({
      title: "Update Purok",
      text: "Are you sure you want to update this purok?",
    });

      if (!confirm) return;

    try {
      await apiWithLoading.put(`/purok/${id}`, { name: editName });
      toastSuccess("Purok updated", "The purok was successfully updated.");
      cancelEdit();
      loadPuroks();
    } catch {
      toastError("Failed to update purok", "An error occurred while updating the purok.");
    }
  };

  const deletePurok = async (id) => {
    const confirm = await showDeleteConfirmation({
      title: "Delete Purok",
      text: "Are you sure you want to delete this purok?",
    });

    if (!confirm) return;

    try {
      await apiWithLoading.delete(`/purok/${id}`);
      toastDelete("Purok deleted", "The purok was successfully deleted.");
      loadPuroks();
    } catch {
      toastError("Failed to delete purok", "An error occurred while deleting the purok.");
    }
  };

  useEffect(() => {
    loadPuroks();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Purok Settings
        </CardTitle>
        <CardDescription>Manage barangay puroks</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ADD */}
        <div className="space-y-2">
          <Label>Purok Name</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Purok 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="uppercase"
            />
            <Button onClick={addPurok} disabled={loading} className="btn-primary">
              <Plus className="h-4 w-4 mr-1" />
              Add Purok
            </Button>
          </div>
        </div>

        {/* LIST */}
        <div className="border rounded-lg divide-y">
          {puroks.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              No purok added yet.
            </p>
          )}

          {[...puroks].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
            <div
              key={p.id}
              className="px-4 py-2 flex items-center justify-between gap-2 uppercase"
            >
              {editingId === p.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-xs uppercase"
                />
              ) : (
                <span className="text-sm">{p.name}</span>
              )}

              <div className="flex gap-1">
                {editingId === p.id ? (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => saveEdit(p.id)}
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
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deletePurok(p.id)}
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
