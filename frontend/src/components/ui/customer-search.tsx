"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { Badge } from "./badge";
import { Search, User, Building, X, Check } from "lucide-react";
import { Customer } from "../../services/CustomerService";
import InvoiceService from "../../services/InvoiceService";
import { getCustomerDisplayName } from "@/src/utils/customerUtils";

interface CustomerSearchProps {
  value?: Customer | null;
  onSelect: (customer: Customer | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function CustomerSearch({
  value,
  onSelect,
  placeholder = "Search customers...",
  label = "Customer",
  required = false,
  error,
  className = "",
}: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    value || null,
  );
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search customers when query changes
  useEffect(() => {
    const searchCustomers = async () => {
      if (searchQuery.trim().length < 2) {
        setCustomers([]);
        return;
      }

      setLoading(true);
      try {
        const results = await InvoiceService.searchCustomers(
          searchQuery.trim(),
          10,
        );
        setCustomers(results);
      } catch (error) {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Update selected customer when value prop changes
  useEffect(() => {
    setSelectedCustomer(value || null);
  }, [value]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery("");
    setIsOpen(false);
    onSelect(customer);
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
    onSelect(null);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const getCustomerTypeIcon = (customer: Customer) => {
    return customer.customerType === "business" ? (
      <Building className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  const getCustomerStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <Label
        htmlFor="customer-search"
        className={
          required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
        }
      >
        {label}
      </Label>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={inputRef}
            id="customer-search"
            type="text"
            value={
              selectedCustomer
                ? getCustomerDisplayName(selectedCustomer)
                : searchQuery
            }
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={selectedCustomer ? "" : placeholder}
            className={`pl-10 pr-10 ${error ? "border-red-500" : ""}`}
            disabled={!!selectedCustomer}
          />
          {selectedCustomer && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-[110] left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-lg">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  Searching customers...
                </div>
              </div>
            ) : customers.length > 0 ? (
              <div className="py-1">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCustomerTypeIcon(customer)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {getCustomerDisplayName(customer)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getCustomerStatusColor(
                            customer.customerStatus,
                          )}
                        >
                          {customer.customerStatus}
                        </Badge>
                        {selectedCustomer?.id === customer.id && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                No customers found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Type at least 2 characters to search customers
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getCustomerTypeIcon(selectedCustomer)}
              <div>
                <div className="font-medium text-gray-900">
                  {getCustomerDisplayName(selectedCustomer)}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedCustomer.email}
                </div>
                {selectedCustomer.phone && (
                  <div className="text-sm text-gray-600">
                    {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="text-sm text-gray-600">
                    {selectedCustomer.address}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={getCustomerStatusColor(
                  selectedCustomer.customerStatus,
                )}
              >
                {selectedCustomer.customerStatus}
              </Badge>
              <Badge variant="outline">{selectedCustomer.customerType}</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
