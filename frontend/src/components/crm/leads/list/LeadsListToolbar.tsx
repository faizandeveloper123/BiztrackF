"use client";

import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Plus, Filter, ChevronDown } from "lucide-react";
import { LeadSavedFilter } from "@/src/models/crm";

type Props = {
  savedFilters: LeadSavedFilter[];
  showPartialOnly: boolean;
  onApplyFilter: (sf: LeadSavedFilter) => void;
  onClearFilters: () => void;
  onBulkAction: (action: string, extra?: Record<string, string>) => void;
  onAddNew?: () => void;
  onTogglePartial: () => void;
};

export function LeadsListToolbar({
  savedFilters,
  showPartialOnly,
  onApplyFilter,
  onClearFilters,
  onBulkAction,
  onAddNew,
  onTogglePartial,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Apply Actions <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onBulkAction("delete")}>
              Delete selected
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onBulkAction("rating", { leadRating: "hot" })}
            >
              Mark Hot
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onBulkAction("rating", { leadRating: "warm" })}
            >
              Mark Warm
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onBulkAction("rating", { leadRating: "cold" })}
            >
              Mark Cold
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onBulkAction("pipeline", { pipelineStage: "tried_to_contact" })
              }
            >
              Set Tried to contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-1 h-3 w-3" /> Saved Filter{" "}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {savedFilters.map((sf) => (
              <DropdownMenuItem key={sf.id} onClick={() => onApplyFilter(sf)}>
                {sf.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={onClearFilters}>
              Clear filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {onAddNew && (
          <Button size="sm" onClick={onAddNew}>
            <Plus className="mr-1 h-4 w-4" /> Add New Lead
          </Button>
        )}
        <Button
          size="sm"
          variant={showPartialOnly ? "default" : "outline"}
          onClick={onTogglePartial}
        >
          Partial Leads
        </Button>
      </div>
    </div>
  );
}
