import {
  CircleDollarSign,
  FileText,
  Gift,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export type NgoQuickAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
};

export const NGO_QUICK_ACTIONS: NgoQuickAction[] = [
  {
    href: "/ngo/donation-receipts",
    label: "New Donation",
    icon: CircleDollarSign,
    iconClass: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  },
  {
    href: "/ngo/donors",
    label: "Add Donor",
    icon: UserPlus,
    iconClass: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
  },
  {
    href: "/ngo/inventory",
    label: "Gift Inventory",
    icon: Gift,
    iconClass: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
  },
  {
    href: "/ngo/reports",
    label: "Generate Report",
    icon: FileText,
    iconClass: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
  },
];

export const NGO_QUICK_LINKS = [
  { href: "/ngo/relief-projects", label: "Relief projects" },
  { href: "/ngo/donors", label: "Donors" },
  { href: "/ngo/donor-leads", label: "Donor leads" },
  { href: "/events", label: "Charity events" },
  { href: "/ngo/ledger", label: "Fund accounting" },
  { href: "/ngo/volunteers", label: "Volunteers" },
] as const;

export type NgoStatAccent = "emerald" | "blue" | "purple" | "orange";
