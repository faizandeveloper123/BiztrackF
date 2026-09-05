"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Receipt,
  UserPlus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import healthcareService from "@/src/services/HealthcareService";
import {
  APPOINTMENT_STATUSES,
  type Appointment,
  type AppointmentCreate,
  type Doctor,
  type Patient,
} from "@/src/models/healthcare";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function HealthcareCalendarPage() {
  return (
    <DashboardLayout>
      <CalendarContent />
    </DashboardLayout>
  );
}

function CalendarContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "healthcare:appointments",
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [formData, setFormData] = useState<
    AppointmentCreate & { patient_id?: string }
  >({
    doctor_id: "",
    patient_id: "__none__",
    patient_name: "",
    patient_phone: "",
    appointment_date: "",
    start_time: "09:00",
    end_time: "09:30",
    status: "scheduled",
    notes: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const dateFrom = format(monthStart, "yyyy-MM-dd");
  const dateTo = format(monthEnd, "yyyy-MM-dd");

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

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await healthcareService.getAppointmentsCalendar({
        date_from: dateFrom,
        date_to: dateTo,
      });
      setAppointments(res.appointments);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load appointments",
      );
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const appointmentsByDate = React.useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of appointments) {
      const d = a.appointment_date;
      if (!map[d]) map[d] = [];
      map[d].push(a);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((x, y) => x.start_time.localeCompare(y.start_time));
    }
    return map;
  }, [appointments]);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const leadingBlanks = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const openDay = (d: Date) => {
    setSelectedDate(d);
    setDayDialogOpen(true);
  };

  const openAddFromCalendar = () => {
    const d = selectedDate || new Date();
    setEditingAppointment(null);
    setFormData({
      doctor_id: doctors[0]?.id ?? "",
      patient_id: "__none__",
      patient_name: "",
      patient_phone: "",
      appointment_date: format(d, "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "09:30",
      status: "scheduled",
      notes: "",
    });
    setDayDialogOpen(false);
    setFormOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditingAppointment(a);
    setFormData({
      doctor_id: a.doctor_id,
      patient_id: a.patient_id ?? "__none__",
      patient_name: a.patient_name,
      patient_phone: a.patient_phone ?? "",
      appointment_date: a.appointment_date,
      start_time: a.start_time,
      end_time: a.end_time,
      status: a.status,
      notes: a.notes ?? "",
    });
    setDayDialogOpen(false);
    setFormOpen(true);
  };

  const onPatientSelect = (value: string) => {
    if (value === "__none__") {
      setFormData((prev) => ({
        ...prev,
        patient_id: "__none__",
        patient_name: "",
        patient_phone: "",
      }));
    } else {
      const p = patients.find((x) => x.id === value);
      if (p) {
        setFormData((prev) => ({
          ...prev,
          patient_id: p.id,
          patient_name: p.full_name,
          patient_phone: p.phone ?? "",
        }));
      }
    }
  };

  const openDelete = (a: Appointment) => {
    setAppointmentToDelete(a);
    setDayDialogOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleComplete = async (a: Appointment) => {
    try {
      setActionLoadingId(a.id);
      await healthcareService.updateAppointment(a.id, { status: "completed" });
      toast.success("Appointment completed");
      loadAppointments();
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
            : "Update failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePrescription = (a: Appointment) => {
    router.push(`/healthcare/appointments?openPrescription=${a.id}`);
  };

  const handleViewPrescriptions = (a: Appointment) => {
    router.push(`/healthcare/appointments?viewPrescriptions=${a.id}`);
  };

  const handleGenerateInvoice = (a: Appointment) => {
    toast.info(`Generate invoice for ${a.patient_name} – coming soon`);
  };

  const handleAdmitPatient = (a: Appointment) => {
    toast.info(
      `Admit ${a.patient_name} – will appear in Admitted Patients. Full integration coming soon.`,
    );
  };

  const handleFormChange = (field: keyof AppointmentCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.doctor_id) {
      toast.error("Select a doctor");
      return;
    }
    const usePatientId =
      formData.patient_id && formData.patient_id !== "__none__";
    if (!usePatientId && !formData.patient_name?.trim()) {
      toast.error("Select a patient or enter patient name");
      return;
    }
    try {
      setSubmitLoading(true);
      const payload: AppointmentCreate = {
        doctor_id: formData.doctor_id,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        status: formData.status || "scheduled",
        notes: formData.notes || undefined,
      };
      if (usePatientId) {
        payload.patient_id = formData.patient_id;
      } else {
        payload.patient_id = editingAppointment ? "" : undefined;
        payload.patient_name = formData.patient_name!.trim();
        payload.patient_phone = formData.patient_phone?.trim() || undefined;
      }
      if (editingAppointment) {
        await healthcareService.updateAppointment(
          editingAppointment.id,
          payload,
        );
        toast.success("Appointment updated");
      } else {
        await healthcareService.createAppointment(payload);
        toast.success("Appointment created");
      }
      setFormOpen(false);
      loadAppointments();
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
    if (!appointmentToDelete) return;
    try {
      setDeleteLoading(true);
      await healthcareService.deleteAppointment(appointmentToDelete.id);
      toast.success("Appointment deleted");
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
      loadAppointments();
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

  const doctorName = (a: Appointment) =>
    [a.doctor_first_name, a.doctor_last_name].filter(Boolean).join(" ") || "—";

  const selectedDateStr = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : "";
  const dayAppointments = selectedDateStr
    ? (appointmentsByDate[selectedDateStr] ?? [])
    : [];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View and manage appointments by date</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/healthcare/appointments">
            <Edit className="w-4 h-4 mr-2" />
            Appointments list
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-px mb-2 min-w-[560px]">
                  {weekDays.map((wd) => (
                    <div
                      key={wd}
                      className="text-center text-sm font-medium text-gray-600 py-1"
                    >
                      {wd}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px border rounded-lg overflow-hidden bg-gray-100 min-w-[560px]">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} className="min-h-[100px] bg-white" />
                ))}
                {days.map((d) => {
                  const dateStr = format(d, "yyyy-MM-dd");
                  const dayAppts = appointmentsByDate[dateStr] ?? [];
                  const isCurrentMonth = isSameMonth(d, currentMonth);
                  const isTodayDate = isToday(d);
                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[100px] bg-white p-1 flex flex-col ${
                        !isCurrentMonth ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openDay(d)}
                        className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center ${
                          isTodayDate
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-200"
                        }`}
                      >
                        {format(d, "d")}
                      </button>
                      <div className="flex-1 overflow-y-auto space-y-0.5 mt-1">
                        {dayAppts.slice(0, 3).map((a) => (
                          <div
                            key={a.id}
                            className="text-xs truncate rounded px-1 py-0.5 bg-blue-50 text-blue-800 border border-blue-200"
                            title={`${a.start_time} ${a.patient_name} - ${doctorName(a)}`}
                          >
                            {a.start_time} {a.patient_name}
                          </div>
                        ))}
                        {dayAppts.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayAppts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, "EEEE, MMM d, yyyy") : "Day"}
            </DialogTitle>
            <DialogDescription>
              Appointments on this day. Add new or edit existing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {dayAppointments.length === 0 ? (
              <p className="text-sm text-gray-500">No appointments.</p>
            ) : (
              dayAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 rounded border bg-gray-50"
                >
                  <div>
                    <span className="font-medium">
                      {a.start_time} – {a.end_time}
                    </span>
                    <span className="ml-2">{a.patient_name}</span>
                    <span className="block text-sm text-gray-600">
                      {doctorName(a)} · {a.status}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate() && (
                        <DropdownMenuItem onClick={() => openEdit(a)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handlePrescription(a)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Assign prescription
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleViewPrescriptions(a)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View prescriptions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleGenerateInvoice(a)}
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        Generate invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAdmitPatient(a)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Admit patient
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {a.status !== "completed" && (
                        <DropdownMenuItem
                          onClick={() => handleComplete(a)}
                          disabled={actionLoadingId === a.id}
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          {actionLoadingId === a.id
                            ? "Updating..."
                            : "Complete"}
                        </DropdownMenuItem>
                      )}
                      {canDelete() && (
                        <DropdownMenuItem onClick={() => openDelete(a)}>
                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                          Cancel (delete)
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {canDelete() && (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => openDelete(a)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            {canCreate() && (
              <Button onClick={openAddFromCalendar}>
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add appointment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? "Edit Appointment" : "Add Appointment"}
            </DialogTitle>
            <DialogDescription>Patient and time details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(v) => handleFormChange("doctor_id", v)}
                disabled={doctors.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.first_name} {d.last_name}
                      {d.specialization ? ` (${d.specialization})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select
                value={formData.patient_id ?? "__none__"}
                onValueChange={onPatientSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    Walk-in (enter name below)
                  </SelectItem>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                      {p.phone ? ` – ${p.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formData.patient_id === "__none__" || !formData.patient_id) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient name</Label>
                  <Input
                    value={formData.patient_name ?? ""}
                    onChange={(e) =>
                      handleFormChange("patient_name", e.target.value)
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patient phone</Label>
                  <Input
                    value={formData.patient_phone ?? ""}
                    onChange={(e) =>
                      handleFormChange("patient_phone", e.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            )}
            {formData.patient_id &&
              formData.patient_id !== "__none__" &&
              formData.patient_name && (
                <p className="text-sm text-gray-600">
                  Patient: {formData.patient_name}
                  {formData.patient_phone ? ` (${formData.patient_phone})` : ""}
                </p>
              )}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.appointment_date}
                onChange={(e) =>
                  handleFormChange("appointment_date", e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    handleFormChange("start_time", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleFormChange("end_time", e.target.value)}
                />
              </div>
            </div>
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
                  {APPOINTMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes ?? ""}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                placeholder="Optional notes"
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
                : editingAppointment
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the appointment for{" "}
              {appointmentToDelete
                ? `${appointmentToDelete.patient_name}`
                : "this appointment"}
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
