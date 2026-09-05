import { RotateCcw, Search } from "lucide-react";
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
  DONOR_LEAD_SOURCE_OPTIONS,
  DONOR_LEAD_STATUS_OPTIONS,
} from "@/src/constants/ngo/donorLead";

type DonorLeadsFiltersCardProps = {
  search: string;
  statusFilter: string;
  sourceFilter: string;
  dateFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function DonorLeadsFiltersCard({
  search,
  statusFilter,
  sourceFilter,
  dateFilter,
  onSearchChange,
  onStatusChange,
  onSourceChange,
  onDateChange,
  onApply,
  onReset,
}: DonorLeadsFiltersCardProps) {
  return (
    <Card className="shadow-md">
      <CardContent className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onApply()}
              className="pl-11"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => onStatusChange(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {DONOR_LEAD_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sourceFilter || "all"}
            onValueChange={(v) => onSourceChange(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {DONOR_LEAD_SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            onClick={onApply}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            Apply Filters
          </Button>
          <Button
            variant="ghost"
            onClick={onReset}
            className="w-full sm:w-auto text-muted-foreground"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
