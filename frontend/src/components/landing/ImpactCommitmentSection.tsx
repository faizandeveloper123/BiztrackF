"use client";

import { Button } from "../ui/button";
import { CharityPartnerCard, type CharityPartner } from "./CharityPartnerCard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Heart, Leaf, Recycle, FileX2, ArrowRight } from "lucide-react";

const CHARITY_PARTNERS: CharityPartner[] = [
  {
    name: "Hopeful Welfare Foundation",
    href: "https://hopefulwelfare.org/",
    logo: "/partners/hopeful-welfare-foundation.png",
    width: 1378,
    height: 1118,
    label: "Hopeful Welfare Foundation",
    imageQuality: 100,
    unoptimized: true,
    logoFrameClassName: "bg-gradient-to-br from-white to-slate-50",
  },
  {
    name: "IKCA",
    href: "https://www.ikca.org.uk/",
    logo: "/partners/ikca.png",
    width: 161,
    height: 78,
    label: "Imran Khan Cancer Appeal",
    logoClassName: "max-h-[3.25rem] max-w-[11rem]",
  },
];

const SUSTAINABILITY_ITEMS = [
  {
    title: "Carbon neutrality",
    description:
      "Supporting initiatives that reduce emissions and move toward net-zero impact.",
    icon: Leaf,
  },
  {
    title: "Sustainable operations",
    description:
      "Responsible resource use across our teams, partners, and day-to-day operations.",
    icon: Recycle,
  },
  {
    title: "Digital-first processes",
    description:
      "Paperless workflows that cut waste while keeping business operations efficient.",
    icon: FileX2,
  },
] as const;

export function ImpactCommitmentSection() {
  return (
    <section
      id="csr"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/40 to-blue-50/30"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 mb-3">
            CSR — Charity &amp; Environment
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Our Commitment to Impact
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Beyond business software, we invest in communities and responsible
            practices that create lasting positive change.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-md overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <Heart className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">Charity Contribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                We contribute 5% of our profits to charitable causes, supporting
                education, welfare, and community development through our
                partner organizations.
              </p>

              <div>
                <p className="text-sm font-medium text-foreground mb-4">
                  Partner organizations we support
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  {CHARITY_PARTNERS.map((partner) => (
                    <CharityPartnerCard key={partner.name} partner={partner} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            id="sustainability"
            className="border-0 bg-card/80 backdrop-blur-sm shadow-md overflow-hidden"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Leaf className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">
                  Carbon Footprint Commitment
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-semibold text-foreground leading-snug">
                We actively support carbon footprint reduction initiatives
              </p>

              <ul className="space-y-4">
                {SUSTAINABILITY_ITEMS.map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <item.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <a href="#sustainability">
                  Learn about our sustainability approach
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
