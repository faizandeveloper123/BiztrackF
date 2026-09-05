export const DONOR_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;

export const DONOR_LEAD_SOURCES = [
  "website",
  "event",
  "referral",
  "social_media",
  "campaign",
  "other",
] as const;

export type DonorLeadStatus = (typeof DONOR_LEAD_STATUSES)[number];
export type DonorLeadSource = (typeof DONOR_LEAD_SOURCES)[number];

export const DONOR_LEAD_STATUS_OPTIONS: {
  value: DonorLeadStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export const DONOR_LEAD_SOURCE_OPTIONS: {
  value: DonorLeadSource;
  label: string;
}[] = [
  { value: "website", label: "Website" },
  { value: "event", label: "Event" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "campaign", label: "Campaign" },
  { value: "other", label: "Other" },
];

export const DONOR_LEAD_DEFAULT_STATUS: DonorLeadStatus = "new";
export const DONOR_LEAD_DEFAULT_SOURCE: DonorLeadSource = "other";

export const DONOR_LEADS_PAGE_LIMIT = 50;
