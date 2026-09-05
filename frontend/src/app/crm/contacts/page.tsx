"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import { DashboardLayout } from "../../../components/layout";
import { useCustomOptions } from "../../../hooks/useCustomOptions";
import { CustomOptionDialog } from "../../../components/common/CustomOptionDialog";
import CRMService from "@/src/services/CRMService";
import fileUploadService from "@/src/services/FileUploadService";
import {
  Contact,
  ContactType,
  CRMContactFilters,
  ContactCreate,
  ContactUpdate,
  ContactAttachment,
  Company,
} from "@/src/models/crm";
import {
  defaultEmailRowsFromEntity,
  defaultPhoneRowsFromEntity,
} from "@/src/components/crm/LabeledContactFields";
import {
  defaultSocialLinks,
  mergeSocialFromApi,
  birthdayInputFromApi,
  buildAddressesPayload,
} from "@/src/components/crm/contacts/contactUtils";
import { ContactsLoadingState } from "@/src/components/crm/contacts/ContactsLoadingState";
import { ContactsPageHeader } from "@/src/components/crm/contacts/ContactsPageHeader";
import { ContactsFiltersCard } from "@/src/components/crm/contacts/ContactsFiltersCard";
import { ContactsListCard } from "@/src/components/crm/contacts/ContactsListCard";
import { ContactFormDialog } from "@/src/components/crm/contacts/ContactFormDialog";
import { ContactViewDialog } from "@/src/components/crm/contacts/ContactViewDialog";
import { ContactDeleteDialog } from "@/src/components/crm/contacts/ContactDeleteDialog";
import { useAuth } from "@/src/contexts/AuthContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { User } from "@/src/models";
import { apiService } from "@/src/services/ApiService";
import { toast } from "sonner";
import { type UserSearchItem } from "@/src/components/ui/user-search";

export default function CRMContactsPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don&apos;t have access to CRM module</div>}
    >
      <CRMContactsContent />
    </ModuleGuard>
  );
}

const CONTACTS_PAGE_SIZE = 20;

function CRMContactsContent() {
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "crm:contacts",
  );
  const searchParams = useSearchParams();
  const router = useRouter();
  const openedContactIdRef = useRef<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<CRMContactFilters>({});
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCustomContactTypeDialog, setShowCustomContactTypeDialog] =
    useState(false);
  const [openAdditional, setOpenAdditional] = useState(false);
  const [openAddresses, setOpenAddresses] = useState(false);
  const [openContactDetails, setOpenContactDetails] = useState(false);

  const {
    customContactTypes,
    createCustomContactType,
    loading: customOptionsLoading,
  } = useCustomOptions();

  const [formData, setFormData] = useState<ContactCreate>({
    firstName: "",
    lastName: "",
    emails: [{ value: "", label: "personal" }],
    phones: [{ value: "", label: "work" }],
    jobTitle: "",
    department: "",
    companyId: "",
    contactType: ContactType.CUSTOMER,
    notes: "",
    description: "",
    tags: [],
    attachments: [] as ContactAttachment[],
    isActive: true,
    initials: "",
    fullName: "",
    birthday: "",
    businessTaxId: "",
    addresses: [],
    socialLinks: defaultSocialLinks(),
    assignedTo: "",
    website: "",
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const attachmentFileInputRef = React.useRef<HTMLInputElement>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const initialContactsLoad = React.useRef(true);

  const loadCompanies = useCallback(async () => {
    try {
      const response = await CRMService.getCompanies({}, 1, 100);
      setCompanies(response.companies || []);
    } catch (err) {}
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      if (initialContactsLoad.current) {
        setLoading(true);
      } else {
        setListLoading(true);
      }
      const response = await CRMService.getContacts(
        filters,
        page,
        CONTACTS_PAGE_SIZE,
      );
      setContacts(response.contacts);
      setTotalPages(Math.max(1, response.pagination.pages));
      setTotalCount(response.pagination.total);
    } catch (err) {
    } finally {
      setLoading(false);
      setListLoading(false);
      initialContactsLoad.current = false;
    }
  }, [filters, page]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleFiltersChange: React.Dispatch<
    React.SetStateAction<CRMContactFilters>
  > = (action) => {
    setFilters(action);
    setPage(1);
  };

  const fetchUsers = useCallback(async () => {
    try {
      let tenantId: string | null = null;
      const selectedTenant = localStorage.getItem("selectedTenant");
      if (selectedTenant) {
        try {
          const parsed = JSON.parse(selectedTenant);
          tenantId = parsed.id || parsed.tenantId;
        } catch {}
      }
      if (!tenantId) {
        tenantId = localStorage.getItem("currentTenantId");
      }
      if (tenantId) {
        const response = await apiService.getTenantUsers(tenantId);
        const uniqueUsers = (response.users || []).reduce(
          (acc: User[], u: User) => {
            const existing = acc.find(
              (x) => x.userId === u.userId || x.id === u.userId,
            );
            if (!existing) acc.push(u);
            return acc;
          },
          [],
        );
        setUsers(uniqueUsers);
      } else {
        setUsers([]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const contactId = searchParams.get("contactId")?.trim();
    if (!contactId || openedContactIdRef.current === contactId) {
      return;
    }
    openedContactIdRef.current = contactId;

    (async () => {
      try {
        const contact = await CRMService.getContact(contactId);
        setViewingContact(contact);
      } catch {
        toast.error("Contact not found");
      } finally {
        router.replace("/crm/contacts", { scroll: false });
      }
    })();
  }, [searchParams, router]);

  const selectedAssignee = useMemo((): UserSearchItem | null => {
    if (!formData.assignedTo) return null;
    const found = users.find((u) => (u.id || u.userId) === formData.assignedTo);
    if (found) return found;
    return {
      id: formData.assignedTo,
      userId: formData.assignedTo,
      userName: formData.assignedTo,
    };
  }, [users, formData.assignedTo]);

  const handleSearch = () => {
    setFilters((prev: CRMContactFilters) => ({ ...prev, search }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
    setPage(1);
  };

  const handleCreateCustomContactType = async (
    name: string,
    description: string,
  ) => {
    try {
      await createCustomContactType(name, description);
    } catch (error) {}
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      emails: [{ value: "", label: "personal" }],
      phones: [{ value: "", label: "work" }],
      jobTitle: "",
      department: "",
      companyId: "",
      contactType: ContactType.CUSTOMER,
      notes: "",
      description: "",
      tags: [],
      attachments: [],
      isActive: true,
      initials: "",
      fullName: "",
      birthday: "",
      businessTaxId: "",
      addresses: [],
      socialLinks: defaultSocialLinks(),
      assignedTo: "",
      website: "",
    });
    setOpenAdditional(false);
    setOpenAddresses(false);
    setOpenContactDetails(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setSubmitting(true);
    try {
      const addressesPayload = buildAddressesPayload(formData.addresses);
      const socialPayload = mergeSocialFromApi(formData.socialLinks);
      if (editingContact) {
        const payload: ContactUpdate = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          emails: (formData.emails || []).filter((e) => e.value.trim()),
          phones: (formData.phones || []).filter((p) => p.value.trim()),
          jobTitle: formData.jobTitle,
          department: formData.department,
          companyId: formData.companyId || undefined,
          contactType: formData.contactType,
          notes: formData.notes,
          description: formData.description,
          tags: formData.tags,
          attachments: formData.attachments,
          isActive: formData.isActive,
          initials: formData.initials?.trim() || null,
          fullName: formData.fullName?.trim() || null,
          businessTaxId: formData.businessTaxId?.trim() || null,
          addresses: addressesPayload,
          socialLinks: socialPayload,
          birthday: formData.birthday?.trim()
            ? `${formData.birthday.trim()}T00:00:00`
            : null,
          website: formData.website?.trim() || null,
          assignedTo: formData.assignedTo || undefined,
        };
        await CRMService.updateContact(editingContact.id, payload);
        setSuccessMessage("Contact updated successfully!");
        setShowCreateDialog(false);
        setEditingContact(null);
        resetForm();
        loadContacts();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        await CRMService.createContact({
          ...formData,
          emails: (formData.emails || []).filter((e) => e.value.trim()),
          phones: (formData.phones || []).filter((p) => p.value.trim()),
          initials: formData.initials?.trim() || undefined,
          fullName: formData.fullName?.trim() || undefined,
          businessTaxId: formData.businessTaxId?.trim() || undefined,
          addresses: addressesPayload,
          socialLinks: socialPayload,
          ...(formData.birthday?.trim()
            ? { birthday: `${formData.birthday.trim()}T00:00:00` }
            : {}),
          website: formData.website?.trim() || undefined,
          assignedTo: formData.assignedTo || undefined,
        });
        setSuccessMessage("Contact created successfully!");
        setShowCreateDialog(false);
        resetForm();
        loadContacts();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage("Error saving contact. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      emails: defaultEmailRowsFromEntity(contact),
      phones: defaultPhoneRowsFromEntity(contact),
      jobTitle: contact.jobTitle || "",
      department: contact.department || "",
      companyId: contact.companyId || "",
      contactType: contact.contactType ?? ContactType.CUSTOMER,
      notes: contact.notes || "",
      description: contact.description || "",
      tags: contact.tags || [],
      attachments: contact.attachments || [],
      isActive: contact.isActive,
      initials: contact.initials || "",
      fullName: contact.fullName || "",
      birthday: birthdayInputFromApi(contact.birthday),
      businessTaxId: contact.businessTaxId || "",
      addresses: Array.isArray(contact.addresses) ? contact.addresses : [],
      socialLinks: mergeSocialFromApi(contact.socialLinks),
      assignedTo: contact.assignedTo || "",
      website: contact.website || "",
    });
    setShowCreateDialog(true);
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
    } catch {
      setErrorMessage("File upload failed. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
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
          setErrorMessage("Removed from list; storage delete may have failed.");
          setTimeout(() => setErrorMessage(""), 5000);
        }
      }
    }
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  const handleView = (contact: Contact) => {
    setViewingContact(contact);
  };

  const handleDelete = (contact: Contact) => {
    setDeletingContact(contact);
  };

  const confirmDelete = async () => {
    if (!deletingContact) return;

    setDeleting(true);
    try {
      await CRMService.deleteContact(deletingContact.id);
      setSuccessMessage("Contact deleted successfully!");
      setDeletingContact(null);
      loadContacts();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Error deleting contact. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && contacts.length === 0) {
    return <ContactsLoadingState />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <ContactsPageHeader
          successMessage={successMessage}
          onNewContact={
            canCreate()
              ? () => {
                  setEditingContact(null);
                  resetForm();
                  const uid = user?.id || user?.userId;
                  if (uid) {
                    setFormData((prev) => ({ ...prev, assignedTo: uid }));
                  }
                  setErrorMessage("");
                  setSuccessMessage("");
                  setShowCreateDialog(true);
                }
              : undefined
          }
        />

        <ContactsFiltersCard
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearch}
          filters={filters}
          setFilters={handleFiltersChange}
          onResetFilters={resetFilters}
          users={users}
        />

        <ContactsListCard
          contacts={contacts}
          companies={companies}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          listLoading={listLoading}
          onPageChange={setPage}
          onView={handleView}
          onEdit={canUpdate() ? handleEdit : undefined}
          onDelete={canDelete() ? handleDelete : undefined}
        />

        <ContactFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          editingContact={editingContact}
          formData={formData}
          setFormData={setFormData}
          companies={companies}
          customContactTypes={customContactTypes}
          onRequestCustomContactType={() =>
            setShowCustomContactTypeDialog(true)
          }
          users={users}
          selectedAssignee={selectedAssignee}
          openAdditional={openAdditional}
          onToggleAdditional={() => setOpenAdditional((o) => !o)}
          openAddresses={openAddresses}
          onToggleAddresses={() => setOpenAddresses((o) => !o)}
          openContactDetails={openContactDetails}
          onToggleContactDetails={() => setOpenContactDetails((o) => !o)}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => {
            setShowCreateDialog(false);
            setEditingContact(null);
            resetForm();
            setErrorMessage("");
            setSuccessMessage("");
          }}
          attachmentFileInputRef={attachmentFileInputRef}
          onAttachmentFile={handleAttachmentFile}
          attachmentUploading={attachmentUploading}
          onRemoveAttachment={removeAttachmentAt}
        />

        <ContactViewDialog
          contact={viewingContact}
          companies={companies}
          onClose={() => setViewingContact(null)}
          onEdit={canUpdate() ? handleEdit : undefined}
        />

        <ContactDeleteDialog
          contact={deletingContact}
          deleting={deleting}
          onClose={() => setDeletingContact(null)}
          onConfirm={confirmDelete}
        />

        <CustomOptionDialog
          open={showCustomContactTypeDialog}
          onOpenChange={setShowCustomContactTypeDialog}
          title="Create New Contact Type"
          description="Create a custom contact type that will be available for your tenant."
          optionName="Contact Type"
          placeholder="e.g., Partner, Vendor"
          onSubmit={handleCreateCustomContactType}
          loading={customOptionsLoading.contactType}
        />
      </div>
    </DashboardLayout>
  );
}
