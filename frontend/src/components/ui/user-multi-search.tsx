"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { Search, User, X } from "lucide-react";

export interface UserMultiSearchItem {
  id?: string;
  userId?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface UserMultiSearchProps {
  users: UserMultiSearchItem[];
  value: UserMultiSearchItem[];
  onChange: (selected: UserMultiSearchItem[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

function getUserId(u: UserMultiSearchItem): string {
  return u.id || u.userId || "";
}

function getDisplayName(u: UserMultiSearchItem): string {
  if (u.firstName || u.lastName) {
    return [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  }
  return u.userName || u.email || "Unknown";
}

export function UserMultiSearch({
  users,
  value,
  onChange,
  placeholder = "Search by name or email to add...",
  label = "Team members",
  className = "",
  disabled = false,
}: UserMultiSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const selectedIds = useMemo(
    () => new Set(value.map((u) => getUserId(u))),
    [value],
  );

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim())
      return users.filter((u) => !selectedIds.has(getUserId(u))).slice(0, 20);
    const q = searchQuery.toLowerCase().trim();
    return users
      .filter((u) => {
        if (selectedIds.has(getUserId(u))) return false;
        const name = getDisplayName(u).toLowerCase();
        const email = (u.email || "").toLowerCase();
        const userName = (u.userName || "").toLowerCase();
        return name.includes(q) || email.includes(q) || userName.includes(q);
      })
      .slice(0, 20);
  }, [users, searchQuery, selectedIds]);

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

  const handleAdd = (user: UserMultiSearchItem) => {
    if (selectedIds.has(getUserId(user))) return;
    onChange([...value, user]);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleRemove = (user: UserMultiSearchItem) => {
    onChange(value.filter((u) => getUserId(u) !== getUserId(user)));
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <Label htmlFor="user-multi-search">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          id="user-multi-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      {isOpen && (
        <Card className="absolute z-[110] w-full mt-1 max-h-60 overflow-y-auto shadow-lg border">
          <CardContent className="p-0">
            {filteredUsers.length > 0 ? (
              <div className="py-1">
                {filteredUsers.map((user) => (
                  <div
                    key={getUserId(user)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                    onClick={() => handleAdd(user)}
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {getDisplayName(user)}
                      </div>
                      {user.email && (
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchQuery.trim()
                  ? selectedIds.size &&
                    !users.some((u) => !selectedIds.has(getUserId(u)))
                    ? "All users already added"
                    : `No users found for "${searchQuery}"`
                  : "Type to search and add team members"}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((user) => (
            <Badge
              key={getUserId(user)}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              {getDisplayName(user)}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(user);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
