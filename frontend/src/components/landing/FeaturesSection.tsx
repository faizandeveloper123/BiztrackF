"use client";

import {
  FolderOpen,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/src/lib/utils";

const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "blue" | "green";
}[] = [
  {
    icon: FolderOpen,
    title: "Project Management",
    description:
      "Plan, track, and manage projects with ease. Set milestones, assign tasks, and monitor progress in real-time.",
    accent: "blue",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Work together seamlessly with team chat, file sharing, and real-time collaboration tools.",
    accent: "green",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Get insights into your business performance with comprehensive dashboards and reports.",
    accent: "blue",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-level security with role-based access control, audit logs, and data encryption.",
    accent: "green",
  },
  {
    icon: Zap,
    title: "Automation",
    description:
      "Automate repetitive tasks and workflows to boost productivity and reduce errors.",
    accent: "blue",
  },
  {
    icon: Globe,
    title: "Multi-tenant",
    description:
      "Scale your business with our robust multi-tenant architecture designed for growth.",
    accent: "green",
  },
];

const iconRing = {
  blue: "bg-blue-100 text-blue-700 group-hover:bg-blue-200",
  green: "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200",
};

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50/80 to-emerald-50/30"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Powerful features designed to streamline your business operations
            and boost productivity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group border border-slate-200/80 bg-white/90 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="text-center pb-4 pt-6">
                <div
                  className={cn(
                    "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
                    iconRing[feature.accent],
                  )}
                >
                  <feature.icon className="h-8 w-8" aria-hidden />
                </div>
                <CardTitle className="text-xl text-slate-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-slate-600 text-center leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
