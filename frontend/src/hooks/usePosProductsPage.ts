"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiService } from "@/src/services/ApiService";
import type { Product, POSCategoriesResponse } from "@/src/models/pos";
import type { ProductFiltersState } from "@/src/components/pos/products/types";
import {
  defaultFilters,
  filterProducts,
} from "@/src/components/pos/products/productUtils";

export function usePosProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFiltersState>(defaultFilters());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data: POSCategoriesResponse =
        await apiService.get("/pos/categories");
      setCategories(data.categories || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiService.get("/pos/products");
      setProducts(response.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const openNewProductDialog = useCallback(() => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("openAdd") !== "true") return;
    openNewProductDialog();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("openAdd");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/pos/products?${nextQuery}` : "/pos/products");
  }, [searchParams, router, openNewProductDialog]);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) setEditingProduct(null);
    setIsDialogOpen(open);
  }, []);

  const handleProductSaved = useCallback(async () => {
    await fetchProducts();
    setEditingProduct(null);
  }, [fetchProducts]);

  const handleDeleteClick = useCallback((product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!productToDelete) return;
    try {
      await apiService.delete(`/pos/products/${productToDelete.id}`);
      await fetchProducts();
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch {}
  }, [productToDelete, fetchProducts]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters());
  }, []);

  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [products, filters],
  );

  return {
    products,
    categories,
    loading,
    filters,
    filteredProducts,
    editingProduct,
    viewingProduct,
    productToDelete,
    isDialogOpen,
    isDeleteDialogOpen,
    setFilters,
    setViewingProduct,
    openNewProductDialog,
    handleEdit,
    handleDialogClose,
    handleProductSaved,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    clearFilters,
  };
}
