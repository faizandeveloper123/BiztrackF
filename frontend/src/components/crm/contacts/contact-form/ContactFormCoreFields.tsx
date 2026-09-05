import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ContactCreate, ContactType } from "@/src/models/crm";
import { LabeledContactFields } from "@/src/components/crm/LabeledContactFields";
import { CustomOption } from "@/src/services/CustomOptionsService";
import { User } from "@/src/models";
import {
  UserSearch,
  type UserSearchItem,
} from "@/src/components/ui/user-search";

type CompanyOption = { id: string; name: string };

type ContactFormCoreFieldsProps = {
  formData: ContactCreate;
  setFormData: React.Dispatch<React.SetStateAction<ContactCreate>>;
  companies: CompanyOption[];
  customContactTypes: CustomOption[];
  onRequestCustomContactType: () => void;
  users: User[];
  selectedAssignee: UserSearchItem | null;
};

export function ContactFormCoreFields({
  formData,
  setFormData,
  companies,
  customContactTypes,
  onRequestCustomContactType,
  users,
  selectedAssignee,
}: ContactFormCoreFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          placeholder="Enter first name"
          required
        />
      </div>

      <div>
        <Label htmlFor="lastName">Last Name *</Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          placeholder="Enter last name"
          required
        />
      </div>

      <LabeledContactFields
        emails={formData.emails || [{ value: "", label: "personal" }]}
        phones={formData.phones || [{ value: "", label: "work" }]}
        onEmailsChange={(emails) => setFormData({ ...formData, emails })}
        onPhonesChange={(phones) => setFormData({ ...formData, phones })}
      />

      <div>
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          id="jobTitle"
          value={formData.jobTitle}
          onChange={(e) =>
            setFormData({ ...formData, jobTitle: e.target.value })
          }
          placeholder="Enter job title"
        />
      </div>

      <div>
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
          placeholder="Enter department"
        />
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          value={formData.website || ""}
          onChange={(e) =>
            setFormData({ ...formData, website: e.target.value || undefined })
          }
          placeholder="https://"
        />
      </div>

      <div>
        <Label htmlFor="companyId">Company</Label>
        <Select
          value={formData.companyId || "none"}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              companyId: value === "none" ? "" : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Company</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <UserSearch
          users={users}
          value={selectedAssignee}
          onSelect={(user) =>
            setFormData({
              ...formData,
              assignedTo: user ? user.id || user.userId || "" : "",
            })
          }
          placeholder="Search by name or email..."
          label="Assignee"
        />
      </div>

      <div>
        <Label htmlFor="contactType">Contact Type</Label>
        <Select
          value={formData.contactType}
          onValueChange={(value) => {
            if (value === "create_new") {
              onRequestCustomContactType();
            } else {
              setFormData({
                ...formData,
                contactType: value as ContactType,
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ContactType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}

            {customContactTypes &&
              customContactTypes.length > 0 &&
              customContactTypes.map((customType) => (
                <SelectItem key={customType.id} value={customType.id}>
                  {customType.name}
                </SelectItem>
              ))}

            <SelectItem
              value="create_new"
              className="font-semibold text-blue-600"
            >
              + Create New Contact Type
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="isActive">Status</Label>
        <Select
          value={formData.isActive ? "active" : "inactive"}
          onValueChange={(value) =>
            setFormData({ ...formData, isActive: value === "active" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
