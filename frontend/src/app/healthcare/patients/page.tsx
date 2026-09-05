"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  UserPlus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  History,
} from "lucide-react";
import healthcareService from "@/src/services/HealthcareService";
import type { Patient, PatientCreate } from "@/src/models/healthcare";
import { toast } from "sonner";
import Link from "next/link";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function HealthcarePatientsPage() {
  return (
    <DashboardLayout>
      <PatientsContent />
    </DashboardLayout>
  );
}

function PatientsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "healthcare:patients",
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState<PatientCreate>({
    full_name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    address: "",
    notes: "",
  });

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await healthcareService.getPatients({
        search: search || undefined,
        page,
        limit,
      });
      setPatients(res.patients);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const openAdd = () => {
    setEditingPatient(null);
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      date_of_birth: "",
      address: "",
      notes: "",
    });
    setFormOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditingPatient(p);
    setFormData({
      full_name: p.full_name,
      phone: p.phone ?? "",
      email: p.email ?? "",
      date_of_birth: p.date_of_birth ?? "",
      address: p.address ?? "",
      notes: p.notes ?? "",
    });
    setFormOpen(true);
  };

  const openDelete = (p: Patient) => {
    setPatientToDelete(p);
    setDeleteDialogOpen(true);
  };

  const handleFormChange = (field: keyof PatientCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    try {
      setSubmitLoading(true);
      const payload: PatientCreate = {
        full_name: formData.full_name.trim(),
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        date_of_birth: formData.date_of_birth?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };
      if (editingPatient) {
        await healthcareService.updatePatient(editingPatient.id, payload);
        toast.success("Patient updated");
      } else {
        await healthcareService.createPatient(payload);
        toast.success("Patient added");
      }
      setFormOpen(false);
      loadPatients();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response
          ? (e.response as { data?: { detail?: string } }).data?.detail
          : e instanceof Error
            ? e.message
            : "Request failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;
    try {
      setDeleteLoading(true);
      await healthcareService.deletePatient(patientToDelete.id);
      toast.success("Patient deleted");
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
      loadPatients();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response
          ? (e.response as { data?: { detail?: string } }).data?.detail
          : e instanceof Error
            ? e.message
            : "Delete failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Manage patients for appointments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/healthcare/appointments">Appointments</Link>
          </Button>
          {canCreate() && (
            <Button onClick={openAdd}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Filter by name, phone, or email</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
          <CardDescription>
            {total} patient{total !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {total > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading...</div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No patients yet. Add one to use when creating appointments.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date of birth</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell>{p.email || "—"}</TableCell>
                    <TableCell>{p.date_of_birth || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/healthcare/patient-history?patient=${p.id}`}
                        >
                          <History className="w-4 h-4 mr-1" />
                          View history
                        </Link>
                      </Button>
                      {canUpdate() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(p)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {canDelete() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openDelete(p)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Edit Patient" : "Add Patient"}
            </DialogTitle>
            <DialogDescription>
              Patient details for appointments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleFormChange("full_name", e.target.value)}
                placeholder="Patient full name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone ?? ""}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Input
                type="date"
                value={formData.date_of_birth ?? ""}
                onChange={(e) =>
                  handleFormChange("date_of_birth", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address ?? ""}
                onChange={(e) => handleFormChange("address", e.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes ?? ""}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading
                ? "Saving..."
                : editingPatient
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              {patientToDelete?.full_name ?? "this patient"}? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
