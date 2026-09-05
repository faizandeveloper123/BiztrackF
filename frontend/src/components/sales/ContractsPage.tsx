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
import CRMService from "../../services/CRMService";
import apiService from "../../services/ApiService";
import { Contract, ContractStatus } from "../../models/sales";
import { Opportunity, Contact, Company } from "../../models/crm";
import { DashboardLayout } from "../layout";

export default function ContractsPage() {
  const confirm = useConfirm();
  const { getCurrencySymbol, formatCurrency } = useCurrency();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [newContract, setNewContract] = useState({
    contractNumber: "",
    opportunityId: "",
    contactId: "",
    companyId: "",
    title: "",
    description: "",
    value: "",
    startDate: "",
    endDate: "",
    terms: "",
    autoRenew: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contractsData, opportunitiesData, contactsData, companiesData] =
        await Promise.all([
          apiService.getContracts({ page: 1, limit: 100 }),
          CRMService.getOpportunities({}, 1, 500),
          CRMService.getContacts({}, 1, 500),
          CRMService.getCompanies({}, 1, 500),
        ]);
      setContracts(contractsData.contracts || []);
      setOpportunities(opportunitiesData.opportunities || []);
      setContacts(contactsData.contacts || []);
      setCompanies(companiesData.companies || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    try {
      const contractData = {
        ...newContract,
        value: parseFloat(newContract.value),
        startDate: new Date(newContract.startDate).toISOString(),
        endDate: new Date(newContract.endDate).toISOString(),
      };
      await apiService.createContract(contractData);
      toast.success("Contract created successfully");
      setIsCreateDialogOpen(false);
      setNewContract({
        contractNumber: "",
        opportunityId: "",
        contactId: "",
        companyId: "",
        title: "",
        description: "",
        value: "",
        startDate: "",
        endDate: "",
        terms: "",
        autoRenew: false,
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create contract");
    }
  };

  const handleUpdateContract = async () => {
    if (!selectedContract) return;
    try {
      await apiService.updateContract(selectedContract.id, selectedContract);
      toast.success("Contract updated successfully");
      setIsEditDialogOpen(false);
      setSelectedContract(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to update contract");
    }
  };

  const handleDeleteContract = async (id: string) => {
    const ok = await confirm({
      description: "Are you sure you want to delete this contract?",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await apiService.deleteContract(id);
      toast.success("Contract deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete contract");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "terminated":
        return "bg-yellow-100 text-yellow-800";
      case "renewed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const idsMatch = (a: string | undefined, b: string | undefined) => {
    if (a == null || b == null) return false;
    const na = String(a).replace(/-/g, "").toLowerCase();
    const nb = String(b).replace(/-/g, "").toLowerCase();
    return na.length > 0 && na === nb;
  };

  const resolveContactId = (contract: Contract) => {
    if (contract.contactId) return contract.contactId;
    const opp = opportunities.find((o) =>
      idsMatch(o.id, contract.opportunityId),
    );
    return opp?.contactId ?? "";
  };

  const resolveCompanyId = (contract: Contract) => {
    if (contract.companyId) return contract.companyId;
    const opp = opportunities.find((o) =>
      idsMatch(o.id, contract.opportunityId),
    );
    return opp?.companyId ?? "";
  };

  const getContactName = (contactId: string) => {
    if (!contactId) return "Unknown Contact";
    const contact = contacts.find((c) => idsMatch(c.id, contactId));
    return contact
      ? `${contact.firstName} ${contact.lastName}`.trim()
      : "Unknown Contact";
  };

  const getCompanyName = (companyId: string) => {
    if (!companyId) return "Unknown Company";
    const company = companies.find((c) => idsMatch(c.id, companyId));
    return company?.name?.trim() || "Unknown Company";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
            <p className="text-muted-foreground">
              Manage your sales contracts and agreements
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Contract</DialogTitle>
                <DialogDescription>
                  Create a new contract for your opportunity
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_number">Contract Number</Label>
                  <Input
                    id="contract_number"
                    value={newContract.contractNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewContract({
                        ...newContract,
                        contractNumber: e.target.value,
                      })
                    }
                    placeholder="C-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opportunity">Opportunity</Label>
                  <Select
                    value={newContract.opportunityId}
                    onValueChange={(value: string) =>
                      setNewContract({ ...newContract, opportunityId: value })
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
                    value={newContract.contactId}
                    onValueChange={(value: string) =>
                      setNewContract({ ...newContract, contactId: value })
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
                  <Label htmlFor="company">Company</Label>
                  <Select
                    value={newContract.companyId}
                    onValueChange={(value: string) =>
                      setNewContract({ ...newContract, companyId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newContract.title}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewContract({ ...newContract, title: e.target.value })
                    }
                    placeholder="Contract title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newContract.value}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewContract({ ...newContract, value: e.target.value })
                    }
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newContract.startDate}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewContract({
                        ...newContract,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newContract.endDate}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewContract({
                        ...newContract,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newContract.description}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewContract({
                        ...newContract,
                        description: e.target.value,
                      })
                    }
                    placeholder="Contract description"
                    rows={3}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={newContract.terms}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setNewContract({ ...newContract, terms: e.target.value })
                    }
                    placeholder="Terms and conditions"
                    rows={4}
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
                <Button
                  onClick={handleCreateContract}
                  className="w-full sm:w-auto"
                >
                  Create Contract
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
                Total Contracts
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts.length}</div>
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
                  contracts.reduce(
                    (sum, contract) => sum + (contract.value || 0),
                    0,
                  ),
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Badge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  contracts.filter((contract) => contract.status === "active")
                    .length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  contracts.filter((contract) => {
                    if (!contract.endDate) return false;
                    const endDate = new Date(contract.endDate);
                    const today = new Date();
                    const thirtyDaysFromNow = new Date(
                      today.getTime() + 30 * 24 * 60 * 60 * 1000,
                    );
                    return endDate <= thirtyDaysFromNow && endDate >= today;
                  }).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Contracts</CardTitle>
            <CardDescription>
              View and manage all your sales contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.contractNumber}
                    </TableCell>
                    <TableCell>{contract.title}</TableCell>
                    <TableCell>
                      {contract.companyName?.trim() ||
                        getCompanyName(resolveCompanyId(contract))}
                    </TableCell>
                    <TableCell>
                      {contract.contactName?.trim() ||
                        getContactName(resolveContactId(contract))}
                    </TableCell>
                    <TableCell>
                      {getCurrencySymbol()}
                      {(contract.value || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.startDate
                        ? new Date(contract.startDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {contract.endDate
                        ? new Date(contract.endDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContract(contract);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContract(contract.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {contracts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      No contracts found. Create your first contract to get
                      started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Contract Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Contract</DialogTitle>
              <DialogDescription>Update contract information</DialogDescription>
            </DialogHeader>
            {selectedContract && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_title">Title</Label>
                  <Input
                    id="edit_title"
                    value={selectedContract.title}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedContract({
                        ...selectedContract,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_value">Value</Label>
                  <Input
                    id="edit_value"
                    type="number"
                    value={selectedContract.value?.toString() || ""}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedContract({
                        ...selectedContract,
                        value: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={selectedContract.status}
                    onValueChange={(value: string) =>
                      setSelectedContract({
                        ...selectedContract,
                        status: value as ContractStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="renewed">Renewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_start_date">Start Date</Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={
                      selectedContract.startDate
                        ? new Date(selectedContract.startDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedContract({
                        ...selectedContract,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_end_date">End Date</Label>
                  <Input
                    id="edit_end_date"
                    type="date"
                    value={
                      selectedContract.endDate
                        ? new Date(selectedContract.endDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedContract({
                        ...selectedContract,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    value={selectedContract.description || ""}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) =>
                      setSelectedContract({
                        ...selectedContract,
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
              <Button
                onClick={handleUpdateContract}
                className="w-full sm:w-auto"
              >
                Update Contract
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
