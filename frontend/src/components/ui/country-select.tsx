"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Search, Globe, X, Check } from "lucide-react";
import { COUNTRIES, COUNTRY_ALIASES } from "@/src/data/countries";

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

const ALIAS_TO_CANONICAL: Record<string, string> = { ...COUNTRY_ALIASES };

function canonicalCountry(name: string): string {
  return ALIAS_TO_CANONICAL[name] || name;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Select country...",
  label = "Country",
  required = false,
  error,
  className = "",
}: CountrySelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = value || "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectedRef.current &&
        !selectedRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const seen = new Set<string>();
    const results: string[] = [];
    if (!q) {
      return COUNTRIES;
    }
    for (const country of COUNTRIES) {
      if (country.toLowerCase().includes(q)) {
        if (!seen.has(country)) {
          seen.add(country);
          results.push(country);
        }
      }
    }
    for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) {
      if (alias.toLowerCase().includes(q) && !seen.has(canonical)) {
        seen.add(canonical);
        results.push(canonical);
      }
    }
    return results;
  }, [searchQuery]);

  const handleSelect = (country: string) => {
    onChange(country);
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange("");
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleBlur = () => {
    if (!selected) return;
    if (searchQuery.trim()) {
      const canonical = canonicalCountry(searchQuery.trim());
      if (canonical && COUNTRIES.includes(canonical)) {
        onChange(canonical);
      }
    }
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={selectedRef}>
      <Label
        htmlFor="country-search"
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
            ref={inputRef}
            id="country-search"
            type="text"
            value={
              selected ? (searchQuery ? searchQuery : selected) : searchQuery
            }
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onBlur={handleBlur}
            placeholder={selected ? "" : placeholder}
            className={`pl-10 pr-10 ${error ? "border-red-500" : ""}`}
            autoComplete="off"
          />
          {selected && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleClear}
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isOpen && (
          <div className="absolute z-[110] left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-lg">
            {filtered.length > 0 ? (
              <div className="py-1">
                {filtered.map((country) => (
                  <div
                    key={country}
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(country);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="font-medium text-gray-900">
                        {country}
                      </span>
                    </div>
                    {selected === country && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No countries found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
