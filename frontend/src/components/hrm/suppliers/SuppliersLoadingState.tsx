import { DashboardLayout } from "@/src/components/layout";

export function SuppliersLoadingState() {
  return (
    <DashboardLayout>
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    </DashboardLayout>
  );
}
