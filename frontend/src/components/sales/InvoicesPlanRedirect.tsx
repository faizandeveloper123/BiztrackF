"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePlanInfo } from "@/src/hooks/usePlanInfo";

type Props = { children: ReactNode };

export function InvoicesPlanRedirect({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { planInfo } = usePlanInfo();
  const [hide, setHide] = useState(false);

  useLayoutEffect(() => {
    if (!planInfo) return;
    const pt = planInfo.planType;
    if (pt !== "healthcare" && pt !== "workshop") return;
    if (pathname !== "/sales/invoices") return;
    const search = typeof window !== "undefined" ? window.location.search : "";
    setHide(true);
    router.replace(search ? `/invoices${search}` : "/invoices");
  }, [planInfo, pathname, router]);

  if (hide) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground text-sm">
        Redirecting
      </div>
    );
  }

  return <>{children}</>;
}
