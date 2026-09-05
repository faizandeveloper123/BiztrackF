"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { CountrySelect } from "../ui/country-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Camera,
  Edit,
  ExternalLink,
  Paperclip,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import crmService, {
  CustomerService,
  type Customer,
  type CustomerAttachment,
  type CustomerCreate,
  type GuarantorCreate,
  type LabeledEmailItem,
  type LabeledPhoneItem,
} from "@/src/services/CRMService";
import fileUploadService from "@/src/services/FileUploadService";
import { LabeledContactFields } from "@/src/components/crm/LabeledContactFields";
import { CustomerTypeNameFields } from "@/src/components/crm/CustomerTypeNameFields";
import {
  buildCustomerCreatePayload,
  validateCustomerNameFields,
} from "@/src/utils/customerUtils";
import { extractErrorMessage } from "@/src/utils/errorUtils";

const defaultFormData = (): CustomerCreate => ({
  firstName: "",
  lastName: "",
  emails: [{ value: "", label: "personal" }] as LabeledEmailItem[],
  phones: [{ value: "", label: "work" }] as LabeledPhoneItem[],
  cnic: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  customerType: "individual",
  customerStatus: "active",
  creditLimit: undefined,
  currentBalance: undefined,
  paymentTerms: "Cash",
  tags: [],
  description: "",
  attachments: [] as CustomerAttachment[],
});

const emptyGuarantorForm: GuarantorCreate = {
  name: "",
  mobile: "",
  cnic: "",
  residential_address: "",
  official_address: "",
  occupation: "",
  relation: "",
};

export interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (customer: Customer) => void;
}

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCustomerDialogProps) {
  const [formData, setFormData] = useState<CustomerCreate>(defaultFormData());
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState<
    string | null
  >(null);
  const [createGuarantors, setCreateGuarantors] = useState<GuarantorCreate[]>(
    [],
  );
  const [guarantorDialogOpen, setGuarantorDialogOpen] = useState(false);
  const [guarantorForm, setGuarantorForm] =
    useState<GuarantorCreate>(emptyGuarantorForm);
  const [editingCreateGuarantorIndex, setEditingCreateGuarantorIndex] =
    useState<number | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const customerPhotoInputRef = useRef<HTMLInputElement>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData(defaultFormData());
    setCustomerPhotoPreview(null);
    setCreateGuarantors([]);
    setGuarantorForm(emptyGuarantorForm);
    setEditingCreateGuarantorIndex(null);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleCustomerTypeChange = (type: "individual" | "business") => {
    setFormData((prev) => ({
      ...prev,
      customerType: type,
      ...(type === "business"
        ? { lastName: "" }
        : prev.customerType === "business"
          ? { firstName: "", lastName: "" }
          : {}),
    }));
  };

  const handleCustomerPhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setCustomerPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAttachmentFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentUploading(true);
    try {
      const res = await fileUploadService.uploadDocument(file);
      setFormData((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []),
          {
            url: res.file_url,
            original_filename: res.original_filename,
            s3_key: res.s3_key,
          },
        ],
      }));
      toast.success("File attached");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Upload failed"));
    } finally {
      setAttachmentUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachmentAt = async (index: number) => {
    const list = formData.attachments || [];
    const att = list[index];
    if (att) {
      const key = att.s3_key || fileUploadService.extractS3KeyFromUrl(att.url);
      if (key) {
        try {
          await fileUploadService.deleteFile(key);
        } catch {
          toast.warning("Removed from list; storage delete may have failed");
        }
      }
    }
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  const openAddGuarantor = () => {
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm(emptyGuarantorForm);
    setGuarantorDialogOpen(true);
  };

  const openEditGuarantor = (g: GuarantorCreate, index: number) => {
    setEditingCreateGuarantorIndex(index);
    setGuarantorForm({ ...g });
    setGuarantorDialogOpen(true);
  };

  const handleDeleteGuarantor = (index: number) => {
    setCreateGuarantors((prev) => prev.filter((_, i) => i !== index));
    toast.success("Guarantor removed");
  };

  const handleGuarantorDialogSubmit = () => {
    if (!guarantorForm.name.trim()) return;
    if (
      editingCreateGuarantorIndex !== null &&
      editingCreateGuarantorIndex >= 0
    ) {
      setCreateGuarantors((prev) =>
        prev.map((item, idx) =>
          idx === editingCreateGuarantorIndex ? guarantorForm : item,
        ),
      );
    } else {
      setCreateGuarantors((prev) => [...prev, guarantorForm]);
    }
    setGuarantorForm(emptyGuarantorForm);
    setEditingCreateGuarantorIndex(null);
    setGuarantorDialogOpen(false);
    toast.success(
      editingCreateGuarantorIndex !== null
        ? "Guarantor updated"
        : "Guarantor added",
    );
  };

  const handleCreate = async () => {
    const nameError = validateCustomerNameFields(
      formData.customerType,
      formData.firstName,
      formData.lastName,
    );
    if (nameError) {
      toast.error(nameError);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildCustomerCreatePayload(formData);
      const created = await CustomerService.createCustomer(payload);
      if (customerPhotoPreview) {
        try {
          await CustomerService.uploadCustomerPhoto(
            created.id,
            customerPhotoPreview,
          );
        } catch (photoErr) {
          toast.warning(
            extractErrorMessage(
              photoErr,
              "Customer created but photo upload failed",
            ),
          );
        }
      }
      for (const g of createGuarantors) {
        try {
          await crmService.createGuarantor(created.id, g);
        } catch (guarErr) {
          toast.warning(
            extractErrorMessage(
              guarErr,
              "Customer created but one or more guarantors could not be added",
            ),
          );
        }
      }
      toast.success("Customer created successfully");
      onOpenChange(false);
      onCreated?.(created);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to create customer"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your CRM system
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 pb-4 border-b">
            <div
              className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center bg-muted cursor-pointer overflow-hidden"
              onClick={() => customerPhotoInputRef.current?.click()}
            >
              {customerPhotoPreview ? (
                <img
                  src={customerPhotoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Customer photo (optional)
              </Label>
              <input
                ref={customerPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomerPhotoChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => customerPhotoInputRef.current?.click()}
              >
                Choose image
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <CustomerTypeNameFields
                customerType={formData.customerType || "individual"}
                firstName={formData.firstName}
                lastName={formData.lastName}
                onCustomerTypeChange={handleCustomerTypeChange}
                onFirstNameChange={(firstName) =>
                  setFormData((prev) => ({ ...prev, firstName }))
                }
                onLastNameChange={(lastName) =>
                  setFormData((prev) => ({ ...prev, lastName }))
                }
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <LabeledContactFields
                emails={formData.emails || [{ value: "", label: "personal" }]}
                phones={formData.phones || [{ value: "", label: "work" }]}
                onEmailsChange={(emails) =>
                  setFormData((prev) => ({ ...prev, emails }))
                }
                onPhonesChange={(phones) =>
                  setFormData((prev) => ({ ...prev, phones }))
                }
              />
            </div>
            <div>
              <Label htmlFor="cnic">CNIC</Label>
              <Input
                id="cnic"
                value={formData.cnic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cnic: e.target.value }))
                }
                placeholder="12345-1234567-1"
              />
            </div>
            <div>
              <Label htmlFor="customerStatus">Status</Label>
              <Select
                value={formData.customerStatus}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerStatus: value as "active" | "inactive" | "blocked",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                value={formData.creditLimit ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    creditLimit:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentTerms: value as
                      | "Credit"
                      | "Card"
                      | "Cash"
                      | "Due Payments",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Due Payments">Due Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor="address">Billing Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Street address, building number"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, state: e.target.value }))
                }
                placeholder="Enter state/province"
              />
            </div>
            <div>
              <CountrySelect
                value={formData.country}
                onChange={(country) =>
                  setFormData((prev) => ({ ...prev, country }))
                }
                placeholder="Select country"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    postalCode: e.target.value,
                  }))
                }
                placeholder="75000"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="vip, regular, premium"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Notes or profile summary for this customer"
                rows={2}
                className="resize-y min-h-[60px]"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-2">
              <Label>Attachments</Label>
              <input
                ref={attachmentFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleAttachmentFile}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={attachmentUploading}
                  onClick={() => attachmentFileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  {attachmentUploading ? "Uploading…" : "Add file"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX (max 10MB)
                </span>
              </div>
              {(formData.attachments || []).length > 0 && (
                <ul className="border rounded-md divide-y text-sm">
                  {(formData.attachments || []).map((att, idx) => (
                    <li
                      key={`${att.url}-${idx}`}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <span
                        className="truncate flex-1"
                        title={att.original_filename || att.url}
                      >
                        {att.original_filename || "Attachment"}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center"
                          aria-label="Open file"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => removeAttachmentAt(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                Guarantors / Friends
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openAddGuarantor}
              >
                <UserPlus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {createGuarantors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No guarantors added.
              </p>
            ) : (
              <div className="border rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>Relation</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createGuarantors.map((g, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell>{g.mobile || "-"}</TableCell>
                        <TableCell>{g.cnic || "-"}</TableCell>
                        <TableCell>{g.relation || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditGuarantor(g, idx)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGuarantor(idx)}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating…" : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={guarantorDialogOpen} onOpenChange={setGuarantorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCreateGuarantorIndex !== null &&
              editingCreateGuarantorIndex >= 0
                ? "Edit Guarantor"
                : "Add Guarantor"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={guarantorForm.name}
                onChange={(e) =>
                  setGuarantorForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input
                value={guarantorForm.mobile}
                onChange={(e) =>
                  setGuarantorForm((p) => ({ ...p, mobile: e.target.value }))
                }
                placeholder="03XX-XXXXXXX"
              />
            </div>
            <div>
              <Label>CNIC</Label>
              <Input
                value={guarantorForm.cnic}
                onChange={(e) =>
                  setGuarantorForm((p) => ({ ...p, cnic: e.target.value }))
                }
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>
            <div>
              <Label>Residential Address</Label>
              <Input
                value={guarantorForm.residential_address}
                onChange={(e) =>
                  setGuarantorForm((p) => ({
                    ...p,
                    residential_address: e.target.value,
                  }))
                }
                placeholder="Address"
              />
            </div>
            <div>
              <Label>Official Address</Label>
              <Input
                value={guarantorForm.official_address}
                onChange={(e) =>
                  setGuarantorForm((p) => ({
                    ...p,
                    official_address: e.target.value,
                  }))
                }
                placeholder="Office address"
              />
            </div>
            <div>
              <Label>Occupation</Label>
              <Input
                value={guarantorForm.occupation}
                onChange={(e) =>
                  setGuarantorForm((p) => ({
                    ...p,
                    occupation: e.target.value,
                  }))
                }
                placeholder="Job"
              />
            </div>
            <div>
              <Label>Relation</Label>
              <Input
                value={guarantorForm.relation}
                onChange={(e) =>
                  setGuarantorForm((p) => ({ ...p, relation: e.target.value }))
                }
                placeholder="e.g. FRIEND"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGuarantorDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGuarantorDialogSubmit}
              disabled={!guarantorForm.name.trim()}
            >
              {editingCreateGuarantorIndex !== null ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
