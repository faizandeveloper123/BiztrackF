"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@/src/services/CustomerService";
import type { Product } from "@/src/models/pos";
import type { InvoiceItemCreate } from "@/src/models/sales";
import InvoiceService from "@/src/services/InvoiceService";
import {
  filterProducts,
  itemFieldKey,
  parseDraftNumber,
  sumItemDiscountAmount,
  sumItemQuantities,
  type CommerceItemNumericField,
  type CommerceItemTextField,
} from "@/src/utils/sales/commerceInvoiceUtils";

type UseCommerceInvoiceFormUiOptions = {
  items: InvoiceItemCreate[];
  products: Product[];
  onUpdateItem: (index: number, patch: Partial<InvoiceItemCreate>) => void;
};

export function useCommerceInvoiceFormUi({
  items,
  products,
  onUpdateItem,
}: UseCommerceInvoiceFormUiOptions) {
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [itemFieldDrafts, setItemFieldDrafts] = useState<
    Record<string, string>
  >({});

  const filteredProducts = useMemo(
    () => filterProducts(products, productSearch),
    [products, productSearch],
  );

  const totalQuantity = useMemo(() => sumItemQuantities(items), [items]);
  const totalItemDiscount = useMemo(
    () => sumItemDiscountAmount(items),
    [items],
  );

  useEffect(() => {
    setItemFieldDrafts({});
  }, [items.length]);

  useEffect(() => {
    const q = customerSearch.trim();
    if (q.length < 2) {
      setCustomerOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await InvoiceService.searchCustomers(q, 20);
        setCustomerOptions(results);
      } catch {
        setCustomerOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const getItemFieldValue = (
    index: number,
    field: CommerceItemNumericField,
    fallback: number,
  ) => {
    const draft = itemFieldDrafts[itemFieldKey(index, field)];
    return draft !== undefined ? draft : String(fallback);
  };

  const normalizeNumericField = (
    field: CommerceItemNumericField,
    parsed: number,
  ): number => {
    if (field === "discount") {
      return Math.min(100, Math.max(0, parsed));
    }
    if (field === "quantity") {
      return Math.max(0.01, parsed);
    }
    if (field === "salePrice") {
      return Math.max(0, parsed);
    }
    return parsed;
  };

  const getItemTextFieldValue = (
    index: number,
    field: CommerceItemTextField,
    fallback: string,
  ) => {
    const draft = itemFieldDrafts[itemFieldKey(index, field)];
    return draft !== undefined ? draft : fallback;
  };

  const handleItemFieldChange = (
    index: number,
    field: CommerceItemNumericField,
    raw: string,
  ) => {
    setItemFieldDrafts((prev) => ({
      ...prev,
      [itemFieldKey(index, field)]: raw,
    }));
    const parsed = parseDraftNumber(raw);
    if (parsed !== null) {
      onUpdateItem(index, { [field]: normalizeNumericField(field, parsed) });
    }
  };

  const handleItemFieldBlur = (
    index: number,
    field: CommerceItemNumericField,
  ) => {
    const key = itemFieldKey(index, field);
    const raw = itemFieldDrafts[key];
    if (raw !== undefined) {
      const parsed = parseDraftNumber(raw);
      if (parsed !== null) {
        onUpdateItem(index, { [field]: normalizeNumericField(field, parsed) });
      }
    }
    setItemFieldDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleItemTextFieldChange = (
    index: number,
    field: CommerceItemTextField,
    raw: string,
  ) => {
    setItemFieldDrafts((prev) => ({
      ...prev,
      [itemFieldKey(index, field)]: raw,
    }));
    onUpdateItem(index, { [field]: raw });
  };

  const handleItemTextFieldBlur = (
    index: number,
    field: CommerceItemTextField,
  ) => {
    const key = itemFieldKey(index, field);
    setItemFieldDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return {
    productSearch,
    setProductSearch,
    customerSearch,
    setCustomerSearch,
    customerOptions,
    paidAmount,
    setPaidAmount,
    filteredProducts,
    totalQuantity,
    totalItemDiscount,
    getItemFieldValue,
    getItemTextFieldValue,
    handleItemFieldChange,
    handleItemFieldBlur,
    handleItemTextFieldChange,
    handleItemTextFieldBlur,
  };
}
