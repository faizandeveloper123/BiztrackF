export type NgoSnapshot = {
  totalDonations: number;
  activeDonors: number;
  avgDonation: number;
  impactScore: number;
  activeCampaigns: number;
  teamMembers: number;
  annualProgressPercent: number;
  lowStockItems: number;
  pendingDonations: number;
  giftDonationsToday: number;
};

export const NGO_ANNUAL_TARGET = 1_250_000;
