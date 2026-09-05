"use client";

import { BizTrackLogo } from "@/src/components/brand/BizTrackLogo";
import { VerifiedCompanyBadge } from "@/src/components/common/VerifiedCompanyBadge";

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <BizTrackLogo size="md" showText className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Complete business management platform for modern enterprises.
            </p>
            <div className="mt-4">
              <VerifiedCompanyBadge align="left" />
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="/#overview"
                  className="transition-colors hover:text-foreground"
                >
                  Overview
                </a>
              </li>
              <li>
                <a
                  href="/#features"
                  className="transition-colors hover:text-foreground"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="/#pricing"
                  className="transition-colors hover:text-foreground"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  API
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="/#csr"
                  className="transition-colors hover:text-foreground"
                >
                  CSR
                </a>
              </li>
              <li>
                <a
                  href="/#verification"
                  className="transition-colors hover:text-foreground"
                >
                  Verification
                </a>
              </li>
              <li>
                <a
                  href="/#reviews"
                  className="transition-colors hover:text-foreground"
                >
                  Reviews
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="transition-colors hover:text-foreground"
                >
                  About
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="transition-colors hover:text-foreground"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Status
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-4 border-t pt-8 text-center text-sm text-muted-foreground">
          <VerifiedCompanyBadge />
          <p>&copy; 2024 BizTrack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
