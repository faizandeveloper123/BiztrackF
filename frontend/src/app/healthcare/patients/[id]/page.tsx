"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import healthcareService from "@/src/services/HealthcareService";
import type { PatientHistoryResponse } from "@/src/models/healthcare";
import { PatientHistorySections } from "@/src/components/healthcare/PatientHistorySections";
import { toast } from "sonner";

export default function PatientHistoryPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<PatientHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await healthcareService.getPatientHistory(id);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof Error ? e.message : "Failed to load patient history",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      toast.error(e instanceof Error ? e.message : "Failed to download");
    }
  };

  if (!id) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <p className="text-gray-600">Invalid patient.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/healthcare/patients">Back to Patients</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/healthcare/patients"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Patients
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/healthcare/patient-history?patient=${id}`}>
              Open in Patient history
            </Link>
          </Button>
        </div>

        <PatientHistorySections
          loading={loading}
          data={data}
          emptyLabel="Patient not found."
          onDownloadPrescription={handleDownloadPrescription}
        />
      </div>
    </DashboardLayout>
  );
}
