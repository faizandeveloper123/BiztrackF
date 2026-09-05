"use client";

import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import type { SuppliersSearchCardProps } from "./types";

export function SuppliersSearchCard({
  searchTerm,
  onSearchTermChange,
}: SuppliersSearchCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Suppliers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search by name, code, contact person, or city..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardContent>
    </Card>
  );
}
