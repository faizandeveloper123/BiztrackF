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
  CalendarPlus,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  FileText,
  Receipt,
  UserPlus,
  CheckCircle,
  XCircle,
  Plus,
  X,
  Download,
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
  type Prescription,
  type PrescriptionCreate,
  type PrescriptionItem,
  type PrescriptionItemType,
} from "@/src/models/healthcare";
import { PatientSearch } from "@/src/components/ui/patient-search";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function HealthcareAppointmentsPage() {
  return (
    <DashboardLayout>
      <AppointmentsContent />
    </DashboardLayout>
  );
}

function AppointmentsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "healthcare:appointments",
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [doctorFilter, setDoctorFilter] = useState<string>("__all__");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const limit = 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [prescriptionAppointment, setPrescriptionAppointment] =
    useState<Appointment | null>(null);
  const [prescriptionFormData, setPrescriptionFormData] =
    useState<PrescriptionCreate | null>(null);
  const [prescriptionSubmitLoading, setPrescriptionSubmitLoading] =
    useState(false);
  const [viewPrescriptionsOpen, setViewPrescriptionsOpen] = useState(false);
  const [viewPrescriptionsAppointment, setViewPrescriptionsAppointment] =
    useState<Appointment | null>(null);
  const [prescriptionsList, setPrescriptionsList] = useState<Prescription[]>(
    [],
  );
  const [prescriptionsListLoading, setPrescriptionsListLoading] =
    useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceAppointment, setInvoiceAppointment] =
    useState<Appointment | null>(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState<
    Array<{ description: string; amount: number }>
  >([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoicePrescriptionsLoading, setInvoicePrescriptionsLoading] =
    useState(false);

  const [formData, setFormData] = useState<
    AppointmentCreate & { patient_id?: string }
  >({
    doctor_id: "",
    patient_id: "",
    patient_name: "",
    patient_phone: "",
    appointment_date: "",
    start_time: "09:00",
    end_time: "09:30",
    status: "scheduled",
    notes: "",
  });

  const loadDoctors = useCallback(async () => {
    try {
      const res = await healthcareService.getDoctors({ limit: 500 });
      setDoctors(res.doctors);
    } catch {
      toast.error("Failed to load doctors");
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await healthcareService.getAppointments({
        search: search || undefined,
        page,
        limit,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        doctor_id:
          doctorFilter && doctorFilter !== "__all__" ? doctorFilter : undefined,
      });
      setAppointments(res.appointments);
      setTotal(res.total);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load appointments",
      );
    } finally {
      setLoading(false);
    }
  }, [search, page, dateFrom, dateTo, doctorFilter]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const searchParams = useSearchParams();
  const openPrescriptionId = searchParams.get("openPrescription");
  const viewPrescriptionsId = searchParams.get("viewPrescriptions");
  const urlParamHandled = React.useRef(false);
  useEffect(() => {
    if (urlParamHandled.current) return;
    if (openPrescriptionId && doctors.length > 0) {
      urlParamHandled.current = true;
      healthcareService
        .getAppointment(openPrescriptionId)
        .then((apt) => {
          openPrescriptionForm(apt);
          window.history.replaceState({}, "", "/healthcare/appointments");
        })
        .catch(() => toast.error("Appointment not found"));
    } else if (viewPrescriptionsId) {
      urlParamHandled.current = true;
      healthcareService
        .getAppointment(viewPrescriptionsId)
        .then((apt) => {
          openViewPrescriptions(apt);
          window.history.replaceState({}, "", "/healthcare/appointments");
        })
        .catch(() => toast.error("Appointment not found"));
    }
  }, [openPrescriptionId, viewPrescriptionsId, doctors.length]);

  const openAdd = () => {
    setEditingAppointment(null);
    setSelectedPatient(null);
    const today = format(new Date(), "yyyy-MM-dd");
    setFormData({
      doctor_id: doctors[0]?.id ?? "",
      patient_id: "",
      patient_name: "",
      patient_phone: "",
      appointment_date: today,
      start_time: "09:00",
      end_time: "09:30",
      status: "scheduled",
      notes: "",
    });
    setFormOpen(true);
  };

  const openEdit = async (a: Appointment) => {
    setEditingAppointment(a);
    setFormData({
      doctor_id: a.doctor_id,
      patient_id: a.patient_id ?? "",
      patient_name: a.patient_name,
      patient_phone: a.patient_phone ?? "",
      appointment_date: a.appointment_date,
      start_time: a.start_time,
      end_time: a.end_time,
      status: a.status,
      notes: a.notes ?? "",
    });
    if (a.patient_id) {
      try {
        const p = await healthcareService.getPatient(a.patient_id);
        setSelectedPatient(p);
      } catch {
        setSelectedPatient(null);
      }
    } else {
      setSelectedPatient(null);
    }
    setFormOpen(true);
  };

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      setFormData((prev) => ({
        ...prev,
        patient_id: patient.id,
        patient_name: patient.full_name,
        patient_phone: patient.phone ?? "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        patient_id: "",
        patient_name: "",
        patient_phone: "",
      }));
    }
  };

  const openDelete = (a: Appointment) => {
    setAppointmentToDelete(a);
    setDeleteDialogOpen(true);
  };

  const handleFormChange = (field: keyof AppointmentCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.doctor_id) {
      toast.error("Select a doctor");
      return;
    }
    if (!formData.patient_id?.trim()) {
      toast.error("Select a patient");
      return;
    }
    if (
      !formData.appointment_date ||
      !formData.start_time ||
      !formData.end_time
    ) {
      toast.error("Date and time are required");
      return;
    }
    try {
      setSubmitLoading(true);
      const payload: AppointmentCreate = {
        doctor_id: formData.doctor_id,
        patient_id: formData.patient_id,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        status: formData.status || "scheduled",
        notes: formData.notes || undefined,
      };
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

  const openPrescriptionForm = (a: Appointment) => {
    setPrescriptionAppointment(a);
    setPrescriptionFormData({
      appointment_id: a.id,
      doctor_id: a.doctor_id,
      patient_name: a.patient_name,
      patient_phone: a.patient_phone ?? "",
      prescription_date: a.appointment_date,
      notes: "",
      items: [
        {
          type: "medicine",
          medicine_name: "",
          dosage: "",
          frequency: "",
          duration: "",
        },
      ],
    });
    setPrescriptionDialogOpen(true);
  };

  const loadPrescriptionsForAppointment = useCallback(
    async (appointmentId: string) => {
      try {
        setPrescriptionsListLoading(true);
        const res = await healthcareService.getPrescriptions({
          appointment_id: appointmentId,
          limit: 100,
        });
        setPrescriptionsList(res.prescriptions);
      } catch {
        toast.error("Failed to load prescriptions");
        setPrescriptionsList([]);
      } finally {
        setPrescriptionsListLoading(false);
      }
    },
    [],
  );

  const openViewPrescriptions = (a: Appointment) => {
    setViewPrescriptionsAppointment(a);
    setViewPrescriptionsOpen(true);
    loadPrescriptionsForAppointment(a.id);
  };

  const addPrescriptionItem = (type: PrescriptionItemType = "medicine") => {
    setPrescriptionFormData((prev) => {
      if (!prev) return prev;
      const newItem: PrescriptionItem =
        type === "medicine"
          ? {
              type: "medicine",
              medicine_name: "",
              dosage: "",
              frequency: "",
              duration: "",
            }
          : type === "vitals"
            ? {
                type: "vitals",
                vital_name: "",
                vital_value: "",
                vital_unit: "",
              }
            : { type: "test", test_name: "", test_instructions: "" };
      return { ...prev, items: [...prev.items, newItem] };
    });
  };

  const updatePrescriptionItem = (
    index: number,
    field: keyof PrescriptionItem,
    value: string,
  ) => {
    setPrescriptionFormData((prev) => {
      if (!prev) return prev;
      const next = [...prev.items];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, items: next };
    });
  };

  const setPrescriptionItemType = (
    index: number,
    type: PrescriptionItemType,
  ) => {
    setPrescriptionFormData((prev) => {
      if (!prev) return prev;
      const next = [...prev.items];
      const base =
        type === "medicine"
          ? {
              type: "medicine" as const,
              medicine_name: "",
              dosage: "",
              frequency: "",
              duration: "",
            }
          : type === "vitals"
            ? {
                type: "vitals" as const,
                vital_name: "",
                vital_value: "",
                vital_unit: "",
              }
            : { type: "test" as const, test_name: "", test_instructions: "" };
      next[index] = base;
      return { ...prev, items: next };
    });
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionFormData((prev) => {
      if (!prev || prev.items.length <= 1) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  };

  const handlePrescriptionSubmit = async () => {
    if (!prescriptionFormData) return;
    if (!prescriptionFormData.patient_name.trim()) {
      toast.error("Patient name is required");
      return;
    }
    const validItems = prescriptionFormData.items.filter((i) => {
      const t = i.type || "medicine";
      if (t === "medicine") return (i.medicine_name ?? "").trim();
      if (t === "vitals") return (i.vital_name ?? "").trim();
      return (i.test_name ?? "").trim();
    });
    if (validItems.length === 0) {
      toast.error("Add at least one item (medicine, vitals, or test)");
      return;
    }
    try {
      setPrescriptionSubmitLoading(true);
      await healthcareService.createPrescription({
        ...prescriptionFormData,
        items: validItems.map((i) => {
          const t = i.type || "medicine";
          if (t === "medicine")
            return {
              type: "medicine" as const,
              medicine_name: (i.medicine_name ?? "").trim(),
              dosage: i.dosage?.trim() || undefined,
              frequency: i.frequency?.trim() || undefined,
              duration: i.duration?.trim() || undefined,
            };
          if (t === "vitals")
            return {
              type: "vitals" as const,
              vital_name: (i.vital_name ?? "").trim(),
              vital_value: i.vital_value?.trim() || undefined,
              vital_unit: i.vital_unit?.trim() || undefined,
            };
          return {
            type: "test" as const,
            test_name: (i.test_name ?? "").trim(),
            test_instructions: i.test_instructions?.trim() || undefined,
          };
        }),
      });
      toast.success("Prescription created");
      setPrescriptionDialogOpen(false);
      setPrescriptionAppointment(null);
      setPrescriptionFormData(null);
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
            : "Failed to create prescription";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setPrescriptionSubmitLoading(false);
    }
  };

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const blob =
        await healthcareService.getPrescriptionDownload(prescriptionId);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `prescription-${prescriptionId}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Prescription downloaded");
    } catch {
      toast.error("Failed to download prescription");
    }
  };

  const handleDeletePrescription = async (rx: Prescription) => {
    try {
      await healthcareService.deletePrescription(rx.id);
      toast.success("Prescription deleted");
      if (viewPrescriptionsAppointment)
        loadPrescriptionsForAppointment(viewPrescriptionsAppointment.id);
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
    }
  };

  const openInvoiceDialog = async (a: Appointment) => {
    setInvoiceAppointment(a);
    setInvoiceDialogOpen(true);
    setInvoicePrescriptionsLoading(true);
    setInvoiceLineItems([]);
    try {
      const res = await healthcareService.getPrescriptions({
        appointment_id: a.id,
        limit: 100,
      });
      const items: Array<{ description: string; amount: number }> = [];
      for (const rx of res.prescriptions) {
        for (const it of rx.items) {
          const t = it.type || "medicine";
          if (t === "medicine" && (it.medicine_name ?? "").trim())
            items.push({
              description: `Medicine: ${it.medicine_name}${it.dosage ? ` (${it.dosage})` : ""}`,
              amount: 0,
            });
          else if (t === "vitals" && (it.vital_name ?? "").trim())
            items.push({
              description: `Vitals: ${it.vital_name}${it.vital_value != null ? ` ${it.vital_value}` : ""}${it.vital_unit ? ` ${it.vital_unit}` : ""}`,
              amount: 0,
            });
          else if (t === "test" && (it.test_name ?? "").trim())
            items.push({
              description: `Test: ${it.test_name}${it.test_instructions ? ` – ${it.test_instructions}` : ""}`,
              amount: 0,
            });
        }
      }
      if (items.length === 0)
        items.push({ description: "Consultation / General", amount: 0 });
      setInvoiceLineItems(items);
    } catch {
      setInvoiceLineItems([
        { description: "Consultation / General", amount: 0 },
      ]);
    } finally {
      setInvoicePrescriptionsLoading(false);
    }
  };

  const addInvoiceLineItem = () => {
    setInvoiceLineItems((prev) => [...prev, { description: "", amount: 0 }]);
  };

  const updateInvoiceLineItem = (
    index: number,
    field: "description" | "amount",
    value: string | number,
  ) => {
    setInvoiceLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeInvoiceLineItem = (index: number) => {
    setInvoiceLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceAppointment) return;
    const valid = invoiceLineItems.filter((i) => (i.description ?? "").trim());
    if (valid.length === 0) {
      toast.error("Add at least one line item with description");
      return;
    }
    try {
      setInvoiceLoading(true);
      const res = await healthcareService.createAppointmentInvoice(
        invoiceAppointment.id,
        {
          line_items: valid.map((i) => ({
            description: i.description.trim(),
            amount: Number(i.amount) || 0,
          })),
        },
      );
      toast.success(`Invoice ${res.invoice_number} created`);
      setInvoiceDialogOpen(false);
      setInvoiceAppointment(null);
      setInvoiceLineItems([]);
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
            : "Failed to create invoice";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleAdmitPatient = (a: Appointment) => {
    toast.info(
      `Admit ${a.patient_name} – will appear in Admitted Patients. Full integration coming soon.`,
    );
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

  const formatDate = (d: string) => {
    try {
      return format(
        typeof d === "string" && d.length === 10 ? parseISO(d) : new Date(d),
        "MMM d, yyyy",
      );
    } catch {
      return d;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">
            Manage patient appointments and scheduling
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/healthcare/patients">Patients</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/healthcare/calendar">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Link>
          </Button>
          {canCreate() && (
            <Button onClick={openAdd}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add Appointment
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Filter by patient, date range, or doctor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Patient name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[140px]"
            />
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[140px]"
            />
            <Select
              value={doctorFilter || "__all__"}
              onValueChange={setDoctorFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All doctors" />
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            {total} appointment{total !== 1 ? "s" : ""} total
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
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No appointments yet. Add one or open Calendar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{formatDate(a.appointment_date)}</TableCell>
                    <TableCell>
                      {a.start_time} – {a.end_time}
                    </TableCell>
                    <TableCell>
                      {a.patient_name}
                      {a.patient_phone ? ` (${a.patient_phone})` : ""}
                    </TableCell>
                    <TableCell>{doctorName(a)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          a.status === "completed"
                            ? "text-green-600"
                            : a.status === "cancelled" || a.status === "no_show"
                              ? "text-red-600"
                              : "text-amber-600"
                        }
                      >
                        {a.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4 mr-1" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate() && (
                            <DropdownMenuItem onClick={() => openEdit(a)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => openPrescriptionForm(a)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Assign prescription
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openViewPrescriptions(a)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View prescriptions
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openInvoiceDialog(a)}
                          >
                            <Receipt className="w-4 h-4 mr-2" />
                            Generate invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAdmitPatient(a)}
                          >
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
                            <DropdownMenuItem
                              onClick={() => {
                                setAppointmentToDelete(a);
                                setDeleteDialogOpen(true);
                              }}
                            >
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
            <PatientSearch
              value={selectedPatient}
              onSelect={handlePatientSelect}
              placeholder="Search by name, phone..."
              label="Patient"
              required
            />
            {!selectedPatient && (
              <p className="text-xs text-gray-500">
                <Link href="/healthcare/patients" className="underline">
                  Add patients
                </Link>{" "}
                first, then search here.
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

      <Dialog
        open={prescriptionDialogOpen}
        onOpenChange={setPrescriptionDialogOpen}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign prescription</DialogTitle>
            <DialogDescription>
              {prescriptionAppointment
                ? `Prescription for ${prescriptionAppointment.patient_name} (${formatDate(prescriptionAppointment.appointment_date)})`
                : "Add prescription"}
            </DialogDescription>
          </DialogHeader>
          {prescriptionFormData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient name</Label>
                  <Input
                    value={prescriptionFormData.patient_name}
                    onChange={(e) =>
                      setPrescriptionFormData((p) =>
                        p ? { ...p, patient_name: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patient phone</Label>
                  <Input
                    value={prescriptionFormData.patient_phone ?? ""}
                    onChange={(e) =>
                      setPrescriptionFormData((p) =>
                        p ? { ...p, patient_phone: e.target.value } : p,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={prescriptionFormData.prescription_date}
                    onChange={(e) =>
                      setPrescriptionFormData((p) =>
                        p ? { ...p, prescription_date: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Select
                    value={prescriptionFormData.doctor_id}
                    onValueChange={(v) =>
                      setPrescriptionFormData((p) =>
                        p ? { ...p, doctor_id: v } : p,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={prescriptionFormData.notes ?? ""}
                  onChange={(e) =>
                    setPrescriptionFormData((p) =>
                      p ? { ...p, notes: e.target.value } : p,
                    )
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Items (Medicine / Vitals / Tests)</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPrescriptionItem("medicine")}
                    >
                      Medicine
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPrescriptionItem("vitals")}
                    >
                      Vitals
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPrescriptionItem("test")}
                    >
                      Test
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {prescriptionFormData.items.map((item, idx) => {
                    const typ = (item.type ||
                      "medicine") as PrescriptionItemType;
                    return (
                      <div key={idx} className="p-2 border rounded space-y-2">
                        <div className="flex gap-2 items-center flex-wrap">
                          <Select
                            value={typ}
                            onValueChange={(v) =>
                              setPrescriptionItemType(
                                idx,
                                v as PrescriptionItemType,
                              )
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="medicine">Medicine</SelectItem>
                              <SelectItem value="vitals">Vitals</SelectItem>
                              <SelectItem value="test">Test</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePrescriptionItem(idx)}
                            disabled={prescriptionFormData.items.length <= 1}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {typ === "medicine" && (
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <Input
                              placeholder="Medicine"
                              value={item.medicine_name ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "medicine_name",
                                  e.target.value,
                                )
                              }
                              className="col-span-3"
                            />
                            <Input
                              placeholder="Dosage"
                              value={item.dosage ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "dosage",
                                  e.target.value,
                                )
                              }
                              className="col-span-2"
                            />
                            <Input
                              placeholder="Frequency"
                              value={item.frequency ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "frequency",
                                  e.target.value,
                                )
                              }
                              className="col-span-2"
                            />
                            <Input
                              placeholder="Duration"
                              value={item.duration ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "duration",
                                  e.target.value,
                                )
                              }
                              className="col-span-2"
                            />
                          </div>
                        )}
                        {typ === "vitals" && (
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <Input
                              placeholder="Name (e.g. BP, Temp)"
                              value={item.vital_name ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "vital_name",
                                  e.target.value,
                                )
                              }
                              className="col-span-3"
                            />
                            <Input
                              placeholder="Value"
                              value={item.vital_value ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "vital_value",
                                  e.target.value,
                                )
                              }
                              className="col-span-2"
                            />
                            <Input
                              placeholder="Unit"
                              value={item.vital_unit ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "vital_unit",
                                  e.target.value,
                                )
                              }
                              className="col-span-2"
                            />
                          </div>
                        )}
                        {typ === "test" && (
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <Input
                              placeholder="Test name"
                              value={item.test_name ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "test_name",
                                  e.target.value,
                                )
                              }
                              className="col-span-5"
                            />
                            <Input
                              placeholder="Instructions"
                              value={item.test_instructions ?? ""}
                              onChange={(e) =>
                                updatePrescriptionItem(
                                  idx,
                                  "test_instructions",
                                  e.target.value,
                                )
                              }
                              className="col-span-5"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPrescriptionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrescriptionSubmit}
              disabled={prescriptionSubmitLoading}
            >
              {prescriptionSubmitLoading ? "Saving..." : "Save prescription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewPrescriptionsOpen}
        onOpenChange={setViewPrescriptionsOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prescriptions</DialogTitle>
            <DialogDescription>
              {viewPrescriptionsAppointment
                ? `Prescriptions for ${viewPrescriptionsAppointment.patient_name} (${formatDate(viewPrescriptionsAppointment.appointment_date)})`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {prescriptionsListLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : prescriptionsList.length === 0 ? (
              <p className="text-sm text-gray-500">
                No prescriptions for this appointment.
              </p>
            ) : (
              prescriptionsList.map((rx) => (
                <div key={rx.id} className="p-3 border rounded bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {formatDate(rx.prescription_date)} ·{" "}
                        {rx.doctor_first_name} {rx.doctor_last_name}
                      </p>
                      <ul className="text-xs text-gray-600 mt-1">
                        {rx.items.map((it, i) => {
                          const t = it.type || "medicine";
                          if (t === "medicine")
                            return (
                              <li key={i}>
                                Medicine: {it.medicine_name}
                                {it.dosage ? ` ${it.dosage}` : ""}
                                {it.frequency ? `, ${it.frequency}` : ""}
                                {it.duration ? `, ${it.duration}` : ""}
                              </li>
                            );
                          if (t === "vitals")
                            return (
                              <li key={i}>
                                Vitals: {it.vital_name}
                                {it.vital_value != null
                                  ? ` ${it.vital_value}`
                                  : ""}
                                {it.vital_unit ? ` ${it.vital_unit}` : ""}
                              </li>
                            );
                          return (
                            <li key={i}>
                              Test: {it.test_name}
                              {it.test_instructions
                                ? ` – ${it.test_instructions}`
                                : ""}
                            </li>
                          );
                        })}
                      </ul>
                      {rx.notes && (
                        <p className="text-xs text-gray-500 mt-1">{rx.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPrescription(rx.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {canDelete() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeletePrescription(rx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            {viewPrescriptionsAppointment && (
              <Button
                onClick={() => {
                  setViewPrescriptionsOpen(false);
                  openPrescriptionForm(viewPrescriptionsAppointment);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add prescription
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate invoice</DialogTitle>
            <DialogDescription>
              {invoiceAppointment
                ? `Invoice for ${invoiceAppointment.patient_name} (${formatDate(invoiceAppointment.appointment_date)})`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {invoicePrescriptionsLoading ? (
            <p className="text-sm text-gray-500 py-4">
              Loading prescription items...
            </p>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <Label>Line items (tests, medicines, etc.)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceLineItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add row
                </Button>
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Amount</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceLineItems.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            placeholder="Description"
                            value={row.description}
                            onChange={(e) =>
                              updateInvoiceLineItem(
                                idx,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="0"
                            value={row.amount || ""}
                            onChange={(e) =>
                              updateInvoiceLineItem(
                                idx,
                                "amount",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInvoiceLineItem(idx)}
                            disabled={invoiceLineItems.length <= 1}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInvoiceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              disabled={invoiceLoading || invoicePrescriptionsLoading}
            >
              {invoiceLoading ? "Creating..." : "Generate invoice"}
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
                ? `${appointmentToDelete.patient_name} on ${formatDate(appointmentToDelete.appointment_date)}`
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
