import Link from "next/link";
import { BizTrackLogo } from "@/src/components/brand/BizTrackLogo";
import { LandingFooter } from "@/src/components/landing/LandingFooter";

const MARKETING_NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

type MarketingPageShellProps = {
  children: React.ReactNode;
};

export function MarketingPageShell({ children }: MarketingPageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BizTrackLogo size="md" href="/" />
          <nav className="flex items-center gap-4 sm:gap-6">
            {MARKETING_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>

      <LandingFooter />
    </div>
  );
}
