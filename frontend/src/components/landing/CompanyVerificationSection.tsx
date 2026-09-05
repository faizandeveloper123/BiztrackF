"use client";

import { Building2, ShieldCheck, MapPin, Hash } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { VerifiedCompanyBadge } from "../common/VerifiedCompanyBadge";
import { COMPANY_REGISTRATION } from "@/src/constants/companyRegistration";

export function CompanyVerificationSection() {
  return (
    <section
      id="verification"
      className="overflow-visible py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 to-emerald-50/40"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 mb-3">
            Company Verification
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Registered &amp; Verified in the UK
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            BizTrack is operated by a UK-registered company for transparency and
            trust.
          </p>
        </div>

        <Card className="overflow-visible border-2 border-blue-200/80 bg-white shadow-lg">
          <div className="h-1.5 rounded-t-lg bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500" />
          <CardContent className="overflow-visible p-6 sm:p-10">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6 mb-8 overflow-visible">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-9 w-9" aria-hidden />
              </div>
              <div className="flex-1 space-y-3 overflow-visible">
                <VerifiedCompanyBadge
                  align="center"
                  className="sm:mx-0"
                  tooltipPosition="below"
                />
                <p className="text-sm text-slate-600">
                  Official registration details are listed below for your
                  assurance.
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <Building2 className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registered company
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {COMPANY_REGISTRATION.registeredCompany}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <Hash className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Company number
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {COMPANY_REGISTRATION.companyNumber}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:col-span-2">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Authority
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {COMPANY_REGISTRATION.authority}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:col-span-2">
                <MapPin className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registered office
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900 leading-relaxed">
                    {COMPANY_REGISTRATION.registeredOfficeAddress}
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
