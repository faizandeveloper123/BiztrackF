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
  UserPlus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
} from "lucide-react";
import healthcareService from "@/src/services/HealthcareService";
import {
  DAYS_OF_WEEK,
  type Doctor,
  type DoctorAvailabilitySlot,
  type DoctorCreate,
  type DoctorUpdate,
} from "@/src/models/healthcare";
import { toast } from "sonner";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function HealthcareDoctorsPage() {
  return (
    <DashboardLayout>
      <DoctorsContent />
    </DashboardLayout>
  );
}

function DoctorsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "healthcare:doctors",
  );
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [step, setStep] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState<DoctorCreate>({
    pmdc_number: "",
    phone: "",
    first_name: "",
    last_name: "",
    email: "",
    specialization: "",
    qualification: "",
    address: "",
    availability: [],
  });

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await healthcareService.getDoctors({
        search: search || undefined,
        page,
        limit,
      });
      setDoctors(res.doctors);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const openAdd = () => {
    setEditingDoctor(null);
    setFormData({
      pmdc_number: "",
      phone: "",
      first_name: "",
      last_name: "",
      email: "",
      specialization: "",
      qualification: "",
      address: "",
      availability: [],
    });
    setStep(1);
    setFormOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditingDoctor(d);
    setFormData({
      pmdc_number: d.pmdc_number,
      phone: d.phone,
      first_name: d.first_name,
      last_name: d.last_name,
      email: d.email ?? "",
      specialization: d.specialization ?? "",
      qualification: d.qualification ?? "",
      address: d.address ?? "",
      availability: d.availability?.length ? [...d.availability] : [],
    });
    setStep(1);
    setFormOpen(true);
  };

  const openDelete = (d: Doctor) => {
    setDoctorToDelete(d);
    setDeleteDialogOpen(true);
  };

  const handleFormChange = (
    field: keyof DoctorCreate,
    value: string | DoctorAvailabilitySlot[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addAvailabilitySlot = () => {
    setFormData((prev) => ({
      ...prev,
      availability: [
        ...prev.availability,
        { day: "Monday", start_time: "09:00", end_time: "17:00" },
      ],
    }));
  };

  const updateAvailabilitySlot = (
    index: number,
    field: keyof DoctorAvailabilitySlot,
    value: string,
  ) => {
    setFormData((prev) => {
      const next = [...prev.availability];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, availability: next };
    });
  };

  const removeAvailabilitySlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index),
    }));
  };

  const validateStep1 = () => {
    if (!formData.pmdc_number.trim()) {
      toast.error("PMDC number is required");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.first_name.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!formData.last_name.trim()) {
      toast.error("Last name is required");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) {
      setStep(3);
      return;
    }
    try {
      setSubmitLoading(true);
      const payload: DoctorCreate = {
        ...formData,
        email: formData.email || undefined,
        specialization: formData.specialization || undefined,
        qualification: formData.qualification || undefined,
        address: formData.address || undefined,
      };
      if (editingDoctor) {
        const updatePayload: DoctorUpdate = { ...payload };
        await healthcareService.updateDoctor(editingDoctor.id, updatePayload);
        toast.success("Doctor updated");
      } else {
        await healthcareService.createDoctor(payload);
        toast.success("Doctor added");
      }
      setFormOpen(false);
      loadDoctors();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Request failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!doctorToDelete) return;
    try {
      setDeleteLoading(true);
      await healthcareService.deleteDoctor(doctorToDelete.id);
      toast.success("Doctor deleted");
      setDeleteDialogOpen(false);
      setDoctorToDelete(null);
      loadDoctors();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Delete failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatAvailability = (availability: DoctorAvailabilitySlot[]) => {
    if (!availability?.length) return "—";
    return availability
      .map((a) => `${a.day} ${a.start_time}-${a.end_time}`)
      .join("; ");
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600">Manage doctors and their availability</p>
        </div>
        {canCreate() && (
        <Button onClick={openAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Doctor
        </Button>
      )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Filter by name, PMDC, phone, or specialization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctors</CardTitle>
          <CardDescription>
            {total} doctor{total !== 1 ? "s" : ""} total
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
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading...</div>
          ) : doctors.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No doctors yet. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PMDC</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono">{d.pmdc_number}</TableCell>
                    <TableCell>
                      {d.first_name} {d.last_name}
                    </TableCell>
                    <TableCell>{d.phone}</TableCell>
                    <TableCell>{d.specialization || "—"}</TableCell>
                    <TableCell>{d.qualification || "—"}</TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={formatAvailability(d.availability)}
                    >
                      {formatAvailability(d.availability)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdate() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(d)}
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
                          onClick={() => openDelete(d)}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? "Edit Doctor" : "Add Doctor"}
            </DialogTitle>
            <DialogDescription>
              Step {step} of 3:{" "}
              {step === 1
                ? "PMDC & contact"
                : step === 2
                  ? "Details"
                  : "Availability"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>PMDC Number</Label>
                  <Input
                    value={formData.pmdc_number}
                    onChange={(e) =>
                      handleFormChange("pmdc_number", e.target.value)
                    }
                    placeholder="e.g. 12345"
                    disabled={!!editingDoctor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                  />
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) =>
                        handleFormChange("first_name", e.target.value)
                      }
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) =>
                        handleFormChange("last_name", e.target.value)
                      }
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    placeholder="doctor@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) =>
                      handleFormChange("specialization", e.target.value)
                    }
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input
                    value={formData.qualification}
                    onChange={(e) =>
                      handleFormChange("qualification", e.target.value)
                    }
                    placeholder="e.g. MBBS, MD"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) =>
                      handleFormChange("address", e.target.value)
                    }
                    placeholder="Address"
                    rows={2}
                  />
                </div>
              </>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Availability</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAvailabilitySlot}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add slot
                  </Button>
                </div>
                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {formData.availability.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No slots. Click &quot;Add slot&quot; to add.
                    </p>
                  ) : (
                    formData.availability.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-2 p-2 border rounded-md"
                      >
                        <Select
                          value={slot.day}
                          onValueChange={(v) =>
                            updateAvailabilitySlot(idx, "day", v)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) =>
                            updateAvailabilitySlot(
                              idx,
                              "start_time",
                              e.target.value,
                            )
                          }
                          className="w-[100px]"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) =>
                            updateAvailabilitySlot(
                              idx,
                              "end_time",
                              e.target.value,
                            )
                          }
                          className="w-[100px]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAvailabilitySlot(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 3 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitLoading}>
                    {submitLoading
                      ? "Saving..."
                      : editingDoctor
                        ? "Update"
                        : "Create"}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Doctor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              {doctorToDelete
                ? `${doctorToDelete.first_name} ${doctorToDelete.last_name} (${doctorToDelete.pmdc_number})`
                : "this doctor"}
              ? This cannot be undone.
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
