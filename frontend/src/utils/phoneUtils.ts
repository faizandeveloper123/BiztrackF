export function resolveCustomerPhone(
  customer:
    | {
        phone?: string;
        mobile?: string;
        phones?: { value?: string }[];
      }
    | null
    | undefined,
): string {
  if (!customer) return "";
  if (customer.phone?.trim()) return customer.phone.trim();
  if (customer.mobile?.trim()) return customer.mobile.trim();
  const fromList = customer.phones?.find((p) => p?.value?.trim());
  return fromList?.value?.trim() ?? "";
}

export function isValidPhoneInput(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}
