"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  FileText,
  Plus,
  Calendar,
  Download,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import apiService from "../../services/ApiService";
import { Quote, QuoteStatus } from "../../models/sales";
import { Opportunity, Contact } from "../../models/crm";
import { DashboardLayout } from "../layout";

export default function QuotesPage() {
  const confirm = useConfirm();
  const { getCurrencySymbol, formatCurrency } = useCurrency();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [downloadingQuoteId, setDownloadingQuoteId] = useState<string | null>(
    null,
  );

  const [newQuote, setNewQuote] = useState({
    quoteNumber: "",
    opportunityId: "",
    contactId: "",
    title: "",
    description: "",
    amount: "",
    validUntil: "",
    terms: "",
    items: [] as any[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotesData, opportunitiesData, contactsData] = await Promise.all([
        apiService.getQuotes(),
        apiService.getOpportunities({ page: 1, limit: 100 }),
        apiService.getContacts({ page: 1, limit: 100 }),
      ]);
      setQuotes(
        Array.isArray(quotesData) ? quotesData : quotesData.quotes || [],
      );
      setOpportunities(opportunitiesData.opportunities || []);
      setContacts(contactsData.contacts || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    try {
      const quoteData = {
        ...newQuote,
        amount: parseFloat(newQuote.amount),
        valid_until: new Date(newQuote.validUntil).toISOString(),
      };
      await apiService.createQuote(quoteData);
      toast.success("Quote created successfully");
      setIsCreateDialogOpen(false);
      setNewQuote({
        quoteNumber: "",
        opportunityId: "",
        contactId: "",
        title: "",
        description: "",
        amount: "",
        validUntil: "",
        terms: "",
        items: [],
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create quote");
    }
  };

  const handleUpdateQuote = async () => {
    if (!selectedQuote) return;
    try {
      await apiService.updateQuote(selectedQuote.id, selectedQuote);
      toast.success("Quote updated successfully");
      setIsEditDialogOpen(false);
      setSelectedQuote(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to update quote");
    }
  };

  const handleDeleteQuote = async (id: string) => {
    const ok = await confirm({
      description: "Are you sure you want to delete this quote?",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await apiService.deleteQuote(id);
      toast.success("Quote deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete quote");
    }
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsViewDialogOpen(true);
  };

  const handleDownloadQuote = async (quote: Quote) => {
    try {
      setDownloadingQuoteId(quote.id);
      const blob = await apiService.get(`/sales/quotes/${quote.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quote-${quote.quoteNumber || quote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Quote downloaded successfully");
    } catch (error) {
      toast.error("Failed to download quote");
    } finally {
      setDownloadingQuoteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const normalizeId = (value: unknown) => {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value).trim().toLowerCase();
  };

  const firstValidId = (...values: unknown[]) => {
    for (const value of values) {
      const normalized = normalizeId(value);
      if (normalized) {
        return normalized;
      }
    }
    return "";
  };

  const getQuoteOpportunityId = (quote: Quote) =>
    firstValidId(
      (quote as any).opportunityId,
      (quote as any).opportunity_id,
      (quote as any).opportunity?.id,
      (quote as any).opportunity?.opportunityId,
      (quote as any).opportunity?.opportunity_id,
    );

  const getQuoteContactId = (quote: Quote) =>
    firstValidId(
      (quote as any).contactId,
      (quote as any).contact_id,
      (quote as any).contact?.id,
      (quote as any).contact?.contactId,
      (quote as any).contact?.contact_id,
    );

  const getOpportunityName = (quote: Quote) => {
    const opportunityId = getQuoteOpportunityId(quote);
    if (!opportunityId) {
      return "Unknown Opportunity";
    }
    const opportunity = opportunities.find(
      (o) => normalizeId(o.id) === opportunityId,
    );
    return (
      opportunity?.title || (opportunity as any)?.name || "Unknown Opportunity"
    );
  };

  const getContactName = (quote: Quote) => {
    let contactId = getQuoteContactId(quote);
    if (!contactId) {
      const opportunity = opportunities.find(
        (o) => normalizeId(o.id) === getQuoteOpportunityId(quote),
      );
      contactId = firstValidId(
        (opportunity as any)?.contactId,
        (opportunity as any)?.contact_id,
      );
    }
    if (!contactId) {
      const inlineContactName =
        `${(quote as any)?.contact?.firstName || ""} ${(quote as any)?.contact?.lastName || ""}`.trim();
      return (
        inlineContactName ||
        (quote as any)?.contact_name ||
        (quote as any)?.contactName ||
        "Unknown Contact"
      );
    }
    const contact = contacts.find((c) =>
      [
        normalizeId(c.id),
        normalizeId((c as any).contactId),
        normalizeId((c as any).contact_id),
      ].includes(contactId),
    );
    return contact
      ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
          contact.email ||
          "Unknown Contact"
      : "Unknown Contact";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground">
              Manage your sales quotes and proposals
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
                <DialogDescription>
                  Create a new quote for your opportunity
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quote_number">Quote Number</Label>
                  <Input
                    id="quote_number"
                    value={newQuote.quoteNumber}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewQuote({ ...newQuote, quoteNumber: e.target.value })
                    }
                    placeholder="Q-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opportunity">Opportunity</Label>
                  <Select
                    value={newQuote.opportunityId}
                    onValueChange={(value: string) =>
                      setNewQuote({ ...newQuote, opportunityId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select opportunity" />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunities.map((opportunity) => (
                        <SelectItem key={opportunity.id} value={opportunity.id}>
                          {opportunity.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Select
                    value={newQuote.contactId}
                    onValueChange={(value: string) =>
                      setNewQuote({ ...newQuote, contactId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newQuote.amount}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) => setNewQuote({ ...newQuote, amount: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newQuote.title}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) => setNewQuote({ ...newQuote, title: e.target.value })}
                    placeholder="Quote title"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newQuote.description}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewQuote({ ...newQuote, description: e.target.value })
                    }
                    placeholder="Quote description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={newQuote.validUntil}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewQuote({ ...newQuote, validUntil: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={newQuote.terms}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) => setNewQuote({ ...newQuote, terms: e.target.value })}
                    placeholder="Terms and conditions"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateQuote} className="w-full sm:w-auto">
                  Create Quote
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Quotes
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  quotes.reduce((sum, quote) => sum + (quote.amount || 0), 0),
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <Badge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotes.filter((quote) => quote.status === "accepted").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotes.filter((quote) => quote.status === "sent").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
            <CardDescription>
              View and manage all your sales quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell>{quote.title}</TableCell>
                    <TableCell>{getOpportunityName(quote)}</TableCell>
                    <TableCell>{getContactName(quote)}</TableCell>
                    <TableCell>
                      {getCurrencySymbol()}
                      {(quote.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {quote.validUntil
                        ? new Date(quote.validUntil).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewQuote(quote)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuote(quote);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadQuote(quote)}
                          disabled={downloadingQuoteId === quote.id}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuote(quote.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {quotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No quotes found. Create your first quote to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Quote Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Quote</DialogTitle>
              <DialogDescription>Update quote information</DialogDescription>
            </DialogHeader>
            {selectedQuote && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_title">Title</Label>
                  <Input
                    id="edit_title"
                    value={selectedQuote.title}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedQuote({
                        ...selectedQuote,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_amount">Amount</Label>
                  <Input
                    id="edit_amount"
                    type="number"
                    value={selectedQuote.amount?.toString() || ""}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedQuote({
                        ...selectedQuote,
                        amount: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={selectedQuote.status}
                    onValueChange={(value: string) =>
                      setSelectedQuote({
                        ...selectedQuote,
                        status: value as QuoteStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_valid_until">Valid Until</Label>
                  <Input
                    id="edit_valid_until"
                    type="date"
                    value={
                      selectedQuote.validUntil
                        ? new Date(selectedQuote.validUntil)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedQuote({
                        ...selectedQuote,
                        validUntil: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    value={selectedQuote.description || ""}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedQuote({
                        ...selectedQuote,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateQuote} className="w-full sm:w-auto">
                Update Quote
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quote Details</DialogTitle>
              <DialogDescription>View quote information</DialogDescription>
            </DialogHeader>
            {selectedQuote && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Quote Number</Label>
                  <p>{selectedQuote.quoteNumber || "-"}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p>{selectedQuote.status}</p>
                </div>
                <div className="md:col-span-2">
                  <Label>Title</Label>
                  <p>{selectedQuote.title || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <p>{selectedQuote.description || "-"}</p>
                </div>
                <div>
                  <Label>Opportunity</Label>
                  <p>{getOpportunityName(selectedQuote)}</p>
                </div>
                <div>
                  <Label>Contact</Label>
                  <p>{getContactName(selectedQuote)}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p>
                    {getCurrencySymbol()}
                    {(selectedQuote.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <p>
                    {selectedQuote.validUntil
                      ? new Date(selectedQuote.validUntil).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label>Terms</Label>
                  <p>{selectedQuote.terms || "-"}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              {selectedQuote && (
                <Button
                  onClick={() => handleDownloadQuote(selectedQuote)}
                  className="w-full sm:w-auto"
                >
                  Download PDF
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
