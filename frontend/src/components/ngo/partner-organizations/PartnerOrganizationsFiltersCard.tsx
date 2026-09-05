import { Filter, Search } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  PARTNER_SECTOR_OPTIONS,
  PARTNER_SIZE_OPTIONS,
} from "@/src/utils/ngo/partnerOrganizationUtils";

type PartnerOrganizationsFiltersCardProps = {
  search: string;
  sectorFilter: string;
  sizeFilter: string;
  onSearchChange: (value: string) => void;
  onSectorFilterChange: (value: string) => void;
  onSizeFilterChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function PartnerOrganizationsFiltersCard({
  search,
  sectorFilter,
  sizeFilter,
  onSearchChange,
  onSectorFilterChange,
  onSizeFilterChange,
  onApply,
  onReset,
}: PartnerOrganizationsFiltersCardProps) {
  return (
    <Card className="shadow-md">
      <CardContent className="flex flex-col gap-4 p-5 md:grid md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onApply()}
            className="pl-10"
          />
        </div>
        <Select
          value={sectorFilter || "all"}
          onValueChange={(v) => onSectorFilterChange(v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {PARTNER_SECTOR_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sizeFilter || "all"}
          onValueChange={(v) => onSizeFilterChange(v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Sizes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            {PARTNER_SIZE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2 md:col-span-4 md:justify-end">
          <Button
            onClick={onApply}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
          <Button variant="outline" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
