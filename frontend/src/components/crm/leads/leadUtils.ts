export type LeadUserOption = { id: string; name: string };

export function pipelineClass(stage?: string) {
  if (stage === "new_lead") return "bg-blue-100 text-blue-700";
  if (stage === "tried_to_contact") return "bg-red-100 text-red-700";
  if (stage === "made_contact") return "bg-indigo-100 text-indigo-700";
  if (stage === "qualified" || stage === "appointment_set")
    return "bg-emerald-100 text-emerald-700";
  if (stage === "lost") return "bg-gray-200 text-gray-600";
  return "bg-slate-100 text-slate-700";
}

export function relTime(iso?: string | null) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} H`;
  const days = Math.floor(hours / 24);
  return `${days} D`;
}

export function ageLabel(createdAt?: string) {
  if (!createdAt) return "N/A";
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000),
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function money(n?: number | null) {
  if (n == null) return "Not set";
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

export function mapUrl(
  lat?: number | null,
  lng?: number | null,
  city?: string | null,
  address?: string | null,
): string | null {
  if (lat != null && lng != null) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.05}%2C${lng + 0.05}%2C${lat + 0.05}&layer=mapnik&marker=${lat}%2C${lng}`;
  }
  if (city || address) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=-79.5%2C43.5%2C-79.1%2C43.9&layer=mapnik`;
  }
  return null;
}

export function ageDays(createdAt?: string) {
  if (!createdAt) return 0;
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000),
  );
}

const PIPELINE_STAGE_SET = new Set([
  "new_lead",
  "tried_to_contact",
  "made_contact",
  "qualified",
  "appointment_set",
  "offer_made",
  "under_contract",
  "closed",
  "lost",
]);

export function mapTenantUsers(
  tenantUsers: unknown[] | null | undefined,
): LeadUserOption[] {
  const seen = new Set<string>();
  const out: LeadUserOption[] = [];
  for (const raw of tenantUsers || []) {
    const u = raw as Record<string, unknown>;
    const id = String(u.id || u.userId || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const firstName = typeof u.firstName === "string" ? u.firstName : "";
    const lastName = typeof u.lastName === "string" ? u.lastName : "";
    const name =
      [firstName, lastName].filter(Boolean).join(" ") ||
      (typeof u.userName === "string" ? u.userName : "") ||
      (typeof u.email === "string" ? u.email : "") ||
      "User";
    out.push({ id, name });
  }
  return out;
}

export function safePipelineValue(stage?: string | null): string {
  const v = String(stage || "").trim();
  if (v && PIPELINE_STAGE_SET.has(v)) return v;
  return "new_lead";
}

export function safeAssigneeValue(
  assignedTo?: string | null,
  mainAgentId?: string | null,
  userIds?: Iterable<string>,
): string {
  const allowed = userIds ? new Set(userIds) : null;
  for (const raw of [assignedTo, mainAgentId]) {
    const v = String(raw || "").trim();
    if (!v) continue;
    if (!allowed || allowed.has(v)) return v;
  }
  return "__none__";
}
