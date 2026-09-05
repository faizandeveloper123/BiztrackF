"use client";

import { DashboardLayout } from "@/src/components/layout";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { usePosProductsPage } from "@/src/hooks/usePosProductsPage";
import { ProductsLoadingState } from "@/src/components/pos/products/ProductsLoadingState";
import { ProductsPageHeader } from "@/src/components/pos/products/ProductsPageHeader";
import { ProductsFiltersCard } from "@/src/components/pos/products/ProductsFiltersCard";
import { ProductsGrid } from "@/src/components/pos/products/ProductsGrid";
import { CreateProductDialog } from "@/src/components/pos/products/CreateProductDialog";
import { ProductViewDialog } from "@/src/components/pos/products/ProductViewDialog";
import { ProductDeleteDialog } from "@/src/components/pos/products/ProductDeleteDialog";

export default function POSProductsPage() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "pos:products",
  );
  const { formatCurrency } = useCurrency();
  const page = usePosProductsPage();

  if (page.loading) {
    return <ProductsLoadingState />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 p-6">
        <ProductsPageHeader
          onAddProduct={canCreate() ? page.openNewProductDialog : undefined}
        />

        <ProductsFiltersCard
          categories={page.categories}
          filters={page.filters}
          onFiltersChange={(patch) =>
            page.setFilters((prev) => ({ ...prev, ...patch }))
          }
          onClear={page.clearFilters}
        />

        <ProductsGrid
          products={page.filteredProducts}
          filters={page.filters}
          formatCurrency={formatCurrency}
          onAddProduct={canCreate() ? page.openNewProductDialog : undefined}
          onView={page.setViewingProduct}
          onEdit={canUpdate() ? page.handleEdit : undefined}
          onDelete={canDelete() ? page.handleDeleteClick : undefined}
        />

        <CreateProductDialog
          open={page.isDialogOpen}
          editingProduct={page.editingProduct}
          onOpenChange={page.handleDialogClose}
          onSaved={() => void page.handleProductSaved()}
        />

        <ProductViewDialog
          product={page.viewingProduct}
          formatCurrency={formatCurrency}
          onClose={() => page.setViewingProduct(null)}
          onEdit={canUpdate() ? page.handleEdit : undefined}
        />

        <ProductDeleteDialog
          open={page.isDeleteDialogOpen}
          productName={page.productToDelete?.name}
          onOpenChange={(open) => !open && page.handleDeleteCancel()}
          onConfirm={page.handleDeleteConfirm}
          onCancel={page.handleDeleteCancel}
        />
      </div>
    </DashboardLayout>
  );
}
