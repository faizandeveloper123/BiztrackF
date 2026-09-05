export type DonorDashboardStat = {
  label: string;
  value: string;
  change: string;
  changeLabel: string;
  accent: "emerald" | "blue" | "purple" | "orange";
};

export type DonorPipelineStage = {
  title: string;
  stage: string;
  count: number;
  valueLabel: string;
  value: string;
  secondaryLabel: string;
  secondaryValue: string;
  accent: "emerald" | "blue" | "purple" | "orange" | "green" | "gray";
};

export type DonorQuickAction = {
  href: string;
  label: string;
  accent: "emerald" | "blue" | "purple" | "orange" | "teal";
};

export const MOCK_DONOR_DASHBOARD_STATS: DonorDashboardStat[] = [
  {
    label: "Total Donor Leads",
    value: "37",
    change: "+12",
    changeLabel: "active leads",
    accent: "emerald",
  },
  {
    label: "Total Donors",
    value: "167",
    change: "+24",
    changeLabel: "this month",
    accent: "blue",
  },
  {
    label: "Total Donations Received",
    value: "$124,850",
    change: "+$24,500",
    changeLabel: "projected next month",
    accent: "purple",
  },
  {
    label: "Donor Retention Rate",
    value: "68%",
    change: "+5%",
    changeLabel: "vs last quarter",
    accent: "orange",
  },
];

export const MOCK_DONOR_PIPELINE: DonorPipelineStage[] = [
  {
    title: "New Donor Prospects",
    stage: "Prospecting",
    count: 6,
    valueLabel: "Expected Value:",
    value: "$37,000",
    secondaryLabel: "Conversion Probability:",
    secondaryValue: "50%",
    accent: "emerald",
  },
  {
    title: "Qualified Donors",
    stage: "Qualification",
    count: 4,
    valueLabel: "Expected Value:",
    value: "$12,000",
    secondaryLabel: "Conversion Probability:",
    secondaryValue: "50%",
    accent: "blue",
  },
  {
    title: "Proposal Sent",
    stage: "Proposal",
    count: 0,
    valueLabel: "Expected Value:",
    value: "$0",
    secondaryLabel: "Conversion Probability:",
    secondaryValue: "50%",
    accent: "purple",
  },
  {
    title: "Follow-up / Negotiation",
    stage: "Negotiation",
    count: 0,
    valueLabel: "Expected Value:",
    value: "$0",
    secondaryLabel: "Conversion Probability:",
    secondaryValue: "50%",
    accent: "orange",
  },
  {
    title: "Donation Confirmed",
    stage: "Closed Won",
    count: 0,
    valueLabel: "Total Value:",
    value: "$0",
    secondaryLabel: "Conversion Rate:",
    secondaryValue: "0%",
    accent: "green",
  },
  {
    title: "Donation Declined",
    stage: "Closed Lost",
    count: 0,
    valueLabel: "Lost Value:",
    value: "$0",
    secondaryLabel: "Lost Opportunities:",
    secondaryValue: "0",
    accent: "gray",
  },
];

export const MOCK_DONOR_QUICK_ACTIONS: DonorQuickAction[] = [
  { href: "/ngo/donor-leads", label: "Manage Donor Leads", accent: "emerald" },
  { href: "/ngo/donors", label: "Manage Donors", accent: "blue" },
  {
    href: "/ngo/partner-organizations",
    label: "Partner Orgs",
    accent: "orange",
  },
  {
    href: "/ngo/gift-opportunities",
    label: "Gift Opportunities",
    accent: "teal",
  },
];
