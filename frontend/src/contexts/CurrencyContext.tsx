"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import InvoiceCustomizationService from "../services/InvoiceCustomizationService";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number, customCurrency?: string) => string;
  getCurrencySymbol: (customCurrency?: string) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>("USD");
  const [loading, setLoading] = useState(true);
  const { user, currentTenant } = useAuth();

  useEffect(() => {
    if (user && currentTenant) {
      loadCurrencySettings();
    } else if (user && !currentTenant) {
      // User is logged in but no tenant selected yet (e.g., during tenant creation)
      setLoading(false);
    } else {
      // No user logged in
      setLoading(false);
    }
  }, [user, currentTenant]);

  const loadCurrencySettings = async () => {
    try {
      setLoading(true);
      const customization =
        await InvoiceCustomizationService.getCustomization();
      setCurrencyState(customization.default_currency || "USD");
    } catch (error: any) {
      if (
        error?.response?.status === 400 &&
        error?.response?.data?.detail?.includes("Tenant context required")
      ) {
      }
      setCurrencyState("USD");
    } finally {
      setLoading(false);
    }
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  const formatCurrency = (amount: number, customCurrency?: string): string => {
    if (amount == null || isNaN(amount)) {
      return "N/A";
    }
    const currencyToUse = customCurrency || currency;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyToUse,
    }).format(amount);
  };

  const getCurrencySymbol = (customCurrency?: string): string => {
    const currencyToUse = customCurrency || currency;
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyToUse,
    });
    return (
      formatter.formatToParts(0).find((part) => part.type === "currency")
        ?.value || "$"
    );
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        getCurrencySymbol,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
