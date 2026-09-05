"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, User, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export interface UserAssignItem {
  id?: string;
  userId?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface UserAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  mode: "pm" | "team";
  users: UserAssignItem[];
  initialSelectedIds: string[];
  onConfirm: (selected: UserAssignItem[]) => void;
}

function getUserId(u: UserAssignItem): string {
  return u.id || u.userId || "";
}

function getDisplayName(u: UserAssignItem): string {
  if (u.firstName || u.lastName) {
    return [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  }
  return u.userName || u.email || "Unknown";
}

export function UserAssignDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  mode,
  users,
  initialSelectedIds,
  onConfirm,
}: UserAssignDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds);
      setSearchQuery("");
    }
  }, [open, initialSelectedIds]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const name = getDisplayName(u).toLowerCase();
      const email = (u.email || "").toLowerCase();
      const userName = (u.userName || "").toLowerCase();
      return name.includes(q) || email.includes(q) || userName.includes(q);
    });
  }, [users, searchQuery]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (mode === "pm") return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const selectedUsers = users.filter((u) => selectedIds.includes(getUserId(u)));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            {title} ({selectedUsers.length}
            {mode === "team" ? " selected" : ""})
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative shrink-0 px-5 py-3">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mode === "pm" ? "Search users..." : "Search to add team members..."}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {filteredUsers.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              {users.length === 0
                ? "No team members found. Add them from the Team page first."
                : searchQuery.trim()
                  ? `No users found for "${searchQuery}"`
                  : "No users available"}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const id = getUserId(user);
              const selected = selectedIds.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors ${
                    selected ? "bg-indigo-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      mode === "pm"
                        ? selected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-gray-300"
                        : selected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-gray-300"
                    }`}
                  >
                    {selected &&
                      (mode === "pm" ? (
                        <span className="text-xs leading-none">✓</span>
                      ) : (
                        <span className="text-xs leading-none">✓</span>
                      ))}
                  </span>
                  <User className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {getDisplayName(user)}
                    </span>
                    {user.email && (
                      <span className="block truncate text-xs text-gray-500">
                        {user.email}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="modern-button"
            disabled={selectedIds.length === 0}
            onClick={() => {
              onConfirm(selectedUsers);
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}