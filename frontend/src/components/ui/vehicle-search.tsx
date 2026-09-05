"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Search, Car, X } from "lucide-react";
import { apiService } from "../../services/ApiService";
import { Vehicle } from "../../models/workshop";

interface VehicleSearchProps {
  value?: Vehicle | null;
  onSelect: (vehicle: Vehicle | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function VehicleSearch({
  value,
  onSelect,
  placeholder = "Search vehicles by reg, VIN, make, model...",
  label = "Vehicle",
  required = false,
  error,
  className = "",
}: VehicleSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(
    value || null,
  );
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchVehicles = async () => {
      if (searchQuery.trim().length < 1) {
        setVehicles([]);
        return;
      }
      setLoading(true);
      try {
        const data = await apiService.get(
          `/vehicles?search=${encodeURIComponent(searchQuery.trim())}&limit=20`,
        );
        setVehicles(Array.isArray(data) ? data : []);
      } catch {
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(searchVehicles, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedVehicle(value || null);
  }, [value]);

  const handleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSearchQuery("");
    setIsOpen(false);
    onSelect(vehicle);
  };

  const handleClear = () => {
    setSelectedVehicle(null);
    setSearchQuery("");
    onSelect(null);
  };

  const handleInputFocus = () => setIsOpen(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const displayLine = (v: Vehicle) => {
    const parts = [v.registration_number, v.make, v.model, v.year].filter(
      Boolean,
    );
    return parts.length ? parts.join(" · ") : v.vin || v.id;
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <Label
        htmlFor="vehicle-search"
        className={
          required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
        }
      >
        {label}
      </Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="vehicle-search"
            type="text"
            value={selectedVehicle ? displayLine(selectedVehicle) : searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={selectedVehicle ? "" : placeholder}
            className={`pl-10 pr-10 ${error ? "border-red-500" : ""}`}
            disabled={!!selectedVehicle}
          />
          {selectedVehicle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isOpen && (
          <Card className="absolute z-[110] w-full mt-1 max-h-60 overflow-y-auto shadow-lg border">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                  Searching...
                </div>
              ) : vehicles.length > 0 ? (
                <div className="py-1">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                      onClick={() => handleSelect(vehicle)}
                    >
                      <Car className="h-4 w-4 text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {displayLine(vehicle)}
                        </div>
                        {vehicle.vin && (
                          <div className="text-sm text-gray-500 truncate">
                            {vehicle.vin}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim().length >= 1 ? (
                <div className="p-4 text-center text-gray-500">
                  No vehicles found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Type to search vehicles
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {selectedVehicle && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border flex items-center gap-3">
          <Car className="h-4 w-4 text-gray-500 shrink-0" />
          <div className="min-w-0 text-sm">
            <div className="font-medium text-gray-900">
              {displayLine(selectedVehicle)}
            </div>
            {(selectedVehicle.vin ||
              selectedVehicle.color ||
              selectedVehicle.mileage ||
              selectedVehicle.engine_number) && (
              <div className="text-gray-600 truncate">
                {[
                  selectedVehicle.vin,
                  selectedVehicle.engine_number,
                  selectedVehicle.color,
                  selectedVehicle.mileage,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
