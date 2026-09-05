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
import { DONOR_TYPE_OPTIONS } from "@/src/utils/ngo/donorUtils";

type DonorsFiltersCardProps = {
  search: string;
  typeFilter: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function DonorsFiltersCard({
  search,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  onApply,
  onReset,
}: DonorsFiltersCardProps) {
  return (
    <Card className="shadow-md">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, donor ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onApply()}
            className="pl-10"
          />
        </div>
        <Select
          value={typeFilter || "all"}
          onValueChange={(v) => onTypeFilterChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Donor Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Donor Types</SelectItem>
            {DONOR_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2">
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
