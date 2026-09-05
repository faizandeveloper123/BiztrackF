export interface DoctorAvailabilitySlot {
  day: string;
  start_time: string;
  end_time: string;
}

export interface Doctor {
  id: string;
  tenant_id: string;
  pmdc_number: string;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  address?: string;
  availability: DoctorAvailabilitySlot[];
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorCreate {
  pmdc_number: string;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  address?: string;
  availability: DoctorAvailabilitySlot[];
}

export interface DoctorUpdate {
  pmdc_number?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  address?: string;
  availability?: DoctorAvailabilitySlot[];
  is_active?: boolean;
}

export interface DoctorsResponse {
  doctors: Doctor[];
  total: number;
}

export const HEALTHCARE_PERMISSIONS = [
  'healthcare:view',
  'healthcare:create',
  'healthcare:update',
  'healthcare:delete',
] as const;

export type HealthcarePermission = (typeof HEALTHCARE_PERMISSIONS)[number];

export interface HealthcareStaff {
  id: string;
  tenant_id: string;
  user_id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  permissions: HealthcarePermission[] | string[];
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthcareStaffCreate {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  permissions: HealthcarePermission[] | string[];
}

export interface HealthcareStaffUpdate {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  permissions?: HealthcarePermission[] | string[];
  is_active?: boolean;
}

export interface HealthcareStaffResponse {
  staff: HealthcareStaff[];
  total: number;
}

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface Appointment {
  id: string;
  tenant_id: string;
  doctor_id: string;
  patient_id?: string;
  patient_name: string;
  patient_phone?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
}

export interface AppointmentCreate {
  doctor_id: string;
  patient_id?: string;
  patient_name?: string;
  patient_phone?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status?: string;
  notes?: string;
}

export interface AppointmentUpdate {
  doctor_id?: string;
  patient_id?: string;
  patient_name?: string;
  patient_phone?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  notes?: string;
  is_active?: boolean;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
}

export interface Patient {
  id: string;
  tenant_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientCreate {
  full_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
  notes?: string;
}

export interface PatientUpdate {
  full_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

export interface PatientsResponse {
  patients: Patient[];
  total: number;
}

export interface PatientHistoryResponse {
  patient: Patient;
  appointments: Appointment[];
  prescriptions: Prescription[];
}

export type PrescriptionItemType = 'medicine' | 'vitals' | 'test';

export interface PrescriptionItem {
  type?: PrescriptionItemType;
  medicine_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  vital_name?: string;
  vital_value?: string;
  vital_unit?: string;
  test_name?: string;
  test_instructions?: string;
}

export interface Prescription {
  id: string;
  tenant_id: string;
  appointment_id: string;
  doctor_id: string;
  patient_name: string;
  patient_phone?: string;
  prescription_date: string;
  notes?: string;
  items: PrescriptionItem[];
  createdAt?: string;
  updatedAt?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  appointment_date?: string;
}

export interface PrescriptionCreate {
  appointment_id: string;
  doctor_id: string;
  patient_name: string;
  patient_phone?: string;
  prescription_date: string;
  notes?: string;
  items: PrescriptionItem[];
}

export interface PrescriptionUpdate {
  doctor_id?: string;
  patient_name?: string;
  patient_phone?: string;
  prescription_date?: string;
  notes?: string;
  items?: PrescriptionItem[];
}

export interface PrescriptionsResponse {
  prescriptions: Prescription[];
  total: number;
}

export interface ExpenseCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseCategoryCreate {
  name: string;
  description?: string;
}

export interface ExpenseCategoryUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface ExpenseCategoriesResponse {
  categories: ExpenseCategory[];
  total: number;
}

export interface DailyExpense {
  id: string;
  tenant_id: string;
  category_id: string;
  category_name?: string;
  expense_date: string;
  amount: number;
  description?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyExpenseCreate {
  category_id: string;
  expense_date: string;
  amount: number;
  description?: string;
}

export interface DailyExpenseUpdate {
  category_id?: string;
  expense_date?: string;
  amount?: number;
  description?: string;
  is_active?: boolean;
}

export interface DailyExpensesResponse {
  expenses: DailyExpense[];
  total: number;
}

export const ADMISSION_STATUSES = ['admitted', 'discharged'] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export interface Admission {
  id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  admit_date: string;
  discharge_date?: string;
  status: string;
  ward: string;
  room_or_bed?: string;
  diagnosis?: string;
  notes?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
  patient_name?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
}

export interface AdmissionCreate {
  patient_id: string;
  doctor_id: string;
  admit_date: string;
  discharge_date?: string;
  status?: string;
  ward: string;
  room_or_bed?: string;
  diagnosis?: string;
  notes?: string;
}

export interface AdmissionUpdate {
  doctor_id?: string;
  discharge_date?: string;
  status?: string;
  ward?: string;
  room_or_bed?: string;
  diagnosis?: string;
  notes?: string;
  is_active?: boolean;
}

export interface AdmissionsResponse {
  admissions: Admission[];
  total: number;
}

export interface AdmissionInvoiceSummary {
  id: string;
  invoice_number: string;
  order_number?: string;
  customer_name: string;
  total: number;
  total_paid: number;
  balance: number;
  status: string;
}

export interface AdmissionInvoicesResponse {
  invoices: AdmissionInvoiceSummary[];
  total: number;
}
