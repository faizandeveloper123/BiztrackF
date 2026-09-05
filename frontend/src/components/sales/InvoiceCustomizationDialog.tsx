"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Building2, Palette, Settings, FileText, Save, X } from "lucide-react";
import {
  InvoiceCustomization,
  InvoiceCustomizationCreate,
  InvoiceCustomizationUpdate,
} from "../../models/sales/InvoiceCustomization";
import InvoiceCustomizationService from "../../services/InvoiceCustomizationService";
import FileUploadService from "../../services/FileUploadService";
import { FileUpload } from "../ui/file-upload";
import { toast } from "sonner";

interface InvoiceCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceCustomizationDialog({
  open,
  onOpenChange,
}: InvoiceCustomizationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customization, setCustomization] =
    useState<InvoiceCustomization | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<InvoiceCustomizationCreate>({
    company_name: "",
    company_logo_url: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    bank_sort_code: "",
    bank_account_number: "",
    payment_instructions: "Make all payments to your company name",
    primary_color: "#1e40af",
    secondary_color: "#6b7280",
    accent_color: "#f3f4f6",
    show_vehicle_info: true,
    show_parts_section: true,
    show_labour_section: true,
    show_comments_section: true,
    footer_text: "",
    show_contact_info_in_footer: true,
    footer_background_color: "#1e3a8a",
    grid_color: "#cccccc",
    thank_you_message: "Thank you for your business!",
    enquiry_message: "Should you have any enquiries concerning this invoice,",
    contact_message: "please contact us at your convenience.",
    default_payment_instructions: "Make all payments to your company name",
    default_currency: "USD",
    custom_fields: {},
  });

  useEffect(() => {
    if (open) {
      loadCustomization();
    }
  }, [open]);

  const loadCustomization = async () => {
    try {
      setLoading(true);
      const data = await InvoiceCustomizationService.getCustomization();
      setCustomization(data);
      setFormData({
        company_name: data.company_name,
        company_logo_url: data.company_logo_url || "",
        company_address: data.company_address || "",
        company_phone: data.company_phone || "",
        company_email: data.company_email || "",
        company_website: data.company_website || "",
        bank_sort_code: data.bank_sort_code || "",
        bank_account_number: data.bank_account_number || "",
        payment_instructions:
          data.payment_instructions || "Make all payments to your company name",
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        accent_color: data.accent_color,
        show_vehicle_info: data.show_vehicle_info,
        show_parts_section: data.show_parts_section,
        show_labour_section: data.show_labour_section,
        show_comments_section: data.show_comments_section,
        footer_text: data.footer_text || "",
        show_contact_info_in_footer: data.show_contact_info_in_footer,
        default_currency: data.default_currency || "USD",
        custom_fields: data.custom_fields || {},
      });

      // Load logo info if exists
      if (data.company_logo_url) {
        setLogoPreviewUrl(data.company_logo_url);
      }
    } catch (error) {
      toast.error("Failed to load invoice customization");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (customization) {
        await InvoiceCustomizationService.updateCustomization(
          formData as InvoiceCustomizationUpdate,
        );
      } else {
        await InvoiceCustomizationService.createCustomization(formData);
      }

      toast.success("Invoice customization saved successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save invoice customization");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof InvoiceCustomizationCreate,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);

      const currentLogoUrl = formData.company_logo_url;
      if (currentLogoUrl) {
        const s3Key = FileUploadService.extractS3KeyFromUrl(currentLogoUrl);

        if (s3Key) {
          try {
            await FileUploadService.deleteFile(s3Key);
          } catch (deleteError) {
            console.error("Failed to delete old logo from S3:", deleteError);
          }
        }
      }

      const response = await FileUploadService.uploadLogo(file);

      setFormData((prev) => ({
        ...prev,
        company_logo_url: response.file_url,
      }));

      setLogoFile(file);
      setLogoPreviewUrl(response.file_url);

      toast.success("Logo uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    try {
      setUploading(true);

      const currentLogoUrl = formData.company_logo_url;
      if (currentLogoUrl) {
        const s3Key = FileUploadService.extractS3KeyFromUrl(currentLogoUrl);

        if (s3Key) {
          try {
            await FileUploadService.deleteFile(s3Key);
          } catch (deleteError) {
            console.error("Failed to delete logo from S3:", deleteError);
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        company_logo_url: "",
      }));

      setLogoFile(null);
      setLogoPreviewUrl(null);

      toast.success("Logo removed successfully!");
    } catch (error) {
      toast.error("Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading customization...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Customize Invoice Template
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="styling" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Styling
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Layout
            </TabsTrigger>
          </TabsList>

          {/* Company Information Tab */}
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) =>
                        handleInputChange("company_name", e.target.value)
                      }
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_logo_url">Company Logo</Label>
                    <div className="space-y-3">
                      <FileUpload
                        onFileSelect={handleLogoUpload}
                        onFileRemove={handleLogoRemove}
                        currentFile={logoFile}
                        currentUrl={logoPreviewUrl}
                        accept="image/*"
                        maxSize={5}
                        label=""
                        disabled={uploading}
                      />
                      <div className="text-xs text-gray-500">
                        Or enter a URL:
                      </div>
                      <Input
                        id="company_logo_url"
                        value={formData.company_logo_url}
                        onChange={(e) =>
                          handleInputChange("company_logo_url", e.target.value)
                        }
                        placeholder="https://example.com/logo.png"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="company_address">Company Address</Label>
                  <Textarea
                    id="company_address"
                    value={formData.company_address}
                    onChange={(e) =>
                      handleInputChange("company_address", e.target.value)
                    }
                    placeholder="Unit 7 Pristine Business Park Newport Road, Milton Keynes, MK17 8UD"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="company_phone">Phone</Label>
                    <Input
                      id="company_phone"
                      value={formData.company_phone}
                      onChange={(e) =>
                        handleInputChange("company_phone", e.target.value)
                      }
                      placeholder="01908 991 123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_email">Email</Label>
                    <Input
                      id="company_email"
                      value={formData.company_email}
                      onChange={(e) =>
                        handleInputChange("company_email", e.target.value)
                      }
                      placeholder="contact@yourcompany.co.uk"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_website">Website</Label>
                    <Input
                      id="company_website"
                      value={formData.company_website}
                      onChange={(e) =>
                        handleInputChange("company_website", e.target.value)
                      }
                      placeholder="www.yourcompany.co.uk"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Information Tab */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payment_instructions">
                    Payment Instructions
                  </Label>
                  <Textarea
                    id="payment_instructions"
                    value={formData.payment_instructions}
                    onChange={(e) =>
                      handleInputChange("payment_instructions", e.target.value)
                    }
                    placeholder="Make all payments to your company name"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Select
                    value={formData.default_currency}
                    onValueChange={(value) =>
                      handleInputChange("default_currency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_sort_code">Sort Code</Label>
                    <Input
                      id="bank_sort_code"
                      value={formData.bank_sort_code}
                      onChange={(e) =>
                        handleInputChange("bank_sort_code", e.target.value)
                      }
                      placeholder="23-18-84"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_account_number">Account Number</Label>
                    <Input
                      id="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={(e) =>
                        handleInputChange("bank_account_number", e.target.value)
                      }
                      placeholder="42798297"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Styling Tab */}
          <TabsContent value="styling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) =>
                          handleInputChange("primary_color", e.target.value)
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) =>
                          handleInputChange("primary_color", e.target.value)
                        }
                        placeholder="#1e40af"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) =>
                          handleInputChange("secondary_color", e.target.value)
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) =>
                          handleInputChange("secondary_color", e.target.value)
                        }
                        placeholder="#6b7280"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accent_color">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accent_color"
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) =>
                          handleInputChange("accent_color", e.target.value)
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.accent_color}
                        onChange={(e) =>
                          handleInputChange("accent_color", e.target.value)
                        }
                        placeholder="#f3f4f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Styling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="footer_background_color">
                      Footer Background Color
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="footer_background_color"
                        type="color"
                        value={formData.footer_background_color}
                        onChange={(e) =>
                          handleInputChange(
                            "footer_background_color",
                            e.target.value,
                          )
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.footer_background_color}
                        onChange={(e) =>
                          handleInputChange(
                            "footer_background_color",
                            e.target.value,
                          )
                        }
                        placeholder="#1e3a8a"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="grid_color">Grid Lines Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="grid_color"
                        type="color"
                        value={formData.grid_color}
                        onChange={(e) =>
                          handleInputChange("grid_color", e.target.value)
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.grid_color}
                        onChange={(e) =>
                          handleInputChange("grid_color", e.target.value)
                        }
                        placeholder="#cccccc"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text Customization Tab */}
          <TabsContent value="text" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Text Messages</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customize the text messages that appear on your invoices
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="thank_you_message">Thank You Message</Label>
                  <Input
                    id="thank_you_message"
                    value={formData.thank_you_message}
                    onChange={(e) =>
                      handleInputChange("thank_you_message", e.target.value)
                    }
                    placeholder="Thank you for your business!"
                  />
                </div>

                <div>
                  <Label htmlFor="enquiry_message">Enquiry Message</Label>
                  <Input
                    id="enquiry_message"
                    value={formData.enquiry_message}
                    onChange={(e) =>
                      handleInputChange("enquiry_message", e.target.value)
                    }
                    placeholder="Should you have any enquiries concerning this invoice,"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_message">Contact Message</Label>
                  <Input
                    id="contact_message"
                    value={formData.contact_message}
                    onChange={(e) =>
                      handleInputChange("contact_message", e.target.value)
                    }
                    placeholder="please contact us at your convenience."
                  />
                </div>

                <div>
                  <Label htmlFor="default_payment_instructions">
                    Default Payment Instructions
                  </Label>
                  <Textarea
                    id="default_payment_instructions"
                    value={formData.default_payment_instructions}
                    onChange={(e) =>
                      handleInputChange(
                        "default_payment_instructions",
                        e.target.value,
                      )
                    }
                    placeholder="Make all payments to your company name"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_vehicle_info">
                        Show Vehicle Information
                      </Label>
                      <p className="text-sm text-gray-600">
                        Display vehicle details section
                      </p>
                    </div>
                    <Switch
                      id="show_vehicle_info"
                      checked={formData.show_vehicle_info}
                      onCheckedChange={(checked) =>
                        handleInputChange("show_vehicle_info", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_parts_section">
                        Show Parts Section
                      </Label>
                      <p className="text-sm text-gray-600">
                        Display parts and components
                      </p>
                    </div>
                    <Switch
                      id="show_parts_section"
                      checked={formData.show_parts_section}
                      onCheckedChange={(checked) =>
                        handleInputChange("show_parts_section", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_labour_section">
                        Show Labour Section
                      </Label>
                      <p className="text-sm text-gray-600">
                        Display labour and services
                      </p>
                    </div>
                    <Switch
                      id="show_labour_section"
                      checked={formData.show_labour_section}
                      onCheckedChange={(checked) =>
                        handleInputChange("show_labour_section", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_comments_section">
                        Show Comments Section
                      </Label>
                      <p className="text-sm text-gray-600">
                        Display additional notes and comments
                      </p>
                    </div>
                    <Switch
                      id="show_comments_section"
                      checked={formData.show_comments_section}
                      onCheckedChange={(checked) =>
                        handleInputChange("show_comments_section", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_contact_info_in_footer">
                        Show Contact Info in Footer
                      </Label>
                      <p className="text-sm text-gray-600">
                        Display contact information in footer
                      </p>
                    </div>
                    <Switch
                      id="show_contact_info_in_footer"
                      checked={formData.show_contact_info_in_footer}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          "show_contact_info_in_footer",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="footer_text">Custom Footer Text</Label>
                  <Textarea
                    id="footer_text"
                    value={formData.footer_text}
                    onChange={(e) =>
                      handleInputChange("footer_text", e.target.value)
                    }
                    placeholder="Custom footer text (optional)"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col-reverse gap-2 pt-4 border-t sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || uploading || !formData.company_name}
            className="modern-button w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving
              ? "Saving..."
              : uploading
                ? "Uploading..."
                : "Save Customization"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
