"use client";

import { AlertTriangle, Edit, Eye, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import type { Product } from "@/src/models/pos";
import { formatProductDate, unitLabel } from "./productUtils";

type ProductCardProps = {
  product: Product;
  formatCurrency: (value: number) => string;
  onView: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
};

export function ProductCard({
  product,
  formatCurrency,
  onView,
  onEdit,
  onDelete,
}: ProductCardProps) {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="line-clamp-2 break-words text-lg leading-tight">
              {product.name}
            </CardTitle>
            <CardDescription className="truncate text-sm">
              SKU: {product.sku}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:pt-0.5">
            <Button variant="ghost" size="sm" onClick={() => onView(product)}>
              <Eye className="h-4 w-4" />
            </Button>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(product)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="font-semibold">
            {formatCurrency(product.salePrice)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Stock</span>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{product.stockQuantity}</span>
            <span className="text-xs text-muted-foreground">
              {unitLabel(product.unitOfMeasure)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Category</span>
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
        </div>

        {product.stockQuantity <= product.minStockLevel && (
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Low Stock</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Added: {formatProductDate(product.createdAt)}</span>
          <Badge variant="default">Active</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
