"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, startOfMonth, addDays } from "date-fns";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Loader2,
  Stethoscope,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/src/components/layout";
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
import healthcareService from "@/src/services/HealthcareService";
import type { Appointment } from "@/src/models/healthcare";
import { toast } from "sonner";

type DashboardSnapshot = {
  doctorTotal: number;
  patientTotal: number;
  staffTotal: number;
  todayAppointmentTotal: number;
  todayScheduled: number;
  admittedCount: number;
  monthExpenseTotal: number;
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
};

const quickLinks = [
  { href: "/healthcare/appointments", label: "Appointments" },
  { href: "/healthcare/calendar", label: "Calendar" },
  { href: "/healthcare/patients", label: "Patients" },
  { href: "/healthcare/doctors", label: "Doctors" },
  { href: "/healthcare/staff", label: "Staff" },
  { href: "/healthcare/admitted-patients", label: "Admissions" },
  { href: "/healthcare/payments", label: "Payments" },
  { href: "/healthcare/daily-expense", label: "Daily expenses" },
];

function sortByDateTime(a: Appointment, b: Appointment) {
  const da = `${a.appointment_date}T${a.start_time || "00:00"}`;
  const db = `${b.appointment_date}T${b.start_time || "00:00"}`;
  return da.localeCompare(db);
}

async function loadMonthExpenseTotal(
  monthStart: string,
  today: string,
): Promise<number> {
  let sum = 0;
  let page = 1;
  const limit = 500;
  for (;;) {
    const res = await healthcareService.getDailyExpenses({
      date_from: monthStart,
      date_to: today,
      limit,
      page,
    });
    sum += res.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    if (res.expenses.length < limit) break;
    page += 1;
  }
  return sum;
}

export default function HealthcareDashboard() {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const weekEnd = format(addDays(new Date(), 7), "yyyy-MM-dd");

    try {
      const [
        doctorsRes,
        patientsRes,
        staffRes,
        todayAptsRes,
        weekAptsRes,
        admissionsRes,
        monthExpenseTotal,
      ] = await Promise.all([
        healthcareService.getDoctors({ limit: 1, is_active: true }),
        healthcareService.getPatients({ limit: 1, is_active: true }),
        healthcareService.getStaff({ limit: 1, is_active: true }),
        healthcareService.getAppointments({
          date_from: today,
          date_to: today,
          limit: 200,
        }),
        healthcareService.getAppointments({
          date_from: today,
          date_to: weekEnd,
          limit: 200,
        }),
        healthcareService.getAdmissions({
          status: "admitted",
          limit: 200,
        }),
        loadMonthExpenseTotal(monthStart, today),
      ]);

      const todayList = [...todayAptsRes.appointments].sort(sortByDateTime);
      const todayScheduled = todayList.filter(
        (x) => x.status === "scheduled",
      ).length;

      const upcoming = weekAptsRes.appointments
        .filter((a) => a.status === "scheduled" && a.appointment_date > today)
        .sort(sortByDateTime)
        .slice(0, 8);

      setSnapshot({
        doctorTotal: doctorsRes.total,
        patientTotal: patientsRes.total,
        staffTotal: staffRes.total,
        todayAppointmentTotal: todayAptsRes.total,
        todayScheduled,
        admittedCount: admissionsRes.total,
        monthExpenseTotal,
        todayAppointments: todayList.slice(0, 12),
        upcomingAppointments: upcoming,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load dashboard";
      toast.error(msg);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Healthcare Dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Overview for {format(new Date(), "EEEE, MMMM d, yyyy")}.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load()}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {loading && !snapshot ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : snapshot ? (
          <div className="mt-8 space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Patients
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {snapshot.patientTotal}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active records
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {snapshot.doctorTotal}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active doctors
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Staff</CardTitle>
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {snapshot.staffTotal}
                  </div>
                  <p className="text-xs text-muted-foreground">Active staff</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {snapshot.todayAppointmentTotal}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {snapshot.todayScheduled} scheduled
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Admitted
                  </CardTitle>
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {snapshot.admittedCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current admissions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Expenses
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {snapshot.monthExpenseTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Month to date</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Today&apos;s schedule</CardTitle>
                    <CardDescription>Appointments for today</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/healthcare/appointments" className="gap-1">
                      View all
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {snapshot.todayAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No appointments today.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshot.todayAppointments.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="whitespace-nowrap font-medium">
                              {a.start_time}
                              {a.end_time ? ` – ${a.end_time}` : ""}
                            </TableCell>
                            <TableCell>{a.patient_name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {a.doctor_first_name || a.doctor_last_name
                                ? [a.doctor_first_name, a.doctor_last_name]
                                    .filter(Boolean)
                                    .join(" ")
                                : "—"}
                            </TableCell>
                            <TableCell className="capitalize">
                              {a.status?.replace("_", " ") || "—"}
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
                    <CardTitle>Upcoming</CardTitle>
                    <CardDescription>
                      Scheduled after today, within 7 days
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/healthcare/calendar" className="gap-1">
                      Calendar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {snapshot.upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming scheduled visits.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Patient</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshot.upcomingAppointments.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(
                                new Date(`${a.appointment_date}T12:00:00`),
                                "MMM d",
                              )}
                            </TableCell>
                            <TableCell>{a.start_time}</TableCell>
                            <TableCell>{a.patient_name || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick links</CardTitle>
                <CardDescription>Jump to healthcare areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quickLinks.map((item) => (
                    <Button
                      key={item.href}
                      variant="secondary"
                      size="sm"
                      asChild
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p>Could not load dashboard data.</p>
            <Button className="mt-4" variant="outline" onClick={() => load()}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
