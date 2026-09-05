"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Clock, FileText } from "lucide-react";
import { DashboardLayout } from "@/src/components/layout";
import { Button } from "@/src/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { InvoiceDashboard as InvoiceDashboardComponent } from "@/src/components/sales/InvoiceDashboard";
import { InvoiceManagementPanel } from "@/src/components/sales/InvoiceManagementPanel";
import InvoiceService from "@/src/services/InvoiceService";
import type { InvoiceDashboard } from "@/src/models/sales";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { usePermissions } from "@/src/hooks/usePermissions";

const VALID_TABS = ["dashboard", "outstanding", "invoices"] as const;
type InvoiceTab = (typeof VALID_TABS)[number];

function isInvoiceTab(value: string | null): value is InvoiceTab {
  return VALID_TABS.includes(value as InvoiceTab);
}

function InvoiceDashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canViewInvoices, canViewInvoiceDashboard } = usePermissions();
  const showDashboard = canViewInvoiceDashboard();
  const showInvoices = canViewInvoices();
  const tabParam = searchParams.get("tab");
  const activeTab = useMemo<InvoiceTab>(() => {
    const normalizedTab = tabParam === "overdue" ? "outstanding" : tabParam;
    if (isInvoiceTab(normalizedTab)) {
      if (normalizedTab === "invoices" && showInvoices) return "invoices";
      if (normalizedTab === "outstanding" && showInvoices) return "outstanding";
      if (normalizedTab === "dashboard" && showDashboard) return "dashboard";
    }
    if (showDashboard) return "dashboard";
    if (showInvoices) return "invoices";
    return "dashboard";
  }, [tabParam, showDashboard, showInvoices]);

  const [dashboard, setDashboard] = useState<InvoiceDashboard | null>(null);
  const [loading, setLoading] = useState(showDashboard);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    if (!showDashboard || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const dashboardData = await InvoiceService.getDashboard();
      setDashboard(dashboardData);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load invoice dashboard"));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [showDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleTabChange = (value: string) => {
    if (!isInvoiceTab(value)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    const query = params.toString();
    router.replace(
      query ? `/sales/invoice-dashboard?${query}` : "/sales/invoice-dashboard",
    );
  };

  if (!showDashboard && !showInvoices) {
    return (
      <DashboardLayout>
        <div className="px-3 py-12 text-center text-muted-foreground sm:px-4 md:px-5">
          You do not have permission to view invoices.
        </div>
      </DashboardLayout>
    );
  }

  if (showDashboard && loading && !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex h-64 w-full items-center justify-center px-3 py-4">
          <div className="text-lg">Loading Invoice Dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (showDashboard && error && !dashboard) {
    return (
      <DashboardLayout>
        <div className="w-full px-3 py-4 text-center sm:px-4 md:px-5">
          <div className="mb-4 text-red-600">Error: {error}</div>
          <Button onClick={loadDashboard}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  const visibleTabCount = (showDashboard ? 1 : 0) + (showInvoices ? 2 : 0);
  const tabsListClass =
    visibleTabCount === 3
      ? "grid-cols-3"
      : visibleTabCount === 2
        ? "grid-cols-2"
        : "grid-cols-1";

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 max-w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 md:px-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoicing</h1>
          <p className="text-gray-600">
            Manage paid and outstanding invoices, and monitor metrics
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className={`grid w-full ${tabsListClass}`}>
            {showDashboard && (
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
            )}
            {showInvoices && (
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoices
              </TabsTrigger>
            )}
            {showInvoices && (
              <TabsTrigger
                value="outstanding"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Outstanding
              </TabsTrigger>
            )}
          </TabsList>

          {showDashboard && (
            <TabsContent value="dashboard" className="space-y-6">
              {dashboard && <InvoiceDashboardComponent dashboard={dashboard} />}
            </TabsContent>
          )}

          {showInvoices && (
            <TabsContent value="invoices" className="space-y-6">
              <InvoiceManagementPanel
                scope="paid"
                onInvoicesChange={loadDashboard}
              />
            </TabsContent>
          )}

          {showInvoices && (
            <TabsContent value="outstanding" className="space-y-6">
              <InvoiceManagementPanel
                scope="outstanding"
                onInvoicesChange={loadDashboard}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function InvoiceDashboardPageFallback() {
  return (
    <DashboardLayout>
      <div className="flex h-64 w-full items-center justify-center px-3 py-4">
        <div className="text-lg">Loading...</div>
      </div>
    </DashboardLayout>
  );
}

export default function InvoiceDashboardPage() {
  return (
    <Suspense fallback={<InvoiceDashboardPageFallback />}>
      <InvoiceDashboardPageContent />
    </Suspense>
  );
}
