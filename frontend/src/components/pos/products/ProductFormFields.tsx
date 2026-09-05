"use client";

import { FolderPlus, UserPlus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ProductCategory, UnitOfMeasure } from "@/src/models/pos";
import type { Supplier } from "@/src/models/hrm/supplier";
import type { ProductFormData } from "./types";
import { formatCategoryLabel } from "./productUtils";

type ProductFormFieldsProps = {
  formData: ProductFormData;
  categories: string[];
  suppliers: Supplier[];
  onChange: (patch: Partial<ProductFormData>) => void;
  onAddCategoryClick: () => void;
  onAddSupplierClick: () => void;
};

export function ProductFormFields({
  formData,
  categories,
  suppliers,
  onChange,
  onAddCategoryClick,
  onAddSupplierClick,
}: ProductFormFieldsProps) {
  const categoryOptions = categories.length
    ? categories
    : Object.values(ProductCategory);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="productType">Type</Label>
          <Input
            id="productType"
            value={formData.productType}
            onChange={(e) => onChange({ productType: e.target.value })}
            placeholder="e.g. Accessories"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => onChange({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onAddCategoryClick}
              title="Add category"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <Select
                value={formData.supplierId || "none"}
                onValueChange={(value) =>
                  onChange({ supplierId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onAddSupplierClick}
              title="Add supplier"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="brand">Company</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
            placeholder="e.g. Logitech"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packSize">Pack Size</Label>
          <Input
            id="packSize"
            type="number"
            min="1"
            value={formData.packSize}
            onChange={(e) =>
              onChange({ packSize: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => onChange({ barcode: e.target.value })}
            placeholder="Product barcode..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="salePrice">Sale Price *</Label>
          <Input
            id="salePrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.salePrice}
            onChange={(e) =>
              onChange({ salePrice: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPerUnitPrice">Cost Per Unit Price *</Label>
          <Input
            id="costPerUnitPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPerUnitPrice}
            onChange={(e) =>
              onChange({ costPerUnitPrice: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock Quantity *</Label>
          <Input
            id="stockQuantity"
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={(e) =>
              onChange({ stockQuantity: parseInt(e.target.value, 10) || 0 })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
          <Select
            value={formData.unitOfMeasure}
            onValueChange={(value) =>
              onChange({ unitOfMeasure: value as UnitOfMeasure })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UnitOfMeasure).map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="minStockLevel">Low Stock Threshold</Label>
          <Input
            id="minStockLevel"
            type="number"
            min="0"
            value={formData.minStockLevel}
            onChange={(e) =>
              onChange({ minStockLevel: parseInt(e.target.value, 10) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => onChange({ expiryDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchNumber">Batch Number</Label>
          <Input
            id="batchNumber"
            value={formData.batchNumber}
            onChange={(e) => onChange({ batchNumber: e.target.value })}
            placeholder="Batch number..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber}
            onChange={(e) => onChange({ serialNumber: e.target.value })}
            placeholder="Serial number..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="modelNo">Model No.</Label>
          <Input
            id="modelNo"
            value={formData.modelNo}
            onChange={(e) => onChange({ modelNo: e.target.value })}
            placeholder="Model number..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mfgDate">Mfg. Date</Label>
          <Input
            id="mfgDate"
            type="date"
            value={formData.mfgDate}
            onChange={(e) => onChange({ mfgDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfPurchase">Date of Purchase</Label>
          <Input
            id="dateOfPurchase"
            type="date"
            value={formData.dateOfPurchase}
            onChange={(e) => onChange({ dateOfPurchase: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Product description..."
        />
      </div>
    </div>
  );
}
