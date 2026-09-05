import type { Supplier, SupplierCreate } from "@/src/models/hrm";

export type SupplierFormData = SupplierCreate;

export type SupplierStats = {
  total: number;
  active: number;
  international: number;
};

export type SuppliersPageHeaderProps = {
  onAddSupplier?: () => void;
};

export type SuppliersSearchCardProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
};

export type SuppliersListCardProps = {
  suppliers: Supplier[];
  searchTerm: string;
  onAddSupplier?: () => void;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
};

export type SuppliersStatsCardsProps = {
  stats: SupplierStats;
};

export type SupplierFormDialogProps = {
  open: boolean;
  editingSupplier: Supplier | null;
  formData: SupplierFormData;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (
    field: keyof SupplierFormData,
    value: string | number | boolean | undefined,
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export type SupplierDeleteDialogProps = {
  open: boolean;
  supplier: Supplier | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};
