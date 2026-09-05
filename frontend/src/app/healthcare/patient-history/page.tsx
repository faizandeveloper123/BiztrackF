"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { User, Search } from "lucide-react";
import { cn } from "@/src/lib/utils";
import healthcareService from "@/src/services/HealthcareService";
import type { Patient, PatientHistoryResponse } from "@/src/models/healthcare";
import { PatientHistorySections } from "@/src/components/healthcare/PatientHistorySections";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";

export default function HealthcarePatientHistoryPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [hits, setHits] = useState<Patient[]>([]);
  const [hitsLoading, setHitsLoading] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PatientHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [urlPatientResolving, setUrlPatientResolving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadHits = useCallback(async () => {
    try {
      setHitsLoading(true);
      const res = await healthcareService.getPatients({
        search: debounced || undefined,
        limit: 50,
        page: 1,
      });
      setHits(res.patients || []);
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to search patients"));
      setHits([]);
    } finally {
      setHitsLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    void loadHits();
  }, [loadHits]);

  const loadHistoryForPatient = useCallback(async (p: Patient) => {
    setHistory(null);
    try {
      setHistoryLoading(true);
      const h = await healthcareService.getPatientHistory(p.id);
      setHistory(h);
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to load patient history"));
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoaded) return;
    const id =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("patient")
        : null;
    if (!id) {
      setInitialLoaded(true);
      return;
    }
    setUrlPatientResolving(true);
    let cancelled = false;
    (async () => {
      try {
        const p = await healthcareService.getPatient(id);
        if (cancelled) return;
        setSelected(p);
        setSearch(p.full_name || "");
        await loadHistoryForPatient(p);
      } catch (e) {
        if (!cancelled) {
          toast.error(extractErrorMessage(e, "Patient not found"));
        }
      } finally {
        if (!cancelled) {
          setUrlPatientResolving(false);
          setInitialLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialLoaded, loadHistoryForPatient]);

  const openPatient = (p: Patient) => {
    setSelected(p);
    void loadHistoryForPatient(p);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("patient", p.id);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const clearSelection = () => {
    setSelected(null);
    setHistory(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("patient");
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.search ? url.search : ""),
      );
    }
  };

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const blob =
        await healthcareService.getPrescriptionDownload(prescriptionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${prescriptionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(extractErrorMessage(e, "Failed to download"));
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Patient history
            </h1>
            <p className="mt-1 text-gray-600">
              Search for a patient, then view appointments and prescriptions.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/healthcare/patients">Manage patients</Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr]">
          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5" />
                Find patient
              </CardTitle>
              <CardDescription>Name, phone, or email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ph-search">Search</Label>
                <Input
                  id="ph-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to search..."
                  className="mt-1"
                />
              </div>
              <div className="max-h-[min(420px,50vh)] space-y-1 overflow-y-auto rounded-md border border-gray-100 p-1">
                {hitsLoading ? (
                  <p className="px-3 py-6 text-center text-sm text-gray-500">
                    Searching...
                  </p>
                ) : hits.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-gray-500">
                    No patients match.
                  </p>
                ) : (
                  hits.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openPatient(p)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        selected?.id === p.id
                          ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200"
                          : "hover:bg-gray-50 text-gray-800",
                      )}
                    >
                      <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <span className="min-w-0">
                        <span className="block font-medium">{p.full_name}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {[p.phone, p.email].filter(Boolean).join(" · ") ||
                            "—"}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              {selected && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={clearSelection}
                >
                  Clear selection
                </Button>
              )}
            </CardContent>
          </Card>

          <div>
            {urlPatientResolving ? (
              <Card>
                <CardContent className="py-16 text-center text-gray-500">
                  Loading patient...
                </CardContent>
              </Card>
            ) : !selected ? (
              <Card>
                <CardContent className="py-16 text-center text-gray-500">
                  Select a patient from the list to view their history.
                </CardContent>
              </Card>
            ) : (
              <PatientHistorySections
                loading={historyLoading}
                data={history}
                emptyLabel="Could not load history for this patient."
                onDownloadPrescription={handleDownloadPrescription}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
