import { apiService } from '../ApiService';
import type {
  InvoiceCustomization,
  InvoiceCustomizationUpdate,
} from '../../models/sales/InvoiceCustomization';

const url = '/invoice-customization/';

export async function getInvoiceCustomization(): Promise<InvoiceCustomization> {
  const res = await apiService.get<{ customization: InvoiceCustomization }>(url);
  return res.customization;
}

export async function updateInvoiceCustomization(
  body: InvoiceCustomizationUpdate,
): Promise<InvoiceCustomization> {
  const res = await apiService.put<{ customization: InvoiceCustomization }>(
    url,
    body,
  );
  return res.customization;
}
