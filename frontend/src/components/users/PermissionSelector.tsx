"use client";

import React, { useMemo, useState } from "react";
import { Search, ChevronDown, CheckSquare, X, ShieldCheck } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  RBAC_PERMISSION_MODULES,
  type PermissionModule,
} from "@/src/constants/rbacPermissions";

type PermissionSelectorProps = {
  value: string[];
  onChange: (permissions: string[]) => void;
};

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  view: {
    label: "View",
    className:
      "data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600",
  },
  create: {
    label: "Create",
    className:
      "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600",
  },
  update: {
    label: "Update",
    className:
      "data-[active=true]:bg-amber-600 data-[active=true]:text-white data-[active=true]:border-amber-600",
  },
  delete: {
    label: "Delete",
    className:
      "data-[active=true]:bg-red-600 data-[active=true]:text-white data-[active=true]:border-red-600",
  },
  export: {
    label: "Export",
    className:
      "data-[active=true]:bg-purple-600 data-[active=true]:text-white data-[active=true]:border-purple-600",
  },
};

function actionOf(permission: string): string {
  const parts = permission.split(":");
  return parts[parts.length - 1];
}

export function PermissionSelector({
  value,
  onChange,
}: PermissionSelectorProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const selected = useMemo(() => new Set(value), [value]);

  const allModulePermissionValues = useMemo(
    () =>
      RBAC_PERMISSION_MODULES.flatMap((module) =>
        [
          ...module.permissions.map((p) => p.value),
          ...module.submodules.flatMap((sub) =>
            sub.permissions.map((p) => p.value),
          ),
        ],
      ),
    [],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const setPermission = (permission: string, on: boolean) => {
    const parts = permission.split(":");
    const action = parts[parts.length - 1];
    const next = new Set(selected);
    if (on) {
      next.add(permission);
      if (["create", "update", "delete"].includes(action)) {
        const viewPermission =
          parts.length === 3
            ? `${parts[0]}:${parts[1]}:view`
            : `${parts[0]}:view`;
        next.add(viewPermission);
      }
    } else {
      next.delete(permission);
      if (action === "view") {
        // Removing the base view also removes any create/update/delete on the
        // same resource (3-segment) or module (2-segment).
        for (const candidate of Array.from(next)) {
          const candidateParts = candidate.split(":");
          const candidateAction =
            candidateParts[candidateParts.length - 1];
          if (!["create", "update", "delete"].includes(candidateAction)) {
            continue;
          }
          if (parts.length === 3 && candidateParts.length === 3) {
            if (
              candidateParts[0] === parts[0] &&
              candidateParts[1] === parts[1]
            ) {
              next.delete(candidate);
            }
          } else if (parts.length === 2 && candidateParts.length === 2) {
            if (candidateParts[0] === parts[0]) {
              next.delete(candidate);
            }
          }
        }
      }
    }
    onChange(Array.from(next));
  };

  const toggleGroup = (permissionValues: string[], on: boolean) => {
    const next = new Set(selected);
    for (const permission of permissionValues) {
      const action = actionOf(permission);
      if (on) {
        next.add(permission);
        if (["create", "update", "delete"].includes(action)) {
          const parts = permission.split(":");
          const viewPermission =
            parts.length === 3
              ? `${parts[0]}:${parts[1]}:view`
              : `${parts[0]}:view`;
          next.add(viewPermission);
        }
      } else {
        next.delete(permission);
      }
    }
    onChange(Array.from(next));
  };

  const toggleModule = (module: PermissionModule, on: boolean) => {
    const values = moduleValueList(module);
    toggleGroup(values, on);
  };

  const filteredModules = useMemo(() => {
    if (!normalizedQuery) return RBAC_PERMISSION_MODULES;
    return RBAC_PERMISSION_MODULES.map((module) => {
      const submodules = module.submodules.filter((sub) => {
        const subLabel = sub.label.toLowerCase();
        if (subLabel.includes(normalizedQuery)) return true;
        return sub.permissions.some((p) =>
          p.label.toLowerCase().includes(normalizedQuery),
        );
      });
      const topMatches = module.permissions.some((p) =>
        p.label.toLowerCase().includes(normalizedQuery),
      );
      return { ...module, submodules, topMatches };
    }).filter(
      (module) =>
        module.label.toLowerCase().includes(normalizedQuery) ||
        module.topMatches ||
        module.submodules.length > 0,
    );
  }, [normalizedQuery]);

  const totalCount = RBAC_PERMISSION_MODULES.reduce(
    (sum, module) => sum + moduleValueList(module).length,
    0,
  );
  const selectedCount = selected.size;

  if (RBAC_PERMISSION_MODULES.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search permissions, e.g. customers, invoices, view..."
            className="pl-8 h-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleGroup(allModulePermissionValues, true)}
          className="h-9"
        >
          <CheckSquare className="h-4 w-4 mr-1.5" />
          Select all
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([])}
          className="h-9"
        >
          <X className="h-4 w-4 mr-1.5" />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gradient" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          {selectedCount} of {totalCount} permissions
        </Badge>
        {selectedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            Selecting Create/Update/Delete automatically grants View.
          </span>
        )}
      </div>

      <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
        {filteredModules.map((module) => (
          <ModuleCard
            key={module.label}
            module={module}
            selected={selected}
            expanded={expanded}
            setExpanded={setExpanded}
            onTogglePermission={setPermission}
            onToggleGroup={toggleGroup}
            onToggleModule={toggleModule}
            query={normalizedQuery}
          />
        ))}
        {filteredModules.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No permissions match &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
}

function moduleValueList(module: PermissionModule): string[] {
  return [
    ...module.permissions.map((p) => p.value),
    ...module.submodules.flatMap((sub) => sub.permissions.map((p) => p.value)),
  ];
}

function checkboxState(
  values: string[],
  selected: Set<string>,
): boolean | "indeterminate" {
  const selectedValues = values.filter((v) => selected.has(v));
  if (selectedValues.length === 0) return false;
  if (selectedValues.length === values.length) return true;
  return "indeterminate";
}

type ModuleCardProps = {
  module: PermissionModule;
  selected: Set<string>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  onTogglePermission: (permission: string, on: boolean) => void;
  onToggleGroup: (permissions: string[], on: boolean) => void;
  onToggleModule: (module: PermissionModule, on: boolean) => void;
  query: string;
};

function ModuleCard({
  module,
  selected,
  expanded,
  setExpanded,
  onTogglePermission,
  onToggleGroup,
  onToggleModule,
  query,
}: ModuleCardProps) {
  const values = moduleValueList(module);
  const state = checkboxState(values, selected);
  const selectedInModule = values.filter((v) => selected.has(v)).length;
  const isExpanded = expanded[module.label] ?? false;

  const moduleActions = new Set(
    values.filter((v) => selected.has(v)).map(actionOf),
  );

  const quickActions = ["view", "create", "update", "delete", "export"].filter(
    (action) => values.some((v) => actionOf(v) === action),
  );

  const quickActionValues = (action: string) =>
    values.filter((v) => actionOf(v) === action);

  const toggleQuickAction = (action: string, on: boolean) => {
    onToggleGroup(quickActionValues(action), on);
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        state === true
          ? "border-emerald-300 bg-emerald-50/50"
          : state === "indeterminate"
            ? "border-blue-200 bg-blue-50/40"
            : "border-border",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Checkbox
          checked={state}
          onCheckedChange={(checked) => onToggleModule(module, !!checked)}
          aria-label={`Select all ${module.label} permissions`}
        />
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() =>
            setExpanded((prev) => ({
              ...prev,
              [module.label]: !prev[module.label],
            }))
          }
        >
          <span className="truncate text-sm font-semibold">{module.label}</span>
          <Badge variant="outline" className="shrink-0 text-xs">
            {selectedInModule}/{values.length}
          </Badge>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t px-3 py-2.5">
          {query ? (
            <FilteredModuleContent
              module={module}
              selected={selected}
              onTogglePermission={onTogglePermission}
              onToggleGroup={onToggleGroup}
              query={query}
            />
          ) : (
            <>
              {quickActions.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Quick select:
                  </span>
                  {quickActions.map((action) => {
                    const active = moduleActions.has(action);
                    const meta = ACTION_LABELS[action];
                    return (
                      <button
                        key={action}
                        type="button"
                        data-active={active}
                        onClick={() => toggleQuickAction(action, !active)}
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                          meta?.className ||
                            "data-[active=true]:bg-slate-700 data-[active=true]:text-white",
                        )}
                      >
                        {meta?.label ?? action}
                      </button>
                    );
                  })}
                </div>
              )}

              {module.permissions.length > 0 && (
                <div className="mb-1 space-y-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Module
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {module.permissions.map((permission) => (
                      <ActionChip
                        key={permission.value}
                        permission={permission.value}
                        label={permission.label}
                        active={selected.has(permission.value)}
                        onToggle={onTogglePermission}
                      />
                    ))}
                  </div>
                </div>
              )}

              {module.submodules.map((sub) => {
                const subValues = sub.permissions.map((p) => p.value);
                const subState = checkboxState(subValues, selected);
                const subActions = new Set(
                  subValues.filter((v) => selected.has(v)).map(actionOf),
                );
                return (
                  <div
                    key={sub.label}
                    className={cn(
                      "mb-2 rounded-md border p-2",
                      subState === true
                        ? "border-emerald-200 bg-emerald-50/40"
                        : subState === "indeterminate"
                          ? "border-blue-200 bg-blue-50/30"
                          : "border-border",
                    )}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Checkbox
                        checked={subState}
                        onCheckedChange={(checked) =>
                          onToggleGroup(subValues, !!checked)
                        }
                        aria-label={`Select all ${sub.label} permissions`}
                      />
                      <span className="text-sm font-medium">{sub.label}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {subValues.filter((v) => selected.has(v)).length}/
                        {subValues.length}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {sub.permissions.map((permission) => (
                        <ActionChip
                          key={permission.value}
                          permission={permission.value}
                          label={permission.label}
                          active={selected.has(permission.value)}
                          onToggle={onTogglePermission}
                        />
                      ))}
                    </div>
                    {subActions.size > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-6">
                        <span className="text-[11px] text-muted-foreground">
                          Quick:
                        </span>
                        {sub.permissions.map((permission) => {
                          const action = actionOf(permission.value);
                          const active = selected.has(permission.value);
                          return (
                            <button
                              key={permission.value}
                              type="button"
                              data-active={active}
                              onClick={() =>
                                onTogglePermission(permission.value, !active)
                              }
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                                ACTION_LABELS[action]?.className ||
                                  "data-[active=true]:bg-slate-700 data-[active=true]:text-white",
                              )}
                            >
                              {ACTION_LABELS[action]?.label ?? action}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FilteredModuleContent({
  module,
  selected,
  onTogglePermission,
  onToggleGroup,
  query,
}: {
  module: PermissionModule;
  selected: Set<string>;
  onTogglePermission: (permission: string, on: boolean) => void;
  onToggleGroup: (permissions: string[], on: boolean) => void;
  query: string;
}) {
  const topMatches = module.permissions.filter(
    (p) =>
      p.label.toLowerCase().includes(query) || p.value.includes(query),
  );
  const subMatches = module.submodules
    .map((sub) => ({
      ...sub,
      permissions: sub.permissions.filter(
        (p) =>
          sub.label.toLowerCase().includes(query) ||
          p.label.toLowerCase().includes(query) ||
          p.value.includes(query),
      ),
    }))
    .filter((sub) => sub.permissions.length > 0);

  return (
    <div className="space-y-2">
      {topMatches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topMatches.map((permission) => (
            <ActionChip
              key={permission.value}
              permission={permission.value}
              label={permission.label}
              active={selected.has(permission.value)}
              onToggle={onTogglePermission}
            />
          ))}
        </div>
      )}
      {subMatches.map((sub) => {
        const subValues = sub.permissions.map((p) => p.value);
        return (
          <div key={sub.label} className="rounded-md border p-2">
            <div className="mb-1.5 flex items-center gap-2">
              <Checkbox
                checked={checkboxState(subValues, selected)}
                onCheckedChange={(checked) =>
                  onToggleGroup(subValues, !!checked)
                }
                aria-label={`Select all ${sub.label} permissions`}
              />
              <span className="text-sm font-medium">{sub.label}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-6">
              {sub.permissions.map((permission) => (
                <ActionChip
                  key={permission.value}
                  permission={permission.value}
                  label={permission.label}
                  active={selected.has(permission.value)}
                  onToggle={onTogglePermission}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionChip({
  permission,
  label,
  active,
  onToggle,
}: {
  permission: string;
  label: string;
  active: boolean;
  onToggle: (permission: string, on: boolean) => void;
}) {
  const action = actionOf(permission);
  const meta = ACTION_LABELS[action];
  return (
    <button
      type="button"
      data-active={active}
      onClick={() => onToggle(permission, !active)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        active
          ? meta?.className ||
              "border-slate-700 bg-slate-700 text-white"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
