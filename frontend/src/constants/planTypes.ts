export const PLAN_TYPE_AGENCY = "agency";
export const PLAN_TYPE_COMMERCE = "commerce";
export const PLAN_TYPE_WORKSHOP = "workshop";
export const PLAN_TYPE_HEALTHCARE = "healthcare";
export const PLAN_TYPE_NGO = "ngo";

export const ALL_PLAN_TYPES = [
  PLAN_TYPE_AGENCY,
  PLAN_TYPE_COMMERCE,
  PLAN_TYPE_WORKSHOP,
  PLAN_TYPE_HEALTHCARE,
  PLAN_TYPE_NGO,
] as const;

export const RETAIL_PLAN_TYPES = [
  PLAN_TYPE_COMMERCE,
  PLAN_TYPE_AGENCY,
] as const;

export type RetailPlanType = (typeof RETAIL_PLAN_TYPES)[number];

export function isRetailPlan(planType?: string | null): boolean {
  if (!planType) return false;
  return RETAIL_PLAN_TYPES.includes(planType as RetailPlanType);
}

export function isCommercePlan(planType?: string | null): boolean {
  return planType === PLAN_TYPE_COMMERCE;
}

export function isAgencyPlan(planType?: string | null): boolean {
  return planType === PLAN_TYPE_AGENCY;
}

export function getPlanDisplayLabel(
  planType?: string | null,
  planName?: string,
): string {
  switch (planType) {
    case PLAN_TYPE_WORKSHOP:
      return "Workshop Master";
    case PLAN_TYPE_COMMERCE:
      return "Commerce Pro";
    case PLAN_TYPE_AGENCY:
      return "Agency Pro";
    case PLAN_TYPE_HEALTHCARE:
      return "Healthcare Suite";
    case PLAN_TYPE_NGO:
      return "NGO Impact";
    default:
      return planName || "Unknown Plan";
  }
}

export function withAgencyPlanTypes(planTypes: string[]): string[] {
  if (planTypes.includes("*")) return planTypes;
  if (!planTypes.includes(PLAN_TYPE_COMMERCE)) return planTypes;
  if (planTypes.includes(PLAN_TYPE_AGENCY)) return planTypes;
  return [...planTypes, PLAN_TYPE_AGENCY];
}
