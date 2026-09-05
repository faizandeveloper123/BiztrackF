import { Customer, CustomerCreate } from "../services/CustomerService";

export const BUSINESS_CUSTOMER_LAST_NAME_PLACEHOLDER = ".";

export function isBusinessPlaceholderLastName(
  lastName: string | undefined,
): boolean {
  if (!lastName) return true;
  const t = lastName.trim();
  return t === "" || t === BUSINESS_CUSTOMER_LAST_NAME_PLACEHOLDER;
}

export function getCustomerDisplayName(
  customer: Pick<Customer, "firstName" | "lastName" | "customerType">,
): string {
  if (customer.customerType === "business") {
    return customer.firstName.trim();
  }
  return `${customer.firstName} ${customer.lastName}`.trim();
}

export function getBusinessNameFromCustomer(
  customer: Pick<Customer, "firstName" | "lastName" | "customerType">,
): string {
  if (customer.customerType !== "business") return "";
  return customer.firstName.trim();
}

export function validateCustomerNameFields(
  customerType: "individual" | "business" | undefined,
  firstName: string,
  lastName: string,
): string | null {
  if (customerType === "business") {
    if (!firstName.trim()) {
      return "Please enter a business name";
    }
    return null;
  }
  if (!firstName.trim() || !lastName.trim()) {
    return "Please fill in first name and last name";
  }
  return null;
}

export function buildCustomerCreatePayload(
  formData: CustomerCreate,
): CustomerCreate {
  const emails = (formData.emails || []).filter((e) => e.value.trim());
  const phones = (formData.phones || []).filter((p) => p.value.trim());

  if (formData.customerType === "business") {
    return {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: BUSINESS_CUSTOMER_LAST_NAME_PLACEHOLDER,
      emails,
      phones,
    };
  }

  return {
    ...formData,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    emails,
    phones,
  };
}
