import { apiService } from '../ApiService';
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
} from '../../models/healthcare';

export async function getDoctors(params?: {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}): Promise<DoctorsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active !== undefined)
    searchParams.set('is_active', String(params.is_active));
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 20));
  return apiService.get<DoctorsResponse>(
    `/healthcare/doctors?${searchParams.toString()}`,
  );
}

export async function getDoctor(id: string): Promise<Doctor> {
  return apiService.get<Doctor>(`/healthcare/doctors/${id}`);
}

export async function getPatients(params?: {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}): Promise<PatientsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active !== undefined)
    searchParams.set('is_active', String(params.is_active));
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 50));
  return apiService.get<PatientsResponse>(
    `/healthcare/patients?${searchParams.toString()}`,
  );
}

export async function getPatient(id: string): Promise<Patient> {
  return apiService.get<Patient>(`/healthcare/patients/${id}`);
}

export async function getPatientHistory(
  patientId: string,
): Promise<PatientHistoryResponse> {
  return apiService.get<PatientHistoryResponse>(
    `/healthcare/patients/${patientId}/history`,
  );
}

export async function getStaff(params?: {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}): Promise<HealthcareStaffResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active !== undefined)
    searchParams.set('is_active', String(params.is_active));
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 20));
  return apiService.get<HealthcareStaffResponse>(
    `/healthcare/staff?${searchParams.toString()}`,
  );
}

export async function getAppointments(params?: {
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
  if (params?.doctor_id) searchParams.set('doctor_id', params.doctor_id);
  if (params?.patient_id) searchParams.set('patient_id', params.patient_id);
  if (params?.date_from) searchParams.set('date_from', params.date_from);
  if (params?.date_to) searchParams.set('date_to', params.date_to);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active !== undefined)
    searchParams.set('is_active', String(params.is_active));
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 100));
  return apiService.get<AppointmentsResponse>(
    `/healthcare/appointments?${searchParams.toString()}`,
  );
}

export async function getAppointmentsCalendar(params: {
  date_from: string;
  date_to: string;
  doctor_id?: string;
}): Promise<AppointmentsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('date_from', params.date_from);
  searchParams.set('date_to', params.date_to);
  if (params?.doctor_id) searchParams.set('doctor_id', params.doctor_id);
  return apiService.get<AppointmentsResponse>(
    `/healthcare/appointments/calendar?${searchParams.toString()}`,
  );
}

export async function getAppointment(id: string): Promise<Appointment> {
  return apiService.get<Appointment>(`/healthcare/appointments/${id}`);
}

export async function getPrescriptions(params?: {
  appointment_id?: string;
  doctor_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PrescriptionsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.appointment_id)
    searchParams.set('appointment_id', params.appointment_id);
  if (params?.doctor_id) searchParams.set('doctor_id', params.doctor_id);
  if (params?.search) searchParams.set('search', params.search);
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 50));
  return apiService.get<PrescriptionsResponse>(
    `/healthcare/prescriptions?${searchParams.toString()}`,
  );
}

export async function getExpenseCategories(params?: {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}): Promise<ExpenseCategoriesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active !== undefined)
    searchParams.set('is_active', String(params.is_active));
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 500));
  return apiService.get<ExpenseCategoriesResponse>(
    `/healthcare/expense-categories?${searchParams.toString()}`,
  );
}

export async function getDailyExpenses(params?: {
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}): Promise<DailyExpensesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category_id) searchParams.set('category_id', params.category_id);
  if (params?.date_from) searchParams.set('date_from', params.date_from);
  if (params?.date_to) searchParams.set('date_to', params.date_to);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active !== undefined)
    searchParams.set('is_active', String(params.is_active));
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(Math.min(params?.limit ?? 500, 500)));
  return apiService.get<DailyExpensesResponse>(
    `/healthcare/daily-expenses?${searchParams.toString()}`,
  );
}

export async function getAdmissions(params?: {
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
  if (params?.status) searchParams.set('status', params.status);
  if (params?.patient_id) searchParams.set('patient_id', params.patient_id);
  if (params?.doctor_id) searchParams.set('doctor_id', params.doctor_id);
  if (params?.date_from) searchParams.set('date_from', params.date_from);
  if (params?.date_to) searchParams.set('date_to', params.date_to);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active !== undefined)
    searchParams.set('is_active', String(params.is_active));
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 50));
  return apiService.get<AdmissionsResponse>(
    `/healthcare/admissions?${searchParams.toString()}`,
  );
}

export async function getAdmissionInvoices(params?: {
  page?: number;
  limit?: number;
}): Promise<AdmissionInvoicesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 20));
  return apiService.get<AdmissionInvoicesResponse>(
    `/healthcare/admission-invoices?${searchParams.toString()}`,
  );
}

export async function createDoctor(data: DoctorCreate): Promise<Doctor> {
  return apiService.post<Doctor>('/healthcare/doctors', data);
}

export async function updateDoctor(
  id: string,
  data: DoctorUpdate,
): Promise<Doctor> {
  return apiService.put<Doctor>(`/healthcare/doctors/${id}`, data);
}

export async function deleteDoctor(id: string): Promise<void> {
  await apiService.delete(`/healthcare/doctors/${id}`);
}

export async function createPatient(data: PatientCreate): Promise<Patient> {
  return apiService.post<Patient>('/healthcare/patients', data);
}

export async function updatePatient(
  id: string,
  data: PatientUpdate,
): Promise<Patient> {
  return apiService.put<Patient>(`/healthcare/patients/${id}`, data);
}

export async function deletePatient(id: string): Promise<void> {
  await apiService.delete(`/healthcare/patients/${id}`);
}

export async function createStaff(
  data: HealthcareStaffCreate,
): Promise<HealthcareStaff> {
  return apiService.post<HealthcareStaff>('/healthcare/staff', data);
}

export async function updateStaff(
  id: string,
  data: HealthcareStaffUpdate,
): Promise<HealthcareStaff> {
  return apiService.put<HealthcareStaff>(`/healthcare/staff/${id}`, data);
}

export async function deleteStaff(id: string): Promise<void> {
  await apiService.delete(`/healthcare/staff/${id}`);
}

export async function createAppointment(
  data: AppointmentCreate,
): Promise<Appointment> {
  return apiService.post<Appointment>('/healthcare/appointments', data);
}

export async function updateAppointment(
  id: string,
  data: AppointmentUpdate,
): Promise<Appointment> {
  return apiService.put<Appointment>(`/healthcare/appointments/${id}`, data);
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiService.delete(`/healthcare/appointments/${id}`);
}

export async function createAppointmentInvoice(
  appointmentId: string,
  data: {
    line_items: Array<{ description: string; amount: number }>;
  },
): Promise<{ invoice_id: string; invoice_number: string }> {
  return apiService.post<{ invoice_id: string; invoice_number: string }>(
    `/healthcare/appointments/${appointmentId}/invoice`,
    {
      line_items: data.line_items,
    },
  );
}

export async function createPrescription(
  data: PrescriptionCreate,
): Promise<Prescription> {
  return apiService.post<Prescription>('/healthcare/prescriptions', data);
}

export async function updatePrescription(
  id: string,
  data: PrescriptionUpdate,
): Promise<Prescription> {
  return apiService.put<Prescription>(`/healthcare/prescriptions/${id}`, data);
}

export async function deletePrescription(id: string): Promise<void> {
  await apiService.delete(`/healthcare/prescriptions/${id}`);
}

export async function createAdmission(data: AdmissionCreate): Promise<Admission> {
  return apiService.post<Admission>('/healthcare/admissions', data);
}

export async function updateAdmission(
  id: string,
  data: AdmissionUpdate,
): Promise<Admission> {
  return apiService.put<Admission>(`/healthcare/admissions/${id}`, data);
}

export async function deleteAdmission(id: string): Promise<void> {
  await apiService.delete(`/healthcare/admissions/${id}`);
}

export async function createAdmissionInvoice(
  admissionId: string,
  data: {
    line_items: Array<{ description: string; amount: number }>;
  },
): Promise<{ invoice_id: string; invoice_number: string }> {
  return apiService.post<{ invoice_id: string; invoice_number: string }>(
    `/healthcare/admissions/${admissionId}/invoice`,
    {
      line_items: data.line_items,
    },
  );
}

export async function createExpenseCategory(
  data: ExpenseCategoryCreate,
): Promise<ExpenseCategory> {
  return apiService.post<ExpenseCategory>(
    '/healthcare/expense-categories',
    data,
  );
}

export async function updateExpenseCategory(
  id: string,
  data: ExpenseCategoryUpdate,
): Promise<ExpenseCategory> {
  return apiService.put<ExpenseCategory>(
    `/healthcare/expense-categories/${id}`,
    data,
  );
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await apiService.delete(`/healthcare/expense-categories/${id}`);
}

export async function createDailyExpense(
  data: DailyExpenseCreate,
): Promise<DailyExpense> {
  return apiService.post<DailyExpense>('/healthcare/daily-expenses', data);
}

export async function updateDailyExpense(
  id: string,
  data: DailyExpenseUpdate,
): Promise<DailyExpense> {
  return apiService.put<DailyExpense>(`/healthcare/daily-expenses/${id}`, data);
}

export async function deleteDailyExpense(id: string): Promise<void> {
  await apiService.delete(`/healthcare/daily-expenses/${id}`);
}

export async function loadMonthExpenseTotal(
  monthStart: string,
  today: string,
): Promise<number> {
  let sum = 0;
  let page = 1;
  const limit = 500;
  for (;;) {
    const res = await getDailyExpenses({
      date_from: monthStart,
      date_to: today,
      limit,
      page,
    });
    sum += res.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    if (res.expenses.length < limit) break;
    page += 1;
  }
  return sum;
}
