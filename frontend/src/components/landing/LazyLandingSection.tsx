"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SectionSkeleton } from "./SectionSkeleton";
import { cn } from "@/src/lib/utils";

type LazyLandingSectionProps = {
  children: ReactNode;
  className?: string;
  skeletonClassName?: string;
  minHeight?: string;
};

export function LazyLandingSection({
  children,
  className,
  skeletonClassName,
  minHeight = "min-h-[280px]",
}: LazyLandingSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(minHeight, className)}>
      {visible ? children : <SectionSkeleton className={skeletonClassName} />}
    </div>
  );
}
