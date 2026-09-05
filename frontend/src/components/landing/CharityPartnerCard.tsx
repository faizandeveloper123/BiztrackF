"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

const LOGO_FRAME_CLASS =
  "flex h-28 w-full items-center justify-center rounded-lg bg-white px-3 shadow-sm ring-1 ring-slate-200/90";

const TILE_CLASS =
  "flex w-full flex-col items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-4 transition-colors hover:border-primary/40 hover:shadow-md";

export type CharityPartner = {
  name: string;
  href: string;
  logo: string;
  width: number;
  height: number;
  label: string;
  logoClassName?: string;
  logoFrameClassName?: string;
  imageQuality?: number;
  unoptimized?: boolean;
};

type CharityPartnerCardProps = {
  partner: CharityPartner;
  className?: string;
};

export function CharityPartnerCard({
  partner,
  className,
}: CharityPartnerCardProps) {
  return (
    <Link
      href={partner.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(TILE_CLASS, className)}
    >
      <div className={cn(LOGO_FRAME_CLASS, partner.logoFrameClassName)}>
        <Image
          src={partner.logo}
          alt={partner.name}
          width={partner.width}
          height={partner.height}
          quality={partner.imageQuality ?? 90}
          unoptimized={partner.unoptimized}
          className={cn(
            "max-h-[5.25rem] w-auto max-w-full object-contain",
            partner.unoptimized &&
              "drop-shadow-[0_1px_2px_rgba(15,23,42,0.12)]",
            partner.logoClassName,
          )}
        />
      </div>
      <span className="min-h-[2.5rem] text-center text-xs font-medium leading-snug text-muted-foreground">
        {partner.label}
      </span>
    </Link>
  );
}
