"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Search, User, X } from "lucide-react";
import type { Patient } from "../../models/healthcare";
import healthcareService from "../../services/HealthcareService";

interface PatientSearchProps {
  value?: Patient | null;
  onSelect: (patient: Patient | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function PatientSearch({
  value,
  onSelect,
  placeholder = "Search patients by name, phone...",
  label = "Patient",
  required = false,
  error,
  className = "",
}: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
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
    if (searchQuery.trim().length < 2) {
      setPatients([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await healthcareService.getPatients({
          search: searchQuery.trim(),
          limit: 10,
        });
        setPatients(res.patients);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedPatient(value || null);
  }, [value]);

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery("");
    setIsOpen(false);
    onSelect(patient);
  };

  const handleClear = () => {
    setSelectedPatient(null);
    setSearchQuery("");
    onSelect(null);
  };

  const handleFocus = () => setIsOpen(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <Label
        htmlFor="patient-search"
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
            id="patient-search"
            type="text"
            value={selectedPatient ? selectedPatient.full_name : searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={selectedPatient ? "" : placeholder}
            className={`pl-10 pr-10 ${error ? "border-red-500" : ""}`}
            disabled={!!selectedPatient}
          />
          {selectedPatient && (
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
              ) : patients.length > 0 ? (
                <div className="py-1">
                  {patients.map((p) => (
                    <div
                      key={p.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelect(p)}
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">
                            {p.full_name}
                          </div>
                          {p.phone && (
                            <div className="text-sm text-gray-500">
                              {p.phone}
                            </div>
                          )}
                          {p.email && (
                            <div className="text-sm text-gray-500">
                              {p.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim().length >= 2 ? (
                <div className="p-4 text-center text-gray-500">
                  No patients found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Type at least 2 characters to search
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {selectedPatient && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <div>
              <div className="font-medium text-gray-900">
                {selectedPatient.full_name}
              </div>
              {selectedPatient.phone && (
                <div className="text-sm text-gray-600">
                  {selectedPatient.phone}
                </div>
              )}
              {selectedPatient.email && (
                <div className="text-sm text-gray-600">
                  {selectedPatient.email}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
