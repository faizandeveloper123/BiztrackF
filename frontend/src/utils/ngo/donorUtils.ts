import type {
  Donor,
  DonorCreate,
  DonorStatus,
  DonorType,
} from "@/src/models/ngo";

export const DONORS_PAGE_LIMIT = 50;

export const DONOR_TYPE_OPTIONS: { value: DonorType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "corporate", label: "Corporate" },
  { value: "anonymous", label: "Anonymous" },
];

export const emptyDonorForm = (): DonorCreate => ({
  full_name: "",
  email: "",
  phone: "",
  organization: "",
  donor_type: "individual",
  status: "active",
  address: "",
  notes: "",
});

export function donorTypeLabel(type: string): string {
  return DONOR_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function donorStatusLabel(status: DonorStatus): string {
  return status === "active" ? "Active" : "Inactive";
}

export function donorToFormData(donor: Donor): DonorCreate {
  return {
    full_name: donor.full_name,
    email: donor.email,
    phone: donor.phone ?? "",
    organization: donor.organization ?? "",
    donor_type: donor.donor_type,
    status: donor.status,
    address: donor.address ?? "",
    notes: donor.notes ?? "",
  };
}

export function buildDonorPayload(form: DonorCreate): DonorCreate | null {
  const full_name = form.full_name.trim();
  const email = form.email.trim();
  if (!full_name || !email) return null;
  return {
    full_name,
    email,
    phone: form.phone?.trim() || undefined,
    organization: form.organization?.trim() || undefined,
    donor_type: form.donor_type,
    status: form.status,
    address: form.address?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
  };
}

export function donorPaginationRange(
  page: number,
  limit: number,
  total: number,
) {
  const showingStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingEnd = Math.min(page * limit, total);
  return { showingStart, showingEnd };
}
