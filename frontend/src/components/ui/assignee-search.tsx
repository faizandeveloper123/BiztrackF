"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Badge } from "./badge";
import { Search, User, Users, X, Briefcase } from "lucide-react";
import { apiService } from "../../services/ApiService";
import HRMService from "../../services/HRMService";
import { EmploymentStatus } from "../../models/hrm";

export type AssigneeOption = {
  id: string;
  name: string;
  email?: string;
  detail?: string;
  sources: Array<"user" | "employee">;
};

interface AssigneeSearchProps {
  value?: AssigneeOption | null;
  onSelect: (assignee: AssigneeOption | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

function normalizeName(first?: string, last?: string, fallback?: string) {
  const full = `${first || ""} ${last || ""}`.trim();
  return full || fallback || "";
}

function matchesQuery(option: AssigneeOption, q: string) {
  const hay =
    `${option.name} ${option.email || ""} ${option.detail || ""}`.toLowerCase();
  return hay.includes(q);
}

export function AssigneeSearch({
  value,
  onSelect,
  placeholder = "Search users or employees...",
  label = "Assigned to",
  required = false,
  error,
  className = "",
}: AssigneeSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<AssigneeOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AssigneeOption | null>(
    value || null,
  );
  const [options, setOptions] = useState<AssigneeOption[]>([]);
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
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const tenantId = apiService.getTenantId();
        const [usersRes, employeesRes] = await Promise.all([
          tenantId
            ? apiService.getTenantUsers(tenantId).catch(() => ({ users: [] }))
            : Promise.resolve({ users: [] }),
          HRMService.getEmployees(undefined, 1, 100).catch(() => ({
            employees: [],
          })),
        ]);

        const list = (usersRes as any)?.users ?? usersRes ?? [];
        const userOptions: AssigneeOption[] = (Array.isArray(list) ? list : [])
          .filter((u: any) => u.isActive !== false)
          .map((u: any) => {
            const id = u.id || u.userId;
            if (!id) return null;
            return {
              id: String(id),
              name: normalizeName(
                u.firstName,
                u.lastName,
                u.userName || u.email || String(id),
              ),
              email: u.email,
              detail: u.userName ? `@${u.userName}` : undefined,
              sources: ["user"] as Array<"user" | "employee">,
            };
          })
          .filter(Boolean) as AssigneeOption[];

        const employeeOptions: AssigneeOption[] = (
          (employeesRes as any).employees || []
        )
          .filter(
            (emp: any) =>
              !emp.employmentStatus ||
              emp.employmentStatus === EmploymentStatus.ACTIVE,
          )
          .map((emp: any) => {
            const userId = emp.createdBy;
            if (!userId) return null;
            return {
              id: String(userId),
              name: normalizeName(
                emp.firstName,
                emp.lastName,
                emp.email || emp.employeeId,
              ),
              email: emp.email,
              detail: [emp.position, emp.employeeId]
                .filter(Boolean)
                .join(" · "),
              sources: ["employee"] as Array<"user" | "employee">,
            };
          })
          .filter(Boolean) as AssigneeOption[];

        const byId = new Map<string, AssigneeOption>();
        for (const option of [...userOptions, ...employeeOptions]) {
          const existing = byId.get(option.id);
          if (!existing) {
            byId.set(option.id, { ...option, sources: [...option.sources] });
            continue;
          }
          const sources = Array.from(
            new Set([...existing.sources, ...option.sources]),
          ) as Array<"user" | "employee">;
          byId.set(option.id, {
            ...existing,
            name: option.sources.includes("employee")
              ? option.name
              : existing.name,
            email: existing.email || option.email,
            detail: option.detail || existing.detail,
            sources,
          });
        }

        if (!cancelled) setOptions(Array.from(byId.values()));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelected(value || null);
  }, [value]);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setResults(
      options.filter((option) => matchesQuery(option, q)).slice(0, 20),
    );
  }, [searchQuery, options]);

  const handleSelect = (option: AssigneeOption) => {
    setSelected(option);
    setSearchQuery("");
    setIsOpen(false);
    onSelect(option);
  };

  const handleClear = () => {
    setSelected(null);
    setSearchQuery("");
    onSelect(null);
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <Label
        className={
          required ? "after:content-['*'] after:ml-1 after:text-red-500" : ""
        }
      >
        {label}
      </Label>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            value={selected ? selected.name : searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={selected ? "" : placeholder}
            className={`pl-10 pr-10 ${error ? "border-red-500" : ""}`}
            disabled={!!selected}
          />
          {selected && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isOpen && !selected && (
          <div className="absolute left-0 right-0 z-[110] mt-1 max-h-60 overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-lg">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
                  Loading...
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                {results.map((option) => (
                  <div
                    key={option.id}
                    className="cursor-pointer border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50"
                    onClick={() => handleSelect(option)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {option.sources.includes("employee") ? (
                          <Briefcase className="h-4 w-4 shrink-0 text-gray-500" />
                        ) : (
                          <User className="h-4 w-4 shrink-0 text-gray-500" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-900">
                            {option.name}
                          </div>
                          {option.email && (
                            <div className="truncate text-sm text-gray-500">
                              {option.email}
                            </div>
                          )}
                          {option.detail && (
                            <div className="truncate text-sm text-gray-500">
                              {option.detail}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {option.sources.includes("user") && (
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            User
                          </Badge>
                        )}
                        {option.sources.includes("employee") && (
                          <Badge variant="outline" className="gap-1">
                            <Briefcase className="h-3 w-3" />
                            Employee
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length >= 1 ? (
              <div className="p-4 text-center text-gray-500">
                No users or employees found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Type to search users and employees
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
