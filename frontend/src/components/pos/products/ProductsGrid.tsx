"use client";

import { Package, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { Product } from "@/src/models/pos";
import type { ProductFiltersState } from "./types";
import { ProductCard } from "./ProductCard";

type ProductsGridProps = {
  products: Product[];
  filters: ProductFiltersState;
  formatCurrency: (value: number) => string;
  onAddProduct?: () => void;
  onView: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
};

export function ProductsGrid({
  products,
  filters,
  formatCurrency,
  onAddProduct,
  onView,
  onEdit,
  onDelete,
}: ProductsGridProps) {
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedCategory !== "all" ||
    filters.showLowStock;

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No products found</h3>
        <p className="mt-2 text-muted-foreground">
          {hasActiveFilters
            ? "Try adjusting your filters or search terms."
            : "Get started by adding your first product."}
        </p>
        {!hasActiveFilters && onAddProduct && (
          <Button onClick={onAddProduct} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          formatCurrency={formatCurrency}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
