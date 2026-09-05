"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  investmentService,
  InvestmentCreate,
  Investment,
} from "../../services/InvestmentService";
import { Loader2, Calendar, FileText, Tag } from "lucide-react";
import { toast } from "sonner";

interface InvestmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingInvestment?: Investment | null;
}

export default function InvestmentForm({
  isOpen,
  onClose,
  onSuccess,
  editingInvestment,
}: InvestmentFormProps) {
  const router = useRouter();
  const { getCurrencySymbol } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InvestmentCreate>({
    investment_date: new Date().toISOString().split("T")[0],
    investment_type: "cash_investment",
    amount: 0,
    description: "",
    notes: "",
    reference_number: "",
    reference_type: "",
    tags: [],
  });

  useEffect(() => {
    if (editingInvestment) {
      setFormData({
        investment_date: editingInvestment.investment_date.split("T")[0],
        investment_type: editingInvestment.investment_type,
        amount: editingInvestment.amount,
        description: editingInvestment.description,
        notes: editingInvestment.notes || "",
        reference_number: editingInvestment.reference_number || "",
        reference_type: editingInvestment.reference_type || "",
        tags: editingInvestment.tags || [],
      });
    } else {
      setFormData({
        investment_date: new Date().toISOString().split("T")[0],
        investment_type: "cash_investment",
        amount: 0,
        description: "",
        notes: "",
        reference_number: "",
        reference_type: "",
        tags: [],
      });
    }
  }, [editingInvestment, isOpen]);

  const [newTag, setNewTag] = useState("");

  const investmentTypes = [
    {
      value: "cash_investment",
      label: "Cash Investment",
      description: "Physical cash provided to the business",
    },
    {
      value: "card_transfer",
      label: "Card Transfer",
      description: "Funds transferred via debit/credit card",
    },
    {
      value: "bank_transfer",
      label: "Bank Transfer",
      description: "Direct bank account transfer",
    },
    {
      value: "equipment_purchase",
      label: "Equipment Purchase",
      description: "Purchase of equipment/assets",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (formData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      if (editingInvestment) {
        await investmentService.updateInvestment(
          editingInvestment.id,
          formData,
        );
      } else {
        await investmentService.createInvestment(formData);
      }
      onSuccess?.();
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(
        `Failed to ${editingInvestment ? "update" : "create"} investment. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  const selectedType = investmentTypes.find(
    (type) => type.value === formData.investment_type,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingInvestment ? "Edit Investment" : "Add New Investment"}
          </DialogTitle>
          <DialogDescription>
            Record external capital investment to sustain business operations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investment_date">Investment Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="investment_date"
                  type="date"
                  value={formData.investment_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      investment_date: e.target.value,
                    })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment_type">Investment Type</Label>
              <Select
                value={formData.investment_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, investment_type: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select investment type" />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">
                          {type.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({getCurrencySymbol()})</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pl-10"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {selectedType && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {selectedType.label}
                    </p>
                    <p className="text-sm text-blue-700">
                      {selectedType.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the purpose of this investment..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
                placeholder="Transaction reference, receipt number, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_type">Reference Type</Label>
              <Input
                id="reference_type"
                value={formData.reference_type}
                onChange={(e) =>
                  setFormData({ ...formData, reference_type: e.target.value })
                }
                placeholder="Receipt, Transfer, Invoice, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about this investment..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTag())
                }
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingInvestment ? "Update Investment" : "Create Investment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
