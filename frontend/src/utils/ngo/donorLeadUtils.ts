import {
  DONOR_LEAD_DEFAULT_SOURCE,
  DONOR_LEAD_DEFAULT_STATUS,
  DONOR_LEAD_SOURCE_OPTIONS,
  DONOR_LEAD_STATUS_OPTIONS,
  DONOR_LEADS_PAGE_LIMIT,
} from "@/src/constants/ngo/donorLead";
import type { DonorLead, DonorLeadCreate } from "@/src/models/ngo/donorLead";

export { DONOR_LEADS_PAGE_LIMIT };

export function emptyDonorLeadForm(): DonorLeadCreate {
  return {
    full_name: "",
    email: "",
    phone: "",
    organization: "",
    expected_donation: 0,
    status: DONOR_LEAD_DEFAULT_STATUS,
    source: DONOR_LEAD_DEFAULT_SOURCE,
    assigned_to: "",
    notes: "",
  };
}

export function donorLeadToFormData(lead: DonorLead): DonorLeadCreate {
  return {
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.phone ?? "",
    organization: lead.organization ?? "",
    expected_donation: lead.expected_donation ?? 0,
    status: lead.status,
    source: lead.source,
    assigned_to: lead.assigned_to ?? "",
    notes: lead.notes ?? "",
  };
}

export function buildDonorLeadPayload(
  form: DonorLeadCreate,
): DonorLeadCreate | null {
  const full_name = form.full_name?.trim();
  const email = form.email?.trim();
  if (!full_name || !email) return null;
  return {
    full_name,
    email,
    phone: form.phone?.trim() || undefined,
    organization: form.organization?.trim() || undefined,
    expected_donation: Number(form.expected_donation) || 0,
    status: form.status ?? DONOR_LEAD_DEFAULT_STATUS,
    source: form.source ?? DONOR_LEAD_DEFAULT_SOURCE,
    assigned_to: form.assigned_to?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
  };
}

export function donorLeadStatusLabel(status: string): string {
  return (
    DONOR_LEAD_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export function donorLeadSourceLabel(source: string): string {
  return (
    DONOR_LEAD_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? source
  );
}

export function donorLeadStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-amber-100 text-amber-800",
    qualified: "bg-green-100 text-green-800",
    converted: "bg-emerald-100 text-emerald-900",
    lost: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function formatDonorLeadDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function donorLeadPaginationRange(
  page: number,
  limit: number,
  total: number,
) {
  if (total === 0) return { showingStart: 0, showingEnd: 0 };
  const showingStart = (page - 1) * limit + 1;
  const showingEnd = Math.min(page * limit, total);
  return { showingStart, showingEnd };
}
