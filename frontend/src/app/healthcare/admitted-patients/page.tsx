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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Receipt,
  Plus,
  X,
} from "lucide-react";
import healthcareService from "@/src/services/HealthcareService";
import {
  ADMISSION_STATUSES,
  type Admission,
  type AdmissionCreate,
  type AdmissionUpdate,
  type Doctor,
  type Patient,
} from "@/src/models/healthcare";
import { toast } from "sonner";
import Link from "next/link";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function AdmittedPatientsPage() {
  return (
    <DashboardLayout>
      <AdmittedPatientsContent />
    </DashboardLayout>
  );
}

function AdmittedPatientsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "healthcare:admissions",
  );
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [doctorFilter, setDoctorFilter] = useState<string>("__all__");
  const [patientFilter, setPatientFilter] = useState<string>("__all__");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const limit = 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const [formOpen, setFormOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(
    null,
  );
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [admissionToDelete, setAdmissionToDelete] = useState<Admission | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [billAdmission, setBillAdmission] = useState<Admission | null>(null);
  const [billLineItems, setBillLineItems] = useState<
    Array<{ description: string; amount: number }>
  >([{ description: "", amount: 0 }]);
  const [billLoading, setBillLoading] = useState(false);

  const [formData, setFormData] = useState<AdmissionCreate>({
    patient_id: "",
    doctor_id: "",
    admit_date: "",
    ward: "",
    room_or_bed: "",
    diagnosis: "",
    notes: "",
    status: "admitted",
  });

  const loadDoctors = useCallback(async () => {
    try {
      const res = await healthcareService.getDoctors({ limit: 500 });
      setDoctors(res.doctors);
    } catch {
      toast.error("Failed to load doctors");
    }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const res = await healthcareService.getPatients({ limit: 500 });
      setPatients(res.patients);
    } catch {
      toast.error("Failed to load patients");
    }
  }, []);

  const loadAdmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await healthcareService.getAdmissions({
        search: search || undefined,
        page,
        limit,
        status:
          statusFilter && statusFilter !== "__all__" ? statusFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        doctor_id:
          doctorFilter && doctorFilter !== "__all__" ? doctorFilter : undefined,
        patient_id:
          patientFilter && patientFilter !== "__all__"
            ? patientFilter
            : undefined,
      });
      setAdmissions(res.admissions);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load admissions");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    page,
    statusFilter,
    dateFrom,
    dateTo,
    doctorFilter,
    patientFilter,
  ]);

  useEffect(() => {
    loadDoctors();
    loadPatients();
  }, [loadDoctors, loadPatients]);

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

  const openAdd = () => {
    setEditingAdmission(null);
    setFormData({
      patient_id: "",
      doctor_id: "",
      admit_date: new Date().toISOString().slice(0, 10),
      ward: "",
      room_or_bed: "",
      diagnosis: "",
      notes: "",
      status: "admitted",
    });
    setFormOpen(true);
  };

  const openEdit = (a: Admission) => {
    setEditingAdmission(a);
    setFormData({
      patient_id: a.patient_id,
      doctor_id: a.doctor_id,
      admit_date: a.admit_date,
      discharge_date: a.discharge_date ?? "",
      ward: a.ward,
      room_or_bed: a.room_or_bed ?? "",
      diagnosis: a.diagnosis ?? "",
      notes: a.notes ?? "",
      status: a.status,
    });
    setFormOpen(true);
  };

  const openDelete = (a: Admission) => {
    setAdmissionToDelete(a);
    setDeleteDialogOpen(true);
  };

  const openBill = (a: Admission) => {
    setBillAdmission(a);
    setBillLineItems([{ description: "", amount: 0 }]);
    setBillDialogOpen(true);
  };

  const handleFormChange = (field: keyof AdmissionCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.patient_id ||
      !formData.doctor_id ||
      !formData.admit_date ||
      !formData.ward.trim()
    ) {
      toast.error("Patient, doctor, admit date and ward are required");
      return;
    }
    try {
      setSubmitLoading(true);
      const payload: AdmissionCreate = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        admit_date: formData.admit_date,
        ward: formData.ward.trim(),
        room_or_bed: formData.room_or_bed?.trim() || undefined,
        diagnosis: formData.diagnosis?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        status: formData.status || "admitted",
        discharge_date: formData.discharge_date
          ? formData.discharge_date
          : undefined,
      };
      if (editingAdmission) {
        const updatePayload: AdmissionUpdate = {
          doctor_id: payload.doctor_id,
          discharge_date: payload.discharge_date
            ? payload.discharge_date
            : undefined,
          status: payload.status,
          ward: payload.ward,
          room_or_bed: payload.room_or_bed,
          diagnosis: payload.diagnosis,
          notes: payload.notes,
        };
        await healthcareService.updateAdmission(
          editingAdmission.id,
          updatePayload,
        );
        toast.success("Admission updated");
      } else {
        await healthcareService.createAdmission(payload);
        toast.success("Admission added");
      }
      setFormOpen(false);
      loadAdmissions();
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
    if (!admissionToDelete) return;
    try {
      setDeleteLoading(true);
      await healthcareService.deleteAdmission(admissionToDelete.id);
      toast.success("Admission deleted");
      setDeleteDialogOpen(false);
      setAdmissionToDelete(null);
      loadAdmissions();
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

  const addBillLine = () => {
    setBillLineItems((prev) => [...prev, { description: "", amount: 0 }]);
  };

  const updateBillLine = (
    index: number,
    field: "description" | "amount",
    value: string | number,
  ) => {
    setBillLineItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === "amount" ? Number(value) || 0 : value,
      };
      return next;
    });
  };

  const removeBillLine = (index: number) => {
    setBillLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateBill = async () => {
    if (!billAdmission) return;
    const valid = billLineItems.filter(
      (r) => (r.description || "").trim() && r.amount > 0,
    );
    if (valid.length === 0) {
      toast.error("Add at least one line with description and amount");
      return;
    }
    try {
      setBillLoading(true);
      await healthcareService.createAdmissionInvoice(billAdmission.id, {
        line_items: valid.map((r) => ({
          description: r.description.trim(),
          amount: r.amount,
        })),
      });
      toast.success("Bill created");
      setBillDialogOpen(false);
      setBillAdmission(null);
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
            : "Failed to create bill";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setBillLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hospital Admitted Patients
          </h1>
          <p className="text-gray-600">Manage admissions and generate bills</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/healthcare/payments">Hospital Payments</Link>
          </Button>
          {canCreate() && (
            <Button onClick={openAdd}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admission
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter by status, dates, patient or doctor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Input
              placeholder="Search patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {ADMISSION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All doctors</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.first_name} {d.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All patients</SelectItem>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admissions</CardTitle>
          <CardDescription>
            {total} admission{total !== 1 ? "s" : ""} total
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
          ) : admissions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No admissions yet. Add one to track in-patient stays.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Admit date</TableHead>
                  <TableHead>Discharge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ward / Room</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.patient_name ?? a.patient_id}
                    </TableCell>
                    <TableCell>
                      {a.doctor_first_name || a.doctor_last_name
                        ? `${a.doctor_first_name ?? ""} ${a.doctor_last_name ?? ""}`.trim()
                        : a.doctor_id}
                    </TableCell>
                    <TableCell>{a.admit_date}</TableCell>
                    <TableCell>{a.discharge_date ?? "—"}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell>
                      {a.ward}
                      {a.room_or_bed ? ` / ${a.room_or_bed}` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openBill(a)}
                      >
                        <Receipt className="w-4 h-4 mr-1" />
                        Generate bill
                      </Button>
                      {canUpdate() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(a)}
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
                          onClick={() => openDelete(a)}
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingAdmission ? "Edit Admission" : "Add Admission"}
            </DialogTitle>
            <DialogDescription>In-patient stay details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingAdmission && (
              <>
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(v) => handleFormChange("patient_id", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(v) => handleFormChange("doctor_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.first_name} {d.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Admit date</Label>
                <Input
                  type="date"
                  value={formData.admit_date}
                  onChange={(e) =>
                    handleFormChange("admit_date", e.target.value)
                  }
                  disabled={!!editingAdmission}
                />
              </div>
              {editingAdmission && (
                <div className="space-y-2">
                  <Label>Discharge date</Label>
                  <Input
                    type="date"
                    value={formData.discharge_date ?? ""}
                    onChange={(e) =>
                      handleFormChange("discharge_date", e.target.value)
                    }
                  />
                </div>
              )}
            </div>
            {editingAdmission && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleFormChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMISSION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ward</Label>
                <Input
                  value={formData.ward}
                  onChange={(e) => handleFormChange("ward", e.target.value)}
                  placeholder="Ward"
                />
              </div>
              <div className="space-y-2">
                <Label>Room / Bed</Label>
                <Input
                  value={formData.room_or_bed ?? ""}
                  onChange={(e) =>
                    handleFormChange("room_or_bed", e.target.value)
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input
                value={formData.diagnosis ?? ""}
                onChange={(e) => handleFormChange("diagnosis", e.target.value)}
                placeholder="Optional"
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
                : editingAdmission
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this admission for{" "}
              {admissionToDelete?.patient_name ?? "this patient"}? This cannot
              be undone.
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

      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Generate Bill</DialogTitle>
            <DialogDescription>
              Add line items for{" "}
              {billAdmission?.patient_name ?? "this admission"}. Invoice will be
              created and visible under Hospital Payments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {billLineItems.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) =>
                    updateBillLine(idx, "description", e.target.value)
                  }
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Amount"
                  value={line.amount || ""}
                  onChange={(e) =>
                    updateBillLine(idx, "amount", e.target.value)
                  }
                  className="w-28"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBillLine(idx)}
                  disabled={billLineItems.length <= 1}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBillLine}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add line
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBill} disabled={billLoading}>
              {billLoading ? "Creating..." : "Create invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
