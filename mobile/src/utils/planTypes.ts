export const RETAIL_PLAN_TYPES = ['commerce', 'agency'] as const;

export function isRetailPlan(planType?: string | null): boolean {
  if (!planType) return false;
  return RETAIL_PLAN_TYPES.includes(planType as (typeof RETAIL_PLAN_TYPES)[number]);
}
