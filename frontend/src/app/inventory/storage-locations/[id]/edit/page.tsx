"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StorageLocationEditRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    const id = params?.id;
    if (!id) {
      router.replace("/inventory/storage-locations");
      return;
    }
    router.replace(`/inventory/storage-locations?edit=${id}`);
  }, [params, router]);

  return null;
}
