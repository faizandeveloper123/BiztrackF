"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { CustomerSearch } from "../ui/customer-search";
import { VehicleSearch } from "../ui/vehicle-search";
import { AssigneeSearch, AssigneeOption } from "../ui/assignee-search";
import { CreateCustomerDialog } from "../crm/CreateCustomerDialog";
import VehicleDialog from "./VehicleDialog";
import { Plus, Trash2 } from "lucide-react";
import { apiService } from "../../services/ApiService";
import { Customer } from "../../services/CustomerService";
import {
  JobCard,
  JobCardCreate,
  JobCardItem,
  JobCardUpdate,
  Vehicle,
} from "../../models/workshop";
import {
  WorkshopDocumentLinks,
  WorkshopDocumentLinksValue,
} from "./WorkshopDocumentLinks";
import { usePlanInfo } from "../../hooks/usePlanInfo";
import { usePermissions } from "../../hooks/usePermissions";
import type { Product } from "../../models/pos";

interface JobCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  jobCard?: JobCard | null;
  onSuccess: (jobCard?: JobCard) => void;
}

export default function JobCardDialog({
  open,
  onOpenChange,
  mode,
  jobCard,
  onSuccess,
}: JobCardDialogProps) {
  const { planInfo } = usePlanInfo();
  const { hasPermission } = usePermissions();
  const isWorkshop = planInfo?.planType === "workshop";
  const canCreateCustomer =
    hasPermission("crm:customers:create") || hasPermission("crm:create");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedAssignee, setSelectedAssignee] =
    useState<AssigneeOption | null>(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);
  const [documentLinks, setDocumentLinks] =
    useState<WorkshopDocumentLinksValue>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<JobCardItem[]>([]);
  const [newItem, setNewItem] = useState<JobCardItem>({
    productId: "",
    description: "",
    sku: "",
    quantity: 1,
    unitPrice: 0,
    unit: "piece",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "draft",
    priority: "medium",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: "",
    vehicle_vin: "",
    vehicle_color: "",
    vehicle_reg: "",
    vehicle_mileage: "",
    vehicle_engine_number: "",
    assigned_to_id: "",
    planned_date: "",
    date_time_out: "",
    labor_estimate: 0,
    vat_rate: 15,
  });

  const partsEstimate = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  );

  useEffect(() => {
    if (open) {
      apiService
        .get("/pos/products?limit=1000&page=1")
        .then((res: any) => setProducts(res.products || []))
        .catch(() => setProducts([]));
      if (mode === "edit" && jobCard?.customer_id) {
        apiService
          .get(`/crm/customers/${jobCard.customer_id}`)
          .then((c: Customer) => setSelectedCustomer(c))
          .catch(() => setSelectedCustomer(null));
      } else {
        setSelectedCustomer(null);
      }
    }
  }, [open, mode, jobCard?.customer_id]);

  useEffect(() => {
    if (jobCard && mode === "edit") {
      const vi = (jobCard.vehicle_info || {}) as Record<string, string>;
      const completedAt = jobCard.completed_at;
      const dateTimeOut = completedAt ? completedAt.slice(0, 16) : "";
      setFormData({
        title: jobCard.title || "",
        description: jobCard.description || "",
        status: jobCard.status || "draft",
        priority: jobCard.priority || "medium",
        vehicle_make: vi.make || "",
        vehicle_model: vi.model || "",
        vehicle_year: vi.year || "",
        vehicle_vin: vi.vin || "",
        vehicle_color: vi.color || "",
        vehicle_reg: vi.registration_number || "",
        vehicle_mileage: vi.mileage || "",
        vehicle_engine_number: (vi.engine_number as string) || "",
        assigned_to_id: jobCard.assigned_to_id || "",
        planned_date: jobCard.planned_date
          ? jobCard.planned_date.split("T")[0]
          : "",
        date_time_out: dateTimeOut,
        labor_estimate: jobCard.labor_estimate ?? 0,
        vat_rate:
          jobCard.vat_rate != null
            ? Math.round((jobCard.vat_rate as number) * 100)
            : 15,
      });
      setItems(
        Array.isArray(jobCard.items)
          ? jobCard.items.map((it) => ({
              productId: it.productId || "",
              description: it.description || "",
              sku: it.sku || "",
              quantity: it.quantity || 1,
              unitPrice: it.unitPrice || 0,
              unit: it.unit || "piece",
            }))
          : [],
      );
      setSelectedVehicle(null);
      setSelectedAssignee(
        jobCard.assigned_to_id
          ? {
              id: jobCard.assigned_to_id,
              name: jobCard.assigned_to_name || jobCard.assigned_to_id,
              sources: ["user"],
            }
          : null,
      );
      setDocumentLinks({
        purchaseOrderId: jobCard.purchase_order_id,
      });
    } else if (mode === "create") {
      setFormData({
        title: "",
        description: "",
        status: "draft",
        priority: "medium",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_year: "",
        vehicle_vin: "",
        vehicle_color: "",
        vehicle_reg: "",
        vehicle_mileage: "",
        vehicle_engine_number: "",
        assigned_to_id: "",
        planned_date: "",
        date_time_out: "",
        labor_estimate: 0,
        vat_rate: 15,
      });
      setItems([]);
      setNewItem({
        productId: "",
        description: "",
        sku: "",
        quantity: 1,
        unitPrice: 0,
        unit: "piece",
      });
      setSelectedVehicle(null);
      setSelectedAssignee(null);
      setDocumentLinks({});
    }
    setErrorMessage("");
  }, [jobCard, mode]);

  const handleAddItem = () => {
    if (!newItem.productId || !newItem.description || newItem.quantity <= 0) {
      setErrorMessage("Select a product and enter a valid quantity");
      return;
    }
    setItems((prev) => [...prev, { ...newItem }]);
    setNewItem({
      productId: "",
      description: "",
      sku: "",
      quantity: 1,
      unitPrice: 0,
      unit: "piece",
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!formData.title.trim()) {
      setErrorMessage("Title is required");
      return;
    }
    setLoading(true);
    try {
      const payload: JobCardCreate | JobCardUpdate = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        customer_id: selectedCustomer?.id || undefined,
        vehicle_info: {
          make: formData.vehicle_make || undefined,
          model: formData.vehicle_model || undefined,
          year: formData.vehicle_year || undefined,
          vin: formData.vehicle_vin || undefined,
          color: formData.vehicle_color || undefined,
          registration_number: formData.vehicle_reg || undefined,
          mileage: formData.vehicle_mileage || undefined,
          engine_number: formData.vehicle_engine_number || undefined,
        },
        assigned_to_id: selectedAssignee?.id || undefined,
        planned_date: formData.planned_date
          ? formData.planned_date + "T12:00:00Z"
          : undefined,
        completed_at: formData.date_time_out
          ? formData.date_time_out + ":00Z"
          : undefined,
        labor_estimate: formData.labor_estimate,
        parts_estimate: partsEstimate,
        vat_rate: formData.vat_rate / 100,
        purchase_order_id: documentLinks.purchaseOrderId,
        items,
      };
      let saved: JobCard | undefined;
      if (mode === "create") {
        saved = (await apiService.post("/job-cards", payload)) as JobCard;
      } else if (jobCard) {
        saved = (await apiService.put(
          `/job-cards/${jobCard.id}`,
          payload,
        )) as JobCard;
      }
      onSuccess(saved);
      onOpenChange(false);
    } catch {
      setErrorMessage("Failed to save job card.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-6xl flex-col gap-3 overflow-hidden p-5 sm:rounded-lg">
        <DialogHeader className="shrink-0 space-y-1">
          <DialogTitle>
            {mode === "create" ? "New Job Card" : "Edit Job Card"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            const target = e.target as HTMLElement;
            if (
              e.key === "Enter" &&
              target instanceof HTMLInputElement &&
              target.type !== "date" &&
              target.type !== "datetime-local"
            ) {
              e.preventDefault();
            }
          }}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          {errorMessage && (
            <Alert variant="destructive" className="shrink-0">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) =>
                        setFormData({ ...formData, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <CustomerSearch
                      label="Customer"
                      value={selectedCustomer}
                      onSelect={setSelectedCustomer}
                      placeholder="Search by name, email, phone..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateCustomer(true)}
                    className="shrink-0"
                    disabled={!canCreateCustomer}
                    title={canCreateCustomer ? undefined : "You don't have permission to create customers"}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>

                <AssigneeSearch
                  value={selectedAssignee}
                  onSelect={setSelectedAssignee}
                  placeholder="Search users or employees..."
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Planned date</Label>
                    <Input
                      type="date"
                      value={formData.planned_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          planned_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Date/Time out</Label>
                    <Input
                      type="datetime-local"
                      value={formData.date_time_out}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_time_out: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <VehicleSearch
                      label="Vehicle"
                      value={selectedVehicle}
                      onSelect={(v) => {
                        setSelectedVehicle(v);
                        if (v) {
                          setFormData((prev) => ({
                            ...prev,
                            vehicle_make: v.make ?? "",
                            vehicle_model: v.model ?? "",
                            vehicle_year: v.year ?? "",
                            vehicle_vin: v.vin ?? "",
                            vehicle_color: v.color ?? "",
                            vehicle_reg: v.registration_number ?? "",
                            vehicle_mileage: v.mileage ?? "",
                            vehicle_engine_number: v.engine_number ?? "",
                          }));
                        }
                      }}
                      placeholder="Search by reg, VIN, make, model..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateVehicle(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <Label>Vehicle make</Label>
                    <Input
                      value={formData.vehicle_make}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_make: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Vehicle model</Label>
                    <Input
                      value={formData.vehicle_model}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_model: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Vehicle year</Label>
                    <Input
                      value={formData.vehicle_year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_year: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>VIN</Label>
                    <Input
                      value={formData.vehicle_vin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_vin: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Registration Number</Label>
                    <Input
                      value={formData.vehicle_reg}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_reg: e.target.value,
                        })
                      }
                      placeholder="Reg. no."
                    />
                  </div>
                  <div>
                    <Label>Mileage</Label>
                    <Input
                      value={formData.vehicle_mileage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_mileage: e.target.value,
                        })
                      }
                      placeholder="e.g. 45000"
                    />
                  </div>
                  <div>
                    <Label>Engine Number</Label>
                    <Input
                      value={formData.vehicle_engine_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_engine_number: e.target.value,
                        })
                      }
                      placeholder="Engine no."
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input
                      value={formData.vehicle_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_color: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <div>
                <Label>Description (Reported defect)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              {isWorkshop && (
                <WorkshopDocumentLinks
                  dense
                  excludeType="job_card"
                  value={documentLinks}
                  onChange={setDocumentLinks}
                  purchaseOrderInitialData={
                    mode === "edit" && jobCard?.id
                      ? { jobCardId: jobCard.id }
                      : undefined
                  }
                />
              )}
            </div>

            <div className="mt-4 space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Products</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label>Product</Label>
                  <Select
                    value={newItem.productId || ""}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setNewItem((prev) => ({
                        ...prev,
                        productId: value,
                        description: product?.name || "",
                        sku: product?.sku || "",
                        unitPrice: product?.salePrice || 0,
                        unit: product?.unitOfMeasure || "piece",
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="no-products" disabled>
                          No products available
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newItem.quantity || ""}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        quantity:
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Unit price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newItem.unitPrice || ""}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        unitPrice:
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {item.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × {item.unitPrice}
                          {item.sku ? ` · ${item.sku}` : ""}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setItems((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label>Labor estimate</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.labor_estimate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labor_estimate:
                        e.target.value === ""
                          ? 0
                          : parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Parts estimate</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={partsEstimate || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>VAT %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={formData.vat_rate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vat_rate:
                        e.target.value === ""
                          ? 0
                          : parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>

      <CreateCustomerDialog
        open={showCreateCustomer}
        onOpenChange={setShowCreateCustomer}
        onCreated={(customer) => setSelectedCustomer(customer)}
      />

      <VehicleDialog
        open={showCreateVehicle}
        onOpenChange={setShowCreateVehicle}
        mode="create"
        onSuccess={() => {}}
        onCreated={(v) => {
          setSelectedVehicle(v);
          setFormData((prev) => ({
            ...prev,
            vehicle_make: v.make ?? "",
            vehicle_model: v.model ?? "",
            vehicle_year: v.year ?? "",
            vehicle_vin: v.vin ?? "",
            vehicle_color: v.color ?? "",
            vehicle_reg: v.registration_number ?? "",
            vehicle_mileage: v.mileage ?? "",
            vehicle_engine_number: v.engine_number ?? "",
          }));
        }}
      />
    </Dialog>
  );
}
