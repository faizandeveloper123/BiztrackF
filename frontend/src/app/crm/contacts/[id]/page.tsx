"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CRMContactDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = params?.id;
    if (typeof id === "string" && id.trim()) {
      router.replace(
        `/crm/contacts?contactId=${encodeURIComponent(id.trim())}`,
      );
      return;
    }
    router.replace("/crm/contacts");
  }, [params, router]);

  return null;
}
