export type ReviewItem = {
  id: string;
  author: string;
  rating: number;
  date: string;
  excerpt: string;
};

export const TRUSTPILOT_DUMMY_REVIEWS: ReviewItem[] = [
  {
    id: "tp-1",
    author: "Sarah M.",
    rating: 5,
    date: "2 weeks ago",
    excerpt:
      "BizTrack streamlined our operations. Onboarding was smooth and support responded quickly.",
  },
  {
    id: "tp-2",
    author: "James K.",
    rating: 5,
    date: "1 month ago",
    excerpt:
      "Excellent ERP for a growing team. Inventory and sales modules work seamlessly together.",
  },
  {
    id: "tp-3",
    author: "Aisha R.",
    rating: 4,
    date: "1 month ago",
    excerpt:
      "Powerful features and a clean dashboard. Looking forward to more reporting options.",
  },
  {
    id: "tp-4",
    author: "David L.",
    rating: 5,
    date: "2 months ago",
    excerpt:
      "Reliable platform for multi-location retail. Highly recommend for commerce businesses.",
  },
];

export const GOOGLE_DUMMY_REVIEWS: ReviewItem[] = [
  {
    id: "g-1",
    author: "Michael T.",
    rating: 5,
    date: "3 days ago",
    excerpt:
      "Great business management tool. Easy to train staff and manage daily workflows.",
  },
  {
    id: "g-2",
    author: "Priya N.",
    rating: 5,
    date: "1 week ago",
    excerpt:
      "Project and CRM modules saved us hours every week. Solid product and team.",
  },
  {
    id: "g-3",
    author: "Oliver B.",
    rating: 5,
    date: "2 weeks ago",
    excerpt:
      "Professional platform with strong UK support. Billing and ledger are well thought out.",
  },
  {
    id: "g-4",
    author: "Emma W.",
    rating: 4,
    date: "3 weeks ago",
    excerpt:
      "Very capable system for SMEs. Mobile experience could improve but web app is excellent.",
  },
  {
    id: "g-5",
    author: "Hassan A.",
    rating: 5,
    date: "1 month ago",
    excerpt:
      "We migrated from spreadsheets to BizTrack in weeks. Visibility across teams is much better.",
  },
];
