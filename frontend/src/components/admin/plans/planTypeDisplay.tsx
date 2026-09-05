import type { ReactNode } from "react";
import {
  Building2,
  CreditCard,
  Heart,
  HeartHandshake,
  Package,
  Settings,
  Star,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

export function getPlanTypeIcon(planType: string): ReactNode {
  const Icon = getPlanTypeIconComponent(planType);
  return <Icon className={getPlanTypeIconClassName(planType)} />;
}

function getPlanTypeIconComponent(planType: string): LucideIcon {
  switch (planType.toLowerCase()) {
    case "starter":
      return Star;
    case "professional":
      return Zap;
    case "enterprise":
      return Package;
    case "commerce":
      return TrendingUp;
    case "agency":
      return Building2;
    case "workshop":
      return Settings;
    case "healthcare":
      return Heart;
    case "ngo":
      return HeartHandshake;
    default:
      return CreditCard;
  }
}

function getPlanTypeIconClassName(planType: string): string {
  switch (planType.toLowerCase()) {
    case "starter":
      return "h-5 w-5 text-green-500";
    case "professional":
      return "h-5 w-5 text-blue-500";
    case "enterprise":
      return "h-5 w-5 text-purple-500";
    case "commerce":
      return "h-5 w-5 text-green-600";
    case "agency":
      return "h-5 w-5 text-indigo-600";
    case "workshop":
      return "h-5 w-5 text-orange-500";
    case "healthcare":
      return "h-5 w-5 text-rose-500";
    case "ngo":
      return "h-5 w-5 text-violet-600";
    default:
      return "h-5 w-5 text-gray-500";
  }
}

export function getPlanTypeColor(planType: string): string {
  switch (planType.toLowerCase()) {
    case "starter":
      return "bg-green-100 text-green-800";
    case "professional":
      return "bg-blue-100 text-blue-800";
    case "enterprise":
      return "bg-purple-100 text-purple-800";
    case "commerce":
      return "bg-emerald-100 text-emerald-800";
    case "agency":
      return "bg-indigo-100 text-indigo-800";
    case "workshop":
      return "bg-orange-100 text-orange-800";
    case "healthcare":
      return "bg-rose-100 text-rose-800";
    case "ngo":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
