export interface AdminPlan {
  id: string;
  name: string;
  description: string;
  planType: string;
  price: number;
  billingCycle: string;
  maxProjects?: number;
  maxUsers?: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPlanStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalSubscriptions: number;
}

export interface AdminPlansListResponse {
  plans: AdminPlan[];
}

export type AdminPlanUpdatePayload = Partial<
  Pick<
    AdminPlan,
    "name" | "description" | "price" | "billingCycle" | "maxUsers" | "isActive"
  >
>;
