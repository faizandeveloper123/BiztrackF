"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
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
import { Badge } from "@/src/components/ui/badge";
import { Loader2, Timer } from "lucide-react";
import { toast } from "sonner";
import { useApiService } from "@/src/hooks/useApiService";
import { EmployeePortalService } from "@/src/services/EmployeePortalService";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import type {
  PortalTimeEntry,
  PortalTimeSession,
} from "@/src/models/employeePortal";

type Period = "today" | "week";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatElapsed(startIso?: string | null): string {
  if (!startIso) return "00:00:00";
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return "00:00:00";
  const sec = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatClockTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHours(n?: number | null): string {
  return `${(n ?? 0).toFixed(1)}h`;
}

function sumHours(entries: PortalTimeEntry[]): number {
  return entries.reduce((sum, e) => {
    if (e.clockOut && e.totalHours != null) return sum + (e.totalHours || 0);
    if (e.clockIn && !e.clockOut) {
      const start = new Date(e.clockIn).getTime();
      if (!Number.isNaN(start))
        return sum + Math.max(0, (Date.now() - start) / 3600000);
    }
    return sum + (e.totalHours || 0);
  }, 0);
}

export default function EmployeePortalTimePage() {
  const api = useApiService();
  const portalService = useMemo(() => new EmployeePortalService(api), [api]);

  const [period, setPeriod] = useState<Period>("today");
  const [todayEntries, setTodayEntries] = useState<PortalTimeEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<PortalTimeEntry[]>([]);
  const [session, setSession] = useState<PortalTimeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [noteOpen, setNoteOpen] = useState<"in" | "out" | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const today = isoDate(now);
      const weekStart = isoDate(startOfWeek(now));
      const [todayRes, weekRes, sess] = await Promise.all([
        portalService.listTimeEntries({ start_date: today, end_date: today }),
        portalService.listTimeEntries({
          start_date: weekStart,
          end_date: today,
        }),
        portalService.getCurrentSession(),
      ]);
      setTodayEntries(todayRes.timeEntries ?? []);
      setWeekEntries(weekRes.timeEntries ?? []);
      setSession(sess.session);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load time clock"));
    } finally {
      setLoading(false);
    }
  }, [portalService]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!session?.isActive) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [session?.isActive]);

  void tick;

  const clockedIn = Boolean(session?.isActive);
  const completedToday = useMemo(
    () => todayEntries.filter((e) => Boolean(e.clockOut)),
    [todayEntries],
  );
  const completedWeek = useMemo(
    () => weekEntries.filter((e) => Boolean(e.clockOut)),
    [weekEntries],
  );
  const listEntries = period === "today" ? completedToday : completedWeek;
  const todayHours = sumHours(todayEntries);
  const weekHours = sumHours(weekEntries);

  const openNote = (mode: "in" | "out") => {
    setNote("");
    setNoteOpen(mode);
  };

  const confirmClock = async (withNote: boolean) => {
    const text = withNote ? note.trim() : "";
    setBusy(true);
    try {
      if (noteOpen === "out" && session?.id) {
        await portalService.stopSession(session.id, text || undefined);
        toast.success("Clocked out");
      } else if (noteOpen === "in") {
        await portalService.startSession(
          text ? { description: text } : undefined,
        );
        toast.success("Clocked in");
      }
      setNoteOpen(null);
      setNote("");
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Clock action failed"));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !session && todayEntries.length === 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto flex h-64 items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time clock</h1>
          <p className="text-gray-600">
            Clock in, clock out, and review your hours
          </p>
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Timer className="h-6 w-6 text-slate-700" />
            </div>
            <CardTitle
              className={clockedIn ? "text-emerald-700" : "text-slate-700"}
            >
              {clockedIn ? "Clocked in" : "Not clocked in"}
            </CardTitle>
            <CardDescription>
              {clockedIn
                ? `Since ${formatClockTime(session?.startTime)}`
                : "Start your day with one tap"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center font-mono text-4xl font-bold tracking-tight text-slate-900">
              {clockedIn ? formatElapsed(session?.startTime) : "00:00:00"}
            </p>
            {clockedIn && session?.description ? (
              <p className="text-center text-sm font-medium text-slate-700">
                {session.description}
              </p>
            ) : null}
            <div className="flex justify-center gap-3">
              {clockedIn ? (
                <Button
                  variant="destructive"
                  size="lg"
                  disabled={busy}
                  onClick={() => openNote("out")}
                >
                  {busy ? "Clocking out…" : "Clock out"}
                </Button>
              ) : (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                  disabled={busy}
                  onClick={() => openNote("in")}
                >
                  {busy ? "Clocking in…" : "Clock in"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today</CardDescription>
              <CardTitle>{formatHours(todayHours)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This week</CardDescription>
              <CardTitle>{formatHours(weekHours)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>History</CardTitle>
              <CardDescription>Completed punches only</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={period === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("today")}
              >
                Today
              </Button>
              <Button
                variant={period === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("week")}
              >
                This week
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {listEntries.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {period === "today"
                  ? "No completed punches today. Clock in to start tracking."
                  : "No completed punches this week yet."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>
                        {formatClockTime(entry.clockIn)} –{" "}
                        {formatClockTime(entry.clockOut)}
                      </TableCell>
                      <TableCell>{formatHours(entry.totalHours)}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {entry.notes?.trim() || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Done</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={noteOpen != null}
          onOpenChange={(open) => {
            if (!open && !busy) setNoteOpen(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {noteOpen === "out" ? "Clock out" : "Clock in"}
              </DialogTitle>
              <DialogDescription>
                {noteOpen === "out"
                  ? "Add an optional note before ending your shift."
                  : "Optionally say what you are working on."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="clock-note">
                {noteOpen === "out"
                  ? "Notes (optional)"
                  : "What are you working on? (optional)"}
              </Label>
              <Textarea
                id="clock-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  noteOpen === "out"
                    ? "Add a note before clocking out"
                    : "e.g. Client calls, sprint tasks"
                }
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void confirmClock(false)}
              >
                {noteOpen === "out"
                  ? "Skip note & clock out"
                  : "Skip note & clock in"}
              </Button>
              <Button
                disabled={busy}
                className={
                  noteOpen === "in"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : undefined
                }
                variant={noteOpen === "out" ? "destructive" : "default"}
                onClick={() => void confirmClock(true)}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : noteOpen === "out" ? (
                  "Clock out"
                ) : (
                  "Clock in"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
