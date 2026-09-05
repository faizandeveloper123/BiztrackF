"use client";

import React, { useEffect, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search, FileText, X, Plus } from "lucide-react";
import { apiService } from "../../services/ApiService";
import { inventoryService } from "../../services/InventoryService";
import InvoiceService from "../../services/InvoiceService";
import PurchaseOrderModal from "../inventory/PurchaseOrderModal";
import { PurchaseOrder, PurchaseOrderCreate } from "../../models/inventory";

export type WorkshopDocumentLinksValue = {
  purchaseOrderId?: string;
  jobCardId?: string;
  invoiceId?: string;
};

type PurchaseOrderOption = {
  id: string;
  orderNumber: string;
  supplierName?: string;
};

type WorkshopDocumentLinksProps = {
  value: WorkshopDocumentLinksValue;
  excludeType: "purchase_order" | "job_card" | "invoice";
  onChange: (value: WorkshopDocumentLinksValue) => void;
  purchaseOrderInitialData?: Partial<PurchaseOrderCreate>;
  dense?: boolean;
};

export function WorkshopDocumentLinks({
  value,
  excludeType,
  onChange,
  purchaseOrderInitialData,
  dense = false,
}: WorkshopDocumentLinksProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderOption[]>(
    [],
  );
  const [jobCards, setJobCards] = useState<
    { id: string; job_card_number: string; title: string }[]
  >([]);
  const [invoices, setInvoices] = useState<
    { id: string; invoiceNumber: string; customerName: string }[]
  >([]);
  const [poQuery, setPoQuery] = useState("");
  const [poResults, setPoResults] = useState<PurchaseOrderOption[]>([]);
  const [poOpen, setPoOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderOption | null>(
    null,
  );
  const [showCreatePo, setShowCreatePo] = useState(false);
  const poSearchRef = useRef<HTMLDivElement>(null);

  const loadPurchaseOrders = () => {
    inventoryService
      .getPurchaseOrders(undefined, 0, 500)
      .then((res) => {
        const list = (res.purchaseOrders || []).map((po) => ({
          id: po.id,
          orderNumber: po.orderNumber,
          supplierName: po.supplierName,
        }));
        setPurchaseOrders(list);
      })
      .catch(() => setPurchaseOrders([]));
  };

  useEffect(() => {
    if (excludeType !== "purchase_order") {
      loadPurchaseOrders();
    }

    if (excludeType !== "job_card") {
      apiService
        .get("/job-cards?limit=500")
        .then((data: any) => {
          const list = Array.isArray(data) ? data : [];
          setJobCards(
            list.map((jc: any) => ({
              id: jc.id,
              job_card_number: jc.job_card_number,
              title: jc.title,
            })),
          );
        })
        .catch(() => setJobCards([]));
    }

    if (excludeType !== "invoice" && excludeType !== "job_card") {
      InvoiceService.getInvoices({}, 1, 500)
        .then((res) => {
          setInvoices(
            (res.invoices || []).map((inv) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              customerName: inv.customerName,
            })),
          );
        })
        .catch(() => setInvoices([]));
    }
  }, [excludeType]);

  useEffect(() => {
    if (!value.purchaseOrderId) {
      setSelectedPo(null);
      return;
    }

    const match = purchaseOrders.find((po) => po.id === value.purchaseOrderId);
    if (match) {
      setSelectedPo(match);
      return;
    }

    let cancelled = false;
    inventoryService
      .getPurchaseOrder(value.purchaseOrderId)
      .then((res) => {
        const po = res.purchaseOrder;
        if (cancelled || !po) return;
        setSelectedPo({
          id: po.id,
          orderNumber: po.orderNumber,
          supplierName: po.supplierName,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [value.purchaseOrderId, purchaseOrders]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        poSearchRef.current &&
        !poSearchRef.current.contains(event.target as Node)
      ) {
        setPoOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = poQuery.trim().toLowerCase();
    if (q.length < 1) {
      setPoResults([]);
      return;
    }
    setPoResults(
      purchaseOrders
        .filter((po) => {
          const hay =
            `${po.orderNumber} ${po.supplierName || ""}`.toLowerCase();
          return hay.includes(q);
        })
        .slice(0, 20),
    );
  }, [poQuery, purchaseOrders]);

  const update = (patch: Partial<WorkshopDocumentLinksValue>) => {
    onChange({ ...value, ...patch });
  };

  const handleSelectPo = (po: PurchaseOrderOption) => {
    setSelectedPo(po);
    setPoQuery("");
    setPoOpen(false);
    update({ purchaseOrderId: po.id });
  };

  const handleClearPo = () => {
    setSelectedPo(null);
    setPoQuery("");
    update({ purchaseOrderId: undefined });
  };

  const handlePoCreated = (order?: PurchaseOrder) => {
    if (order) {
      const option = {
        id: order.id,
        orderNumber: order.orderNumber,
        supplierName: order.supplierName,
      };
      setPurchaseOrders((prev) => [
        option,
        ...prev.filter((p) => p.id !== option.id),
      ]);
      setSelectedPo(option);
      update({ purchaseOrderId: option.id });
    } else {
      loadPurchaseOrders();
    }
    setShowCreatePo(false);
  };

  const showPurchaseOrder = excludeType !== "purchase_order";
  const showJobCard = excludeType !== "job_card";
  const showInvoice =
    excludeType !== "invoice" &&
    excludeType !== "job_card" &&
    excludeType !== "purchase_order";

  const inputCls = dense
    ? "h-8 rounded-md border-input bg-background pl-9 pr-10 text-sm shadow-none"
    : "pl-10 pr-10";
  const triggerCls = dense ? "h-8 text-sm shadow-none" : undefined;

  return (
    <div
      className={
        dense
          ? "space-y-2 rounded-lg border border-border bg-card px-3 py-2"
          : "space-y-3 rounded-lg border p-4"
      }
    >
      <p className={dense ? "text-sm font-semibold" : "text-sm font-medium"}>
        Linked documents
      </p>
      <div
        className={
          dense
            ? "grid grid-cols-1 gap-2 md:grid-cols-2"
            : "grid grid-cols-1 md:grid-cols-2 gap-4"
        }
      >
        {showPurchaseOrder && (
          <div
            className={
              dense ? "space-y-1.5 md:col-span-2" : "space-y-2 md:col-span-2"
            }
          >
            <div className="flex items-end gap-2">
              <div className="relative flex-1" ref={poSearchRef}>
                {!dense && <Label>Purchase order</Label>}
                {dense && (
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Purchase order
                  </span>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    value={selectedPo ? selectedPo.orderNumber : poQuery}
                    onChange={(e) => {
                      setPoQuery(e.target.value);
                      setPoOpen(true);
                    }}
                    onFocus={() => setPoOpen(true)}
                    placeholder={
                      selectedPo ? "" : "Search by order number or supplier..."
                    }
                    className={inputCls}
                    disabled={!!selectedPo}
                  />
                  {selectedPo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                      onClick={handleClearPo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {poOpen && !selectedPo && (
                  <div className="absolute left-0 right-0 z-[110] mt-1 max-h-60 overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-lg">
                    {poResults.length > 0 ? (
                      <div className="py-1">
                        {poResults.map((po) => (
                          <div
                            key={po.id}
                            className="cursor-pointer border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50"
                            onClick={() => handleSelectPo(po)}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 shrink-0 text-gray-500" />
                              <div className="min-w-0">
                                <div className="truncate font-medium text-gray-900">
                                  {po.orderNumber}
                                </div>
                                {po.supplierName && (
                                  <div className="truncate text-sm text-gray-500">
                                    {po.supplierName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : poQuery.trim().length >= 1 ? (
                      <div className="p-4 text-center text-gray-500">
                        No purchase orders found for &quot;{poQuery}&quot;
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Type to search purchase orders
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size={dense ? "sm" : "default"}
                className={dense ? "h-8 shrink-0" : "shrink-0"}
                onClick={() => setShowCreatePo(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                New
              </Button>
            </div>
            {selectedPo && (
              <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {selectedPo.orderNumber}
                  </div>
                  {selectedPo.supplierName && (
                    <div className="truncate text-xs text-gray-500">
                      {selectedPo.supplierName}
                    </div>
                  )}
                </div>
                <Badge variant="outline">PO</Badge>
              </div>
            )}
          </div>
        )}

        {showJobCard && (
          <div className={dense ? "space-y-1" : "space-y-2"}>
            {dense ? (
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Job card
              </span>
            ) : (
              <Label>Job card</Label>
            )}
            <Select
              value={value.jobCardId || "none"}
              onValueChange={(v) =>
                update({ jobCardId: v === "none" ? undefined : v })
              }
            >
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Select job card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {jobCards.map((jc) => (
                  <SelectItem key={jc.id} value={jc.id}>
                    {jc.job_card_number} – {jc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showInvoice && (
          <div className={dense ? "space-y-1" : "space-y-2"}>
            {dense ? (
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Invoice
              </span>
            ) : (
              <Label>Invoice</Label>
            )}
            <Select
              value={value.invoiceId || "none"}
              onValueChange={(v) =>
                update({ invoiceId: v === "none" ? undefined : v })
              }
            >
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {invoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} – {inv.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {showPurchaseOrder && (
        <PurchaseOrderModal
          isOpen={showCreatePo}
          onClose={() => setShowCreatePo(false)}
          onSuccess={handlePoCreated}
          title="Create Purchase Order"
          showOrderDate={true}
          showSupplierCount={true}
          showAddSupplierButton={true}
          useToastNotifications={true}
          initialData={purchaseOrderInitialData}
          hideJobCardLink={excludeType === "job_card"}
        />
      )}
    </div>
  );
}
