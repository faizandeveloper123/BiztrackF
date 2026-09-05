import type {
  PartnerOrganization,
  PartnerOrganizationCreate,
  PartnerSector,
  PartnerSize,
  PartnerStatus,
} from "@/src/models/ngo";

export const PARTNERS_PAGE_LIMIT = 50;

export const PARTNER_SECTOR_OPTIONS: { value: PartnerSector; label: string }[] =
  [
    { value: "relief", label: "Relief & Emergency" },
    { value: "medical", label: "Medical Aid" },
    { value: "education", label: "Education" },
    { value: "food", label: "Food Security" },
  ];

export const PARTNER_SIZE_OPTIONS: { value: PartnerSize; label: string }[] = [
  { value: "small", label: "Small (1-10)" },
  { value: "medium", label: "Medium (11-50)" },
  { value: "large", label: "Large (51-200)" },
];

export const emptyPartnerForm = (): PartnerOrganizationCreate => ({
  name: "",
  email: "",
  sector: "relief",
  organization_size: "medium",
  website: "",
  location: "",
  status: "active",
});

export function partnerSectorLabel(sector: string): string {
  return (
    PARTNER_SECTOR_OPTIONS.find((o) => o.value === sector)?.label ?? sector
  );
}

export function partnerSizeLabel(size: string): string {
  return PARTNER_SIZE_OPTIONS.find((o) => o.value === size)?.label ?? size;
}

export function partnerStatusLabel(status: PartnerStatus): string {
  return status === "active" ? "Active" : "Inactive";
}

export function partnerToFormData(
  org: PartnerOrganization,
): PartnerOrganizationCreate {
  return {
    name: org.name,
    email: org.email,
    sector: org.sector,
    organization_size: org.organization_size,
    website: org.website ?? "",
    location: org.location ?? "",
    status: org.status,
  };
}

export function buildPartnerPayload(
  form: PartnerOrganizationCreate,
): PartnerOrganizationCreate | null {
  const name = form.name.trim();
  const email = form.email.trim();
  if (!name || !email) return null;
  return {
    name,
    email,
    sector: form.sector,
    organization_size: form.organization_size,
    website: form.website?.trim() || undefined,
    location: form.location?.trim() || undefined,
    status: form.status,
  };
}

export function formatPartnerDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function partnerPaginationRange(
  page: number,
  limit: number,
  total: number,
) {
  const showingStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingEnd = Math.min(page * limit, total);
  return { showingStart, showingEnd };
}

export function sectorAccentClass(sector: PartnerSector): {
  bg: string;
  icon: string;
} {
  switch (sector) {
    case "relief":
      return { bg: "bg-blue-100", icon: "text-blue-600" };
    case "medical":
      return { bg: "bg-purple-100", icon: "text-purple-600" };
    case "education":
      return { bg: "bg-orange-100", icon: "text-orange-600" };
    case "food":
      return { bg: "bg-emerald-100", icon: "text-emerald-600" };
    default:
      return { bg: "bg-emerald-100", icon: "text-emerald-600" };
  }
}
