"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Wrench, X } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  MOT_INSPECTION_PRICE,
  MOT_SERVICE_OPTIONS,
  type MotServiceOption,
} from "./wizardTypes";
import { getMotServiceById } from "./wizardUtils";

type MotServiceSearchSelectProps = {
  value: string[];
  onChange: (selectedIds: string[]) => void;
  inspectionPrice?: number;
};

export function MotServiceSearchSelect({
  value,
  onChange,
  inspectionPrice = MOT_INSPECTION_PRICE,
}: MotServiceSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIds = useMemo(() => new Set(value), [value]);

  const serviceOptions = useMemo(
    () =>
      MOT_SERVICE_OPTIONS.map(
        (service) =>
          getMotServiceById(service.id, inspectionPrice) as MotServiceOption,
      ),
    [inspectionPrice],
  );

  const selectedServices = useMemo(
    () =>
      value
        .map((id) => getMotServiceById(id, inspectionPrice))
        .filter((service): service is MotServiceOption => Boolean(service)),
    [value, inspectionPrice],
  );

  const filteredServices = useMemo(() => {
    const available = serviceOptions.filter(
      (service) => !selectedIds.has(service.id),
    );
    if (!searchQuery.trim()) return available;
    const query = searchQuery.toLowerCase().trim();
    return available.filter(
      (service) =>
        service.label.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query),
    );
  }, [searchQuery, selectedIds, serviceOptions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = (service: MotServiceOption) => {
    if (selectedIds.has(service.id)) return;
    onChange([...value, service.id]);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleRemove = (serviceId: string) => {
    onChange(value.filter((id) => id !== serviceId));
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <Label
        htmlFor="mot-service-search"
        className="text-sm font-semibold uppercase tracking-wide"
      >
        Select Services
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="mot-service-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search services..."
          className="rounded-xl border-2 pl-10"
        />
        {isOpen && (
          <Card className="absolute left-0 right-0 top-full z-[110] mt-1 max-h-72 overflow-y-auto border-2 shadow-lg">
            <CardContent className="p-0">
              {filteredServices.length > 0 ? (
                <div className="py-1">
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      className="flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50"
                      onClick={() => handleAdd(service)}
                    >
                      <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{service.label}</span>
                          <span className="shrink-0 font-bold text-primary">
                            £{service.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery.trim()
                    ? `No services found for "${searchQuery}"`
                    : "All services have been added"}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {selectedServices.length > 0 && (
        <div className="space-y-2 rounded-2xl border-2 bg-muted/20 p-4">
          {selectedServices.map((service) => (
            <div
              key={service.id}
              className="flex items-start justify-between gap-3 rounded-xl border bg-background p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{service.label}</Badge>
                  <span className="font-bold text-primary">
                    £{service.price.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {service.description}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onClick={() => handleRemove(service.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
