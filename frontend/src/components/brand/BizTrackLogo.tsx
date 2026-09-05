"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

const LOGO_ASPECT = 671 / 503;

const HEIGHTS = {
  sm: 28,
  md: 36,
  lg: 48,
  hero: 96,
} as const;

type BizTrackLogoSize = keyof typeof HEIGHTS;

interface BizTrackLogoProps {
  size?: BizTrackLogoSize;
  variant?: "full" | "icon";
  showText?: boolean;
  className?: string;
  href?: string;
}

export function BizTrackLogo({
  size = "md",
  variant = "full",
  showText = false,
  className,
  href,
}: BizTrackLogoProps) {
  const height = HEIGHTS[size];
  const src = variant === "icon" ? "/biztrack-icon.png" : "/biztrack-logo.png";
  const width = variant === "icon" ? height : Math.round(height * LOGO_ASPECT);

  const image = (
    <Image
      src={src}
      alt="BizTrack"
      height={height}
      width={width}
      className="object-contain"
      priority={size === "hero"}
    />
  );

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      {image}
      {showText ? (
        <span className="text-xl font-bold tracking-tight">BizTrack</span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
