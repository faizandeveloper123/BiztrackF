import { apiService } from "./ApiService";
import {
  InvoiceCustomization,
  InvoiceCustomizationCreate,
  InvoiceCustomizationUpdate,
} from "../models/sales/InvoiceCustomization";

class InvoiceCustomizationService {
  private baseUrl = "/invoice-customization";

  // Get invoice customization for current tenant
  async getCustomization(): Promise<InvoiceCustomization> {
    const response = await apiService.get(`${this.baseUrl}/`);
    return response.customization;
  }

  // Create or update invoice customization
  async createCustomization(
    customizationData: InvoiceCustomizationCreate,
  ): Promise<InvoiceCustomization> {
    const response = await apiService.post(
      `${this.baseUrl}/`,
      customizationData,
    );
    return response.customization;
  }

  // Update invoice customization
  async updateCustomization(
    customizationData: InvoiceCustomizationUpdate,
  ): Promise<InvoiceCustomization> {
    const response = await apiService.put(
      `${this.baseUrl}/`,
      customizationData,
    );
    return response.customization;
  }

  // Delete invoice customization
  async deleteCustomization(): Promise<void> {
    await apiService.delete(`${this.baseUrl}/`);
  }

  // Format currency for display
  static formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  // Format date for display
  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

export default new InvoiceCustomizationService();
