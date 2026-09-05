import { apiService } from '../ApiService';
import type {
  HRMDashboard,
  HRMEmployeesResponse,
  HRMJobPostingsResponse,
  HRMReviewsResponse,
  HRMLeaveRequestsResponse,
  HRMPayrollResponse,
  HRMTrainingResponse,
  Employee,
  JobPosting,
  PerformanceReview,
  LeaveRequest,
  LeaveRequestCreate,
  LeaveRequestUpdate,
  Payroll,
  Training,
  SupplierCreate,
  SupplierUpdate,
  SupplierResponse,
  SuppliersResponse,
  HRMEmployeeFilters,
  HRMJobFilters,
  HRMReviewFilters,
  HRMLeaveFilters,
  HRMPayrollFilters,
  HRMTrainingFilters,
  EmployeeCreate,
  EmployeeUpdate,
  JobPostingCreate,
  JobPostingUpdate,
  PerformanceReviewCreate,
  PerformanceReviewUpdate,
  PayrollCreate,
  PayrollUpdate,
  TrainingCreate,
  TrainingUpdate,
} from '../../models/hrm';

const clampPageLimit = (limit: number) => Math.min(Math.max(limit, 1), 100);

export async function getHrmDashboard(): Promise<HRMDashboard> {
  return apiService.get<HRMDashboard>('/hrm/dashboard');
}

export async function getEmployees(
  page = 1,
  limit = 100,
  filters?: HRMEmployeeFilters,
): Promise<HRMEmployeesResponse> {
  const safeLimit = clampPageLimit(limit);
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(safeLimit));
  if (filters?.department) p.append('department', filters.department);
  if (filters?.status) p.append('status', filters.status);
  if (filters?.employeeType) p.append('employee_type', filters.employeeType);
  if (filters?.search) p.append('search', filters.search);
  return apiService.get<HRMEmployeesResponse>(`/hrm/employees?${p.toString()}`);
}

export async function getEmployee(id: string): Promise<Employee> {
  return apiService.get<Employee>(`/hrm/employees/${id}`);
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiService.delete(`/hrm/employees/${id}`);
}

export async function createEmployee(data: EmployeeCreate): Promise<Employee> {
  return apiService.post<Employee>('/hrm/employees', data);
}

export async function updateEmployee(
  id: string,
  data: EmployeeUpdate,
): Promise<Employee> {
  return apiService.put<Employee>(`/hrm/employees/${id}`, data);
}

export async function getJobPostings(
  page = 1,
  limit = 100,
  filters?: HRMJobFilters,
): Promise<HRMJobPostingsResponse> {
  const safeLimit = clampPageLimit(limit);
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(safeLimit));
  if (filters?.department) p.append('department', filters.department);
  if (filters?.status) p.append('status', filters.status);
  if (filters?.type) p.append('job_type', filters.type);
  if (filters?.search) p.append('search', filters.search);
  return apiService.get<HRMJobPostingsResponse>(`/hrm/jobs?${p.toString()}`);
}

export async function getJobPosting(id: string): Promise<JobPosting> {
  return apiService.get<JobPosting>(`/hrm/jobs/${id}`);
}

export async function deleteJobPosting(id: string): Promise<void> {
  await apiService.delete(`/hrm/jobs/${id}`);
}

export async function createJobPosting(data: JobPostingCreate): Promise<JobPosting> {
  return apiService.post<JobPosting>('/hrm/jobs', data);
}

export async function updateJobPosting(
  id: string,
  data: JobPostingUpdate,
): Promise<JobPosting> {
  return apiService.put<JobPosting>(`/hrm/jobs/${id}`, data);
}

export async function getPerformanceReviews(
  page = 1,
  limit = 100,
  filters?: HRMReviewFilters,
): Promise<HRMReviewsResponse> {
  const safeLimit = clampPageLimit(limit);
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(safeLimit));
  if (filters?.employeeId) p.append('employee_id', filters.employeeId);
  if (filters?.reviewType) p.append('review_type', filters.reviewType);
  if (filters?.status) p.append('status', filters.status);
  if (filters?.reviewPeriod) p.append('review_period', filters.reviewPeriod);
  return apiService.get<HRMReviewsResponse>(`/hrm/reviews?${p.toString()}`);
}

export async function getPerformanceReview(
  id: string,
): Promise<PerformanceReview> {
  return apiService.get<PerformanceReview>(`/hrm/reviews/${id}`);
}

export async function deletePerformanceReview(id: string): Promise<void> {
  await apiService.delete(`/hrm/reviews/${id}`);
}

export async function createPerformanceReview(
  data: PerformanceReviewCreate,
): Promise<PerformanceReview> {
  return apiService.post<PerformanceReview>('/hrm/reviews', data);
}

export async function updatePerformanceReview(
  id: string,
  data: PerformanceReviewUpdate,
): Promise<PerformanceReview> {
  return apiService.put<PerformanceReview>(`/hrm/reviews/${id}`, data);
}

export async function getLeaveRequests(
  page = 1,
  limit = 100,
  filters?: HRMLeaveFilters,
): Promise<HRMLeaveRequestsResponse> {
  const safeLimit = clampPageLimit(limit);
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(safeLimit));
  if (filters?.employeeId) p.append('employee_id', filters.employeeId);
  if (filters?.leaveType) p.append('leave_type', filters.leaveType);
  if (filters?.status) p.append('status', filters.status);
  if (filters?.startDate) p.append('start_date', filters.startDate);
  if (filters?.endDate) p.append('end_date', filters.endDate);
  return apiService.get<HRMLeaveRequestsResponse>(
    `/hrm/leave-requests?${p.toString()}`,
  );
}

export async function createLeaveRequest(
  data: LeaveRequestCreate,
): Promise<LeaveRequest> {
  return apiService.post<LeaveRequest>('/hrm/leave-requests', data);
}

export async function updateLeaveRequest(
  id: string,
  data: LeaveRequestUpdate,
): Promise<LeaveRequest> {
  return apiService.put<LeaveRequest>(`/hrm/leave-requests/${id}`, data);
}

export async function deleteLeaveRequest(id: string): Promise<void> {
  await apiService.delete(`/hrm/leave-requests/${id}`);
}

export async function getPayrollRecords(
  page = 1,
  limit = 100,
  filters?: HRMPayrollFilters,
): Promise<HRMPayrollResponse> {
  const safeLimit = clampPageLimit(limit);
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(safeLimit));
  if (filters?.employeeId) p.append('employee_id', filters.employeeId);
  if (filters?.payPeriod) p.append('pay_period', filters.payPeriod);
  if (filters?.status) p.append('status', filters.status);
  if (filters?.startDate) p.append('start_date', filters.startDate);
  if (filters?.endDate) p.append('end_date', filters.endDate);
  return apiService.get<HRMPayrollResponse>(`/hrm/payroll?${p.toString()}`);
}

export async function getPayrollRecord(id: string): Promise<Payroll> {
  return apiService.get<Payroll>(`/hrm/payroll/${id}`);
}

export async function createPayrollRecord(data: PayrollCreate): Promise<Payroll> {
  return apiService.post<Payroll>('/hrm/payroll', data);
}

export async function updatePayrollRecord(
  id: string,
  data: PayrollUpdate,
): Promise<Payroll> {
  return apiService.put<Payroll>(`/hrm/payroll/${id}`, data);
}

export async function deletePayrollRecord(id: string): Promise<void> {
  await apiService.delete(`/hrm/payroll/${id}`);
}

export async function getTrainingPrograms(
  page = 1,
  limit = 100,
  filters?: HRMTrainingFilters,
): Promise<HRMTrainingResponse> {
  const safeLimit = clampPageLimit(limit);
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(safeLimit));
  if (filters?.trainingType) p.append('training_type', filters.trainingType);
  if (filters?.status) p.append('status', filters.status);
  if (filters?.provider) p.append('provider', filters.provider);
  if (filters?.search) p.append('search', filters.search);
  return apiService.get<HRMTrainingResponse>(`/hrm/training?${p.toString()}`);
}

export async function getTrainingProgram(id: string): Promise<Training> {
  return apiService.get<Training>(`/hrm/training/${id}`);
}

export async function createTrainingProgram(data: TrainingCreate): Promise<Training> {
  return apiService.post<Training>('/hrm/training', data);
}

export async function updateTrainingProgram(
  id: string,
  data: TrainingUpdate,
): Promise<Training> {
  return apiService.put<Training>(`/hrm/training/${id}`, data);
}

export async function deleteTrainingProgram(id: string): Promise<void> {
  await apiService.delete(`/hrm/training/${id}`);
}

export async function fetchSuppliers(
  skip = 0,
  limit = 200,
): Promise<SuppliersResponse> {
  return apiService.get<SuppliersResponse>(
    `/hrm/suppliers?skip=${skip}&limit=${limit}`,
  );
}

export async function createSupplier(
  data: SupplierCreate,
): Promise<SupplierResponse> {
  return apiService.post<SupplierResponse>('/hrm/suppliers', data);
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiService.delete(`/hrm/suppliers/${id}`);
}

export async function updateSupplier(
  id: string,
  data: SupplierUpdate,
): Promise<SupplierResponse> {
  return apiService.put<SupplierResponse>(`/hrm/suppliers/${id}`, data);
}
