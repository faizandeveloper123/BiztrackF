"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, User } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "@/src/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

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

  const selectedUsers = users.filter((u) => selectedIds.includes(getUserId(u)));

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (mode === "pm") return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[80vh] w-[calc(100vw-1.5rem)] max-w-lg flex-col",
          "gap-0 overflow-hidden bg-white p-0",
        )}
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-14 text-left">
          <DialogTitle className="text-base font-semibold">
            {title} ({selectedUsers.length}
            {mode === "team" ? " selected" : ""})
          </DialogTitle>
        </DialogHeader>

        <div className="relative shrink-0 px-5 py-3">
          <Search className="absolute left-8 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              mode === "pm"
                ? "Search users..."
                : "Search to add team members..."
            }
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
                      selected
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {selected && <span className="text-xs leading-none">✓</span>}
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

        <DialogFooter className="shrink-0 border-t px-5 py-4">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
