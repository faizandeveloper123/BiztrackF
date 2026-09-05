import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "@/src/components/marketing/MarketingPageShell";
import { COMPANY_REGISTRATION } from "@/src/constants/companyRegistration";
import { Button } from "@/src/components/ui/button";

export const metadata: Metadata = {
  title: "About - BizTrack UK LTD",
  description:
    "Learn about BizTrack UK LTD — our mission, vision, and business management solutions.",
};

const OFFERINGS = [
  "Project Management System",
  "HR & Employee Management",
  "Business Analytics",
  "Workflow Automation",
  "SaaS Infrastructure",
  "Enterprise Solutions",
] as const;

export default function AboutPage() {
  return (
    <MarketingPageShell>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        About Our Company
      </h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <span className="inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Registered Company
        </span>
        <p className="mt-3 font-semibold text-slate-900">
          {COMPANY_REGISTRATION.registeredCompany}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Company Number:</span>{" "}
          {COMPANY_REGISTRATION.companyNumber}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Authority:</span>{" "}
          {COMPANY_REGISTRATION.authority}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Registered Office:</span>{" "}
          {COMPANY_REGISTRATION.registeredOfficeAddress}
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-slate-900">Who We Are</h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          BizTrack UK LTD is a modern SaaS technology company focused on
          building intelligent business management systems that help
          organizations streamline operations, improve productivity, and scale
          efficiently.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-900">Our Mission</h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          To simplify business operations by unifying projects, HR, analytics,
          and automation into one powerful platform.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-900">Our Vision</h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          To become a global operating system for businesses by replacing
          fragmented tools with one intelligent ecosystem.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-900">What We Offer</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OFFERINGS.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <Button asChild className="mt-8 bg-emerald-600 hover:bg-emerald-700">
        <Link href="/signup">Get Started</Link>
      </Button>
    </MarketingPageShell>
  );
}
