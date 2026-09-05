"use client";

import React from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { Button } from "../ui/button";

import { useAuth } from "../../contexts/AuthContext";

import { BizTrackLogo } from "../brand/BizTrackLogo";

const NAV_LINKS = [
  { id: "modules", label: "Modules" },
  { id: "overview", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "reviews", label: "Reviews" },
  { id: "csr", label: "CSR" },
  { id: "verification", label: "Verify" },
  { id: "pricing", label: "Pricing" },
] as const;

const PAGE_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function LandingNav() {
  const router = useRouter();

  const { isAuthenticated } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
          <BizTrackLogo size="md" showText href="/" />

          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors"
              >
                {link.label}
              </button>
            ))}
            {PAGE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex border-slate-200"
                  onClick={() => router.push("/login")}
                >
                  Sign In
                </Button>

                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => router.push("/signup")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex lg:hidden gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none [scrollbar-width:none]">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollToSection(link.id)}
              className="shrink-0 text-xs font-medium text-slate-600 hover:text-blue-700 whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
          {PAGE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 text-xs font-medium text-slate-600 hover:text-blue-700 whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
