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
import {
  MOT_BOOKING_STATUSES,
  MOT_TEST_TYPES,
} from "@/src/models/mot/MotBooking";
import type { MotBookingFiltersState } from "./types";

type MotBookingsFiltersCardProps = {
  filters: MotBookingFiltersState;
  onFiltersChange: (patch: Partial<MotBookingFiltersState>) => void;
  onClear: () => void;
};

export function MotBookingsFiltersCard({
  filters,
  onFiltersChange,
  onClear,
}: MotBookingsFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mot-search">Search</Label>
            <Input
              id="mot-search"
              placeholder="Customer, phone, registration..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFiltersChange({
                  status: value as MotBookingFiltersState["status"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {MOT_BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Test type</Label>
            <Select
              value={filters.testType}
              onValueChange={(value) =>
                onFiltersChange({
                  testType: value as MotBookingFiltersState["testType"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {MOT_TEST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mot-date-from">From date</Label>
            <Input
              id="mot-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mot-date-to">To date</Label>
            <Input
              id="mot-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
