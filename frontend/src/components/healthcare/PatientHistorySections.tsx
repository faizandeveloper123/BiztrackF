"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Calendar, FileText, Download } from "lucide-react";
import type {
  PatientHistoryResponse,
  Appointment,
  Prescription,
  PrescriptionItem,
} from "@/src/models/healthcare";

type Props = {
  loading: boolean;
  data: PatientHistoryResponse | null;
  emptyLabel?: string;
  onDownloadPrescription: (prescriptionId: string) => void | Promise<void>;
};

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : "—");

const doctorName = (a: Appointment) =>
  [a.doctor_first_name, a.doctor_last_name].filter(Boolean).join(" ") || "—";

const prescriptionItemsSummary = (items: PrescriptionItem[] | undefined) => {
  if (!items?.length) return "—";
  const parts = items
    .slice(0, 3)
    .map((i) => {
      if (i.type === "medicine" && i.medicine_name) return i.medicine_name;
      if (i.type === "vitals" && i.vital_name) return i.vital_name;
      if (i.type === "test" && i.test_name) return i.test_name;
      return null;
    })
    .filter(Boolean);
  return parts.join(", ") + (items.length > 3 ? "..." : "");
};

export function PatientHistorySections({
  loading,
  data,
  emptyLabel = "Patient not found.",
  onDownloadPrescription,
}: Props) {
  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading patient history...
      </div>
    );
  }
  if (!data) {
    return <div className="py-12 text-center text-gray-500">{emptyLabel}</div>;
  }

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Patient</CardTitle>
          <CardDescription>Basic information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Full name</p>
            <p className="text-gray-900">{data.patient.full_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Phone</p>
            <p className="text-gray-900">{data.patient.phone || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-900">{data.patient.email || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Date of birth</p>
            <p className="text-gray-900">
              {data.patient.date_of_birth
                ? formatDate(data.patient.date_of_birth)
                : "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-gray-900">{data.patient.address || "—"}</p>
          </div>
          {data.patient.notes && (
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-500">Notes</p>
              <p className="text-gray-900">{data.patient.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointments
            </CardTitle>
            <CardDescription>
              {data.appointments.length} appointment
              {data.appointments.length !== 1 ? "s" : ""} for this patient
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/healthcare/appointments">New appointment</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.appointments.length === 0 ? (
            <p className="py-6 text-center text-gray-500">
              No appointments yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{formatDate(a.appointment_date)}</TableCell>
                    <TableCell>
                      {a.start_time} – {a.end_time}
                    </TableCell>
                    <TableCell>{doctorName(a)}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-gray-600">
                      {a.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Prescriptions
            </CardTitle>
            <CardDescription>
              {data.prescriptions.length} prescription
              {data.prescriptions.length !== 1 ? "s" : ""} for this patient
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {data.prescriptions.length === 0 ? (
            <p className="py-6 text-center text-gray-500">
              No prescriptions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.prescriptions.map((rx: Prescription) => (
                  <TableRow key={rx.id}>
                    <TableCell>{formatDate(rx.prescription_date)}</TableCell>
                    <TableCell>
                      {[rx.doctor_first_name, rx.doctor_last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </TableCell>
                    <TableCell>
                      {rx.appointment_date
                        ? formatDate(rx.appointment_date)
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-gray-600">
                      {prescriptionItemsSummary(rx.items)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void onDownloadPrescription(rx.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
