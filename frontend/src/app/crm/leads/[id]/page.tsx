"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ModuleGuard } from "../../../../components/guards/PermissionGuard";
import { DashboardLayout } from "../../../../components/layout";
import { Button } from "@/src/components/ui/button";
import CRMService from "@/src/services/CRMService";
import { Lead } from "@/src/models/crm";
import { useRBAC } from "@/src/contexts/RBACContext";
import { mapTenantUsers } from "@/src/components/crm/leads/leadUtils";
import { LeadDetailHeader } from "@/src/components/crm/leads/detail/LeadDetailHeader";
import { LeadActivityInfoCard } from "@/src/components/crm/leads/detail/LeadActivityInfoCard";
import { LeadContactCard } from "@/src/components/crm/leads/detail/LeadContactCard";
import { LeadOpenTaskBanner } from "@/src/components/crm/leads/detail/LeadOpenTaskBanner";
import { LeadStatsSection } from "@/src/components/crm/leads/detail/LeadStatsSection";
import { LeadPipelineIntegrations } from "@/src/components/crm/leads/detail/LeadPipelineIntegrations";
import { LeadListingSearchesCard } from "@/src/components/crm/leads/detail/LeadListingSearchesCard";
import { LeadWorkspaceTabs } from "@/src/components/crm/leads/detail/LeadWorkspaceTabs";
import { LeadDataPanel } from "@/src/components/crm/leads/detail/LeadDataPanel";
import { LeadMapPanel } from "@/src/components/crm/leads/detail/LeadMapPanel";
import { LeadAgentsPanel } from "@/src/components/crm/leads/detail/LeadAgentsPanel";

export default function LeadDetailPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don&apos;t have access to CRM module</div>}
    >
      <LeadDetailContent />
    </ModuleGuard>
  );
}

function LeadDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { tenantUsers, fetchTenantUsers } = useRBAC();
  const leadId = String(params.id || "");

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const users = mapTenantUsers(tenantUsers);

  useEffect(() => {
    if ((tenantUsers?.length || 0) > 0) return;
    fetchTenantUsers?.().catch(() => undefined);
  }, [fetchTenantUsers, tenantUsers?.length]);

  const reload = useCallback(async () => {
    if (!leadId) return;
    const detail = await CRMService.getLeadDetail(leadId);
    setLead(detail);
  }, [leadId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await reload();
      } catch {
        setLead(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [reload]);

  const patchLead = async (data: Record<string, unknown>) => {
    if (!leadId) return;
    const updated = await CRMService.updateLead(leadId, data as any);
    setLead((prev) => (prev ? { ...prev, ...updated } : prev));
    await reload();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading lead...</div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p>Lead not found</p>
          <Button className="mt-4" onClick={() => router.push("/crm/leads")}>
            Back to leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
        <LeadDetailHeader lead={lead} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-4">
            <LeadActivityInfoCard lead={lead} />
            <LeadContactCard
              lead={lead}
              leadId={leadId}
              setLead={setLead}
              patchLead={patchLead}
              reload={reload}
            />
            <LeadOpenTaskBanner lead={lead} />
            <LeadStatsSection lead={lead} leadId={leadId} reload={reload} />
            <LeadPipelineIntegrations
              lead={lead}
              leadId={leadId}
              reload={reload}
            />
            <LeadListingSearchesCard
              lead={lead}
              leadId={leadId}
              reload={reload}
            />
          </div>

          <div className="lg:col-span-8 space-y-4">
            <LeadWorkspaceTabs
              lead={lead}
              leadId={leadId}
              patchLead={patchLead}
              reload={reload}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <LeadDataPanel lead={lead} patchLead={patchLead} />
              <LeadMapPanel lead={lead} />
            </div>

            <LeadAgentsPanel
              lead={lead}
              leadId={leadId}
              users={users}
              patchLead={patchLead}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
