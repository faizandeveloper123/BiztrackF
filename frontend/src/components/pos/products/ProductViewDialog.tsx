"use client";

import { AlertTriangle, Edit, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Label } from "@/src/components/ui/label";
import type { Product } from "@/src/models/pos";
import {
  formatProductDate,
  profitMarginPercent,
  unitLabel,
} from "./productUtils";

type ProductViewDialogProps = {
  product: Product | null;
  formatCurrency: (value: number) => string;
  onClose: () => void;
  onEdit?: (product: Product) => void;
};

export function ProductViewDialog({
  product,
  formatCurrency,
  onClose,
  onEdit,
}: ProductViewDialogProps) {
  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            Complete information about the product
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Product Name
                  </Label>
                  <p className="text-lg font-semibold">{product.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    SKU
                  </Label>
                  <p className="font-mono text-lg">{product.sku}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Description
                </Label>
                <p className="mt-1 text-gray-900">
                  {product.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Category
                  </Label>
                  <Badge variant="outline" className="mt-1">
                    {product.category}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Type
                  </Label>
                  <p className="mt-1 text-gray-900">
                    {product.productType || "Not set"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Pack Size
                  </Label>
                  <p className="mt-1 text-gray-900">{product.packSize ?? 1}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Company
                  </Label>
                  <p className="mt-1 text-gray-900">
                    {product.brand || "Not set"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Supplier
                  </Label>
                  <p className="mt-1 text-gray-900">
                    {product.supplierName || "Not set"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Unit of Measure
                  </Label>
                  <p className="mt-1 text-gray-900">
                    {unitLabel(product.unitOfMeasure)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium text-gray-900">
                  Pricing Information
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Sale Price
                    </Label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(product.salePrice)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Cost Per Unit Price
                    </Label>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(product.costPerUnitPrice)}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Profit Margin
                  </Label>
                  <p className="text-lg font-semibold text-purple-600">
                    {formatCurrency(
                      product.salePrice - product.costPerUnitPrice,
                    )}{" "}
                    (
                    {profitMarginPercent(
                      product.salePrice,
                      product.costPerUnitPrice,
                    )}
                    %)
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium text-gray-900">
                  Stock Information
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Current Stock
                    </Label>
                    <p className="text-2xl font-bold text-blue-600">
                      {product.stockQuantity} {unitLabel(product.unitOfMeasure)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Minimum Stock Level
                    </Label>
                    <p className="text-2xl font-bold text-orange-600">
                      {product.minStockLevel} {unitLabel(product.unitOfMeasure)}
                    </p>
                  </div>
                </div>
                {product.stockQuantity <= product.minStockLevel && (
                  <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        Low Stock Alert
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      This product is{" "}
                      {product.stockQuantity < product.minStockLevel
                        ? "below"
                        : "at"}{" "}
                      the minimum stock level. Consider restocking soon.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium text-gray-900">
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Barcode
                    </Label>
                    <p className="mt-1 font-mono text-gray-900">
                      {product.barcode || "Not set"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Batch Number
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {product.batchNumber || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Serial Number
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {product.serialNumber || "Not set"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Expiry Date
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {product.expiryDate
                        ? formatProductDate(product.expiryDate)
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Model No.
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {product.modelNo || "Not set"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Mfg. Date
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {product.mfgDate
                        ? formatProductDate(product.mfgDate)
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Date of Purchase
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {product.dateOfPurchase
                        ? formatProductDate(product.dateOfPurchase)
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Product Status
                    </Label>
                    <div className="mt-1">
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Label className="text-sm font-medium text-gray-600">
                      Created
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {formatProductDate(product.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {product && onEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
