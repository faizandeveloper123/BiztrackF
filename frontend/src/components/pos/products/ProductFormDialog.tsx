"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import type { Product } from "@/src/models/pos";
import type { Supplier } from "@/src/models/hrm/supplier";
import type { ProductFormData } from "./types";
import type { ProductEntryMode } from "./productCodeUtils";
import { ProductFormFields } from "./ProductFormFields";
import { ProductCodeScanner } from "./ProductCodeScanner";

type ProductFormDialogProps = {
  open: boolean;
  editingProduct: Product | null;
  formData: ProductFormData;
  entryMode: ProductEntryMode;
  codeLookupLoading: boolean;
  categories: string[];
  suppliers: Supplier[];
  onOpenChange: (open: boolean) => void;
  onEntryModeChange: (mode: ProductEntryMode) => void;
  onFormChange: (patch: Partial<ProductFormData>) => void;
  onCodeScan: (code: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onAddCategoryClick: () => void;
  onAddSupplierClick: () => void;
};

export function ProductFormDialog({
  open,
  editingProduct,
  formData,
  entryMode,
  codeLookupLoading,
  categories,
  suppliers,
  onOpenChange,
  onEntryModeChange,
  onFormChange,
  onCodeScan,
  onSubmit,
  onAddCategoryClick,
  onAddSupplierClick,
}: ProductFormDialogProps) {
  const isEditing = Boolean(editingProduct);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the product information below."
              : "Add product details manually or scan a QR code / barcode to auto-fill the form."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {!isEditing ? (
            <Tabs
              value={entryMode}
              onValueChange={(value) =>
                onEntryModeChange(value as ProductEntryMode)
              }
            >
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="qr">QR Scan</TabsTrigger>
                <TabsTrigger value="barcode">Barcode Scan</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-4">
                <ProductFormFields
                  formData={formData}
                  categories={categories}
                  suppliers={suppliers}
                  onChange={onFormChange}
                  onAddCategoryClick={onAddCategoryClick}
                  onAddSupplierClick={onAddSupplierClick}
                />
              </TabsContent>

              <TabsContent value="qr" className="mt-4 space-y-4">
                {open && entryMode === "qr" && (
                  <ProductCodeScanner
                    mode="qr"
                    scanning={codeLookupLoading}
                    onScan={onCodeScan}
                  />
                )}
                <ProductFormFields
                  formData={formData}
                  categories={categories}
                  suppliers={suppliers}
                  onChange={onFormChange}
                  onAddCategoryClick={onAddCategoryClick}
                  onAddSupplierClick={onAddSupplierClick}
                />
              </TabsContent>

              <TabsContent value="barcode" className="mt-4 space-y-4">
                {open && entryMode === "barcode" && (
                  <ProductCodeScanner
                    mode="barcode"
                    scanning={codeLookupLoading}
                    onScan={onCodeScan}
                  />
                )}
                <ProductFormFields
                  formData={formData}
                  categories={categories}
                  suppliers={suppliers}
                  onChange={onFormChange}
                  onAddCategoryClick={onAddCategoryClick}
                  onAddSupplierClick={onAddSupplierClick}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <ProductFormFields
              formData={formData}
              categories={categories}
              suppliers={suppliers}
              onChange={onFormChange}
              onAddCategoryClick={onAddCategoryClick}
              onAddSupplierClick={onAddSupplierClick}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={codeLookupLoading}>
              {isEditing ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
