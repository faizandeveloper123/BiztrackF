"use client";

import { SuperAdminGuard } from "@/src/components/guards/PermissionGuard";
import { AdminPlansContent } from "@/src/components/admin/plans/AdminPlansContent";

export default function AdminPlansPage() {
  return (
    <SuperAdminGuard>
      <AdminPlansContent />
    </SuperAdminGuard>
  );
}
