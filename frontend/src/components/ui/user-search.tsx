"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Search, User, X, Check, Plus } from "lucide-react";

export interface UserSearchItem {
  id?: string;
  userId?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface UserSearchProps {
  users: UserSearchItem[];
  value?: UserSearchItem | null;
  onSelect: (user: UserSearchItem | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

function getUserId(u: UserSearchItem): string {
  return u.id || u.userId || "";
}

function getDisplayName(u: UserSearchItem): string {
  if (u.firstName || u.lastName) {
    return [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  }
  return u.userName || u.email || "Unknown";
}

export function UserSearch({
  users,
  value,
  onSelect,
  placeholder = "Search by name or email...",
  label = "User",
  required = false,
  error,
  className = "",
  disabled = false,
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(
    value ?? null,
  );
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users.slice(0, 20);
    const q = searchQuery.toLowerCase().trim();
    return users
      .filter((u) => {
        const name = getDisplayName(u).toLowerCase();
        const email = (u.email || "").toLowerCase();
        const userName = (u.userName || "").toLowerCase();
        return name.includes(q) || email.includes(q) || userName.includes(q);
      })
      .slice(0, 20);
  }, [users, searchQuery]);

  useEffect(() => {
    setSelectedUser(value ?? null);
  }, [value]);

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

  const handleSelect = (user: UserSearchItem) => {
    setSelectedUser(user);
    setSearchQuery("");
    setIsOpen(false);
    onSelect(user);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setSearchQuery("");
    onSelect(null);
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <Label
        htmlFor="user-search"
        className={
          required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
        }
      >
        {label}
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          id="user-search"
          type="text"
          value={selectedUser ? getDisplayName(selectedUser) : searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedUser ? "" : placeholder}
          className={`pl-10 pr-10 ${error ? "border-red-500" : ""}`}
          disabled={disabled || !!selectedUser}
        />
        {selectedUser && (
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
        {!selectedUser && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setIsOpen(true)}
            aria-label="Choose project manager"
          >
            <Plus className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>
      {isOpen && !selectedUser && (
        <Card className="absolute z-[110] w-full mt-1 max-h-60 overflow-y-auto shadow-lg border">
          <CardContent className="p-0">
            {filteredUsers.length > 0 ? (
              <div className="py-1">
                {filteredUsers.map((user) => (
                  <div
                    key={getUserId(user)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-2"
                    onClick={() => handleSelect(user)}
                  >
                    <div className="flex items-center gap-3">
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
                    {value && getUserId(value) === getUserId(user) && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchQuery.trim()
                  ? `No users found for "${searchQuery}"`
                  : "Type to search users"}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {selectedUser && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium text-gray-900">
                {getDisplayName(selectedUser)}
              </div>
              {selectedUser.email && (
                <div className="text-sm text-gray-600">
                  {selectedUser.email}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
