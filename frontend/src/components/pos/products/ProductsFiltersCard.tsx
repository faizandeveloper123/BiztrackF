"use client";

import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
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
import { ProductCategory } from "@/src/models/pos";
import type { ProductFiltersState } from "./types";
import { formatCategoryLabel } from "./productUtils";

type ProductsFiltersCardProps = {
  categories: string[];
  filters: ProductFiltersState;
  onFiltersChange: (patch: Partial<ProductFiltersState>) => void;
  onClear: () => void;
};

export function ProductsFiltersCard({
  categories,
  filters,
  onFiltersChange,
  onClear,
}: ProductsFiltersCardProps) {
  const categoryOptions = categories.length
    ? categories
    : Object.values(ProductCategory);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search products..."
                value={filters.searchTerm}
                onChange={(e) =>
                  onFiltersChange({ searchTerm: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.selectedCategory}
              onValueChange={(value) =>
                onFiltersChange({ selectedCategory: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock Status</Label>
            <Select
              value={filters.showLowStock ? "low" : "all"}
              onValueChange={(value) =>
                onFiltersChange({ showLowStock: value === "low" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="low">Low Stock Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={onClear}>
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
