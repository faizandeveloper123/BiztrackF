import type { Metadata } from "next";
import { MarketingPageShell } from "@/src/components/marketing/MarketingPageShell";
import { ContactMessageForm } from "@/src/components/marketing/ContactMessageForm";
import { COMPANY_REGISTRATION } from "@/src/constants/companyRegistration";

export const metadata: Metadata = {
  title: "Contact - BizTrack UK LTD",
  description: "Contact BizTrack UK LTD for support and enquiries.",
};

export default function ContactPage() {
  return (
    <MarketingPageShell>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Contact Us
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Company Info</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-800">Phone:</span>{" "}
              {COMPANY_REGISTRATION.supportPhone}
            </p>
            <p>
              <span className="font-medium text-slate-800">Email:</span>{" "}
              <a
                href={`mailto:${COMPANY_REGISTRATION.supportEmail}`}
                className="text-emerald-700 hover:underline"
              >
                {COMPANY_REGISTRATION.supportEmail}
              </a>
            </p>
            <p>
              <span className="font-medium text-slate-800">
                Registered Office:
              </span>
              <br />
              {COMPANY_REGISTRATION.registeredOfficeAddress}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Send Message</h2>
          <div className="mt-4">
            <ContactMessageForm />
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
