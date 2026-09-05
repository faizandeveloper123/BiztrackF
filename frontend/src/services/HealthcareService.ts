import { ApiService } from "./ApiService";
import type {
  Doctor,
  DoctorCreate,
  DoctorUpdate,
  DoctorsResponse,
  Patient,
  PatientCreate,
  PatientUpdate,
  PatientsResponse,
  HealthcareStaff,
  HealthcareStaffCreate,
  HealthcareStaffUpdate,
  HealthcareStaffResponse,
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentsResponse,
  Prescription,
  PrescriptionCreate,
  PrescriptionUpdate,
  PrescriptionsResponse,
  ExpenseCategory,
  ExpenseCategoryCreate,
  ExpenseCategoryUpdate,
  ExpenseCategoriesResponse,
  DailyExpense,
  DailyExpenseCreate,
  DailyExpenseUpdate,
  DailyExpensesResponse,
  PatientHistoryResponse,
  Admission,
  AdmissionCreate,
  AdmissionUpdate,
  AdmissionsResponse,
  AdmissionInvoicesResponse,
} from "../models/healthcare";

const apiService = new ApiService();

export class HealthcareQueries {
  async getDoctors(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<DoctorsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 20));
    return apiService.get<DoctorsResponse>(
      `/healthcare/doctors?${searchParams.toString()}`,
    );
  }

  async getDoctor(id: string): Promise<Doctor> {
    return apiService.get<Doctor>(`/healthcare/doctors/${id}`);
  }

  async getPatients(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PatientsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 500));
    return apiService.get<PatientsResponse>(
      `/healthcare/patients?${searchParams.toString()}`,
    );
  }

  async getPatient(id: string): Promise<Patient> {
    return apiService.get<Patient>(`/healthcare/patients/${id}`);
  }

  async getPatientHistory(patientId: string): Promise<PatientHistoryResponse> {
    return apiService.get<PatientHistoryResponse>(
      `/healthcare/patients/${patientId}/history`,
    );
  }

  async getStaff(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<HealthcareStaffResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 20));
    return apiService.get<HealthcareStaffResponse>(
      `/healthcare/staff?${searchParams.toString()}`,
    );
  }

  async getAppointments(params?: {
    doctor_id?: string;
    patient_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AppointmentsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.doctor_id) searchParams.set("doctor_id", params.doctor_id);
    if (params?.patient_id) searchParams.set("patient_id", params.patient_id);
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 100));
    return apiService.get<AppointmentsResponse>(
      `/healthcare/appointments?${searchParams.toString()}`,
    );
  }

  async getAppointmentsCalendar(params: {
    date_from: string;
    date_to: string;
    doctor_id?: string;
  }): Promise<AppointmentsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("date_from", params.date_from);
    searchParams.set("date_to", params.date_to);
    if (params?.doctor_id) searchParams.set("doctor_id", params.doctor_id);
    return apiService.get<AppointmentsResponse>(
      `/healthcare/appointments/calendar?${searchParams.toString()}`,
    );
  }

  async getAppointment(id: string): Promise<Appointment> {
    return apiService.get<Appointment>(`/healthcare/appointments/${id}`);
  }

  async getPrescriptions(params?: {
    appointment_id?: string;
    doctor_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PrescriptionsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.appointment_id)
      searchParams.set("appointment_id", params.appointment_id);
    if (params?.doctor_id) searchParams.set("doctor_id", params.doctor_id);
    if (params?.search) searchParams.set("search", params.search);
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 50));
    return apiService.get<PrescriptionsResponse>(
      `/healthcare/prescriptions?${searchParams.toString()}`,
    );
  }

  async getPrescription(id: string): Promise<Prescription> {
    return apiService.get<Prescription>(`/healthcare/prescriptions/${id}`);
  }

  async getPrescriptionDownload(id: string): Promise<Blob> {
    return apiService.getBlob(`/healthcare/prescriptions/${id}/download`);
  }

  async getExpenseCategories(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ExpenseCategoriesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 500));
    return apiService.get<ExpenseCategoriesResponse>(
      `/healthcare/expense-categories?${searchParams.toString()}`,
    );
  }

  async getExpenseCategory(id: string): Promise<ExpenseCategory> {
    return apiService.get<ExpenseCategory>(
      `/healthcare/expense-categories/${id}`,
    );
  }

  async getDailyExpenses(params?: {
    category_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<DailyExpensesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.category_id)
      searchParams.set("category_id", params.category_id);
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 500));
    return apiService.get<DailyExpensesResponse>(
      `/healthcare/daily-expenses?${searchParams.toString()}`,
    );
  }

  async getDailyExpense(id: string): Promise<DailyExpense> {
    return apiService.get<DailyExpense>(`/healthcare/daily-expenses/${id}`);
  }

  async getAdmissions(params?: {
    status?: string;
    patient_id?: string;
    doctor_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AdmissionsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.patient_id) searchParams.set("patient_id", params.patient_id);
    if (params?.doctor_id) searchParams.set("doctor_id", params.doctor_id);
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 100));
    return apiService.get<AdmissionsResponse>(
      `/healthcare/admissions?${searchParams.toString()}`,
    );
  }

  async getAdmission(id: string): Promise<Admission> {
    return apiService.get<Admission>(`/healthcare/admissions/${id}`);
  }

  async getAdmissionInvoices(params?: {
    page?: number;
    limit?: number;
  }): Promise<AdmissionInvoicesResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 50));
    return apiService.get<AdmissionInvoicesResponse>(
      `/healthcare/admission-invoices?${searchParams.toString()}`,
    );
  }
}

export class HealthcareCommands {
  async createDoctor(data: DoctorCreate): Promise<Doctor> {
    return apiService.post<Doctor>("/healthcare/doctors", data);
  }

  async updateDoctor(id: string, data: DoctorUpdate): Promise<Doctor> {
    return apiService.put<Doctor>(`/healthcare/doctors/${id}`, data);
  }

  async deleteDoctor(id: string): Promise<void> {
    return apiService.delete(`/healthcare/doctors/${id}`);
  }

  async createPatient(data: PatientCreate): Promise<Patient> {
    return apiService.post<Patient>("/healthcare/patients", data);
  }

  async updatePatient(id: string, data: PatientUpdate): Promise<Patient> {
    return apiService.put<Patient>(`/healthcare/patients/${id}`, data);
  }

  async deletePatient(id: string): Promise<void> {
    return apiService.delete(`/healthcare/patients/${id}`);
  }

  async createStaff(data: HealthcareStaffCreate): Promise<HealthcareStaff> {
    return apiService.post<HealthcareStaff>("/healthcare/staff", data);
  }

  async updateStaff(
    id: string,
    data: HealthcareStaffUpdate,
  ): Promise<HealthcareStaff> {
    return apiService.put<HealthcareStaff>(`/healthcare/staff/${id}`, data);
  }

  async deleteStaff(id: string): Promise<void> {
    return apiService.delete(`/healthcare/staff/${id}`);
  }

  async createAppointment(data: AppointmentCreate): Promise<Appointment> {
    return apiService.post<Appointment>("/healthcare/appointments", data);
  }

  async updateAppointment(
    id: string,
    data: AppointmentUpdate,
  ): Promise<Appointment> {
    return apiService.put<Appointment>(`/healthcare/appointments/${id}`, data);
  }

  async deleteAppointment(id: string): Promise<void> {
    return apiService.delete(`/healthcare/appointments/${id}`);
  }

  async createPrescription(data: PrescriptionCreate): Promise<Prescription> {
    return apiService.post<Prescription>("/healthcare/prescriptions", data);
  }

  async updatePrescription(
    id: string,
    data: PrescriptionUpdate,
  ): Promise<Prescription> {
    return apiService.put<Prescription>(
      `/healthcare/prescriptions/${id}`,
      data,
    );
  }

  async deletePrescription(id: string): Promise<void> {
    return apiService.delete(`/healthcare/prescriptions/${id}`);
  }

  async createAppointmentInvoice(
    appointmentId: string,
    data: { line_items: Array<{ description: string; amount: number }> },
  ): Promise<{ invoice_id: string; invoice_number: string }> {
    return apiService.post<{ invoice_id: string; invoice_number: string }>(
      `/healthcare/appointments/${appointmentId}/invoice`,
      {
        line_items: data.line_items,
      },
    );
  }

  async createAdmission(data: AdmissionCreate): Promise<Admission> {
    return apiService.post<Admission>("/healthcare/admissions", data);
  }

  async updateAdmission(id: string, data: AdmissionUpdate): Promise<Admission> {
    return apiService.put<Admission>(`/healthcare/admissions/${id}`, data);
  }

  async deleteAdmission(id: string): Promise<void> {
    return apiService.delete(`/healthcare/admissions/${id}`);
  }

  async createAdmissionInvoice(
    admissionId: string,
    data: { line_items: Array<{ description: string; amount: number }> },
  ): Promise<{ invoice_id: string; invoice_number: string }> {
    return apiService.post<{ invoice_id: string; invoice_number: string }>(
      `/healthcare/admissions/${admissionId}/invoice`,
      {
        line_items: data.line_items,
      },
    );
  }

  async createExpenseCategory(
    data: ExpenseCategoryCreate,
  ): Promise<ExpenseCategory> {
    return apiService.post<ExpenseCategory>(
      "/healthcare/expense-categories",
      data,
    );
  }

  async updateExpenseCategory(
    id: string,
    data: ExpenseCategoryUpdate,
  ): Promise<ExpenseCategory> {
    return apiService.put<ExpenseCategory>(
      `/healthcare/expense-categories/${id}`,
      data,
    );
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    return apiService.delete(`/healthcare/expense-categories/${id}`);
  }

  async createDailyExpense(data: DailyExpenseCreate): Promise<DailyExpense> {
    return apiService.post<DailyExpense>("/healthcare/daily-expenses", data);
  }

  async updateDailyExpense(
    id: string,
    data: DailyExpenseUpdate,
  ): Promise<DailyExpense> {
    return apiService.put<DailyExpense>(
      `/healthcare/daily-expenses/${id}`,
      data,
    );
  }

  async deleteDailyExpense(id: string): Promise<void> {
    return apiService.delete(`/healthcare/daily-expenses/${id}`);
  }
}

export const healthcareQueries = new HealthcareQueries();
export const healthcareCommands = new HealthcareCommands();

export class HealthcareService {
  queries = healthcareQueries;
  commands = healthcareCommands;

  getDoctors = healthcareQueries.getDoctors.bind(healthcareQueries);
  getDoctor = healthcareQueries.getDoctor.bind(healthcareQueries);
  getPatients = healthcareQueries.getPatients.bind(healthcareQueries);
  getPatient = healthcareQueries.getPatient.bind(healthcareQueries);
  getPatientHistory =
    healthcareQueries.getPatientHistory.bind(healthcareQueries);
  getStaff = healthcareQueries.getStaff.bind(healthcareQueries);
  getAppointments = healthcareQueries.getAppointments.bind(healthcareQueries);
  getAppointmentsCalendar =
    healthcareQueries.getAppointmentsCalendar.bind(healthcareQueries);
  getAppointment = healthcareQueries.getAppointment.bind(healthcareQueries);
  getPrescriptions = healthcareQueries.getPrescriptions.bind(healthcareQueries);
  getPrescription = healthcareQueries.getPrescription.bind(healthcareQueries);
  getPrescriptionDownload =
    healthcareQueries.getPrescriptionDownload.bind(healthcareQueries);
  getExpenseCategories =
    healthcareQueries.getExpenseCategories.bind(healthcareQueries);
  getExpenseCategory =
    healthcareQueries.getExpenseCategory.bind(healthcareQueries);
  getDailyExpenses = healthcareQueries.getDailyExpenses.bind(healthcareQueries);
  getDailyExpense = healthcareQueries.getDailyExpense.bind(healthcareQueries);
  getAdmissions = healthcareQueries.getAdmissions.bind(healthcareQueries);
  getAdmission = healthcareQueries.getAdmission.bind(healthcareQueries);
  getAdmissionInvoices =
    healthcareQueries.getAdmissionInvoices.bind(healthcareQueries);

  createAppointmentInvoice =
    healthcareCommands.createAppointmentInvoice.bind(healthcareCommands);
  createAdmission = healthcareCommands.createAdmission.bind(healthcareCommands);
  updateAdmission = healthcareCommands.updateAdmission.bind(healthcareCommands);
  deleteAdmission = healthcareCommands.deleteAdmission.bind(healthcareCommands);
  createAdmissionInvoice =
    healthcareCommands.createAdmissionInvoice.bind(healthcareCommands);
  createExpenseCategory =
    healthcareCommands.createExpenseCategory.bind(healthcareCommands);
  updateExpenseCategory =
    healthcareCommands.updateExpenseCategory.bind(healthcareCommands);
  deleteExpenseCategory =
    healthcareCommands.deleteExpenseCategory.bind(healthcareCommands);
  createDailyExpense =
    healthcareCommands.createDailyExpense.bind(healthcareCommands);
  updateDailyExpense =
    healthcareCommands.updateDailyExpense.bind(healthcareCommands);
  deleteDailyExpense =
    healthcareCommands.deleteDailyExpense.bind(healthcareCommands);

  createDoctor = healthcareCommands.createDoctor.bind(healthcareCommands);
  updateDoctor = healthcareCommands.updateDoctor.bind(healthcareCommands);
  deleteDoctor = healthcareCommands.deleteDoctor.bind(healthcareCommands);
  createPatient = healthcareCommands.createPatient.bind(healthcareCommands);
  updatePatient = healthcareCommands.updatePatient.bind(healthcareCommands);
  deletePatient = healthcareCommands.deletePatient.bind(healthcareCommands);
  createStaff = healthcareCommands.createStaff.bind(healthcareCommands);
  updateStaff = healthcareCommands.updateStaff.bind(healthcareCommands);
  deleteStaff = healthcareCommands.deleteStaff.bind(healthcareCommands);
  createAppointment =
    healthcareCommands.createAppointment.bind(healthcareCommands);
  updateAppointment =
    healthcareCommands.updateAppointment.bind(healthcareCommands);
  deleteAppointment =
    healthcareCommands.deleteAppointment.bind(healthcareCommands);
  createPrescription =
    healthcareCommands.createPrescription.bind(healthcareCommands);
  updatePrescription =
    healthcareCommands.updatePrescription.bind(healthcareCommands);
  deletePrescription =
    healthcareCommands.deletePrescription.bind(healthcareCommands);
}

const healthcareService = new HealthcareService();
export default healthcareService;
