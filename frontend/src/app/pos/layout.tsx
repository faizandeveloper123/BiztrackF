import { ModuleGuard } from "@/src/components/guards/PermissionGuard";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGuard
      module="pos"
      fallback={<div>You do not have access to the POS module.</div>}
    >
      {children}
    </ModuleGuard>
  );
}
