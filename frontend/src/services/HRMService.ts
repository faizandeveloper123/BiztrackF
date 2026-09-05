import { ApiService } from "./ApiService";
import {
  Employee,
  EmployeeCreate,
  EmployeeUpdate,
  HRMEmployeesResponse,
  JobPosting,
  JobPostingCreate,
  JobPostingUpdate,
  HRMJobPostingsResponse,
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  HRMApplicationsResponse,
  PerformanceReview,
  PerformanceReviewCreate,
  PerformanceReviewUpdate,
  HRMReviewsResponse,
  TimeEntry,
  TimeEntryCreate,
  TimeEntryUpdate,
  HRMTimeEntriesResponse,
  LeaveRequest,
  LeaveRequestCreate,
  LeaveRequestUpdate,
  HRMLeaveRequestsResponse,
  Payroll,
  PayrollCreate,
  PayrollUpdate,
  HRMPayrollResponse,
  Benefits,
  BenefitsCreate,
  BenefitsUpdate,
  HRMBenefitsResponse,
  Training,
  TrainingCreate,
  TrainingUpdate,
  HRMTrainingResponse,
  TrainingEnrollment,
  TrainingEnrollmentCreate,
  TrainingEnrollmentUpdate,
  HRMEnrollmentsResponse,
  HRMDashboard,
  HRMEmployeeFilters,
  HRMJobFilters,
  HRMApplicationFilters,
  HRMReviewFilters,
  HRMTimeFilters,
  HRMLeaveFilters,
  HRMPayrollFilters,
  HRMTrainingFilters,
  SupplierCreate,
  SupplierUpdate,
  SupplierResponse,
  SuppliersResponse,
} from "../models/hrm";

export class HRMService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  // Employee methods
  async getEmployees(
    filters?: HRMEmployeeFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMEmployeesResponse> {
    const params = new URLSearchParams();
    if (filters?.department) params.append("department", filters.department);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.employeeType)
      params.append("employee_type", filters.employeeType);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/employees?${params.toString()}`);
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.apiService.get(`/hrm/employees/${id}`);
  }

  async createEmployee(employee: EmployeeCreate): Promise<Employee> {
    return this.apiService.post("/hrm/employees", employee);
  }

  async updateEmployee(
    id: string,
    employee: EmployeeUpdate,
  ): Promise<Employee> {
    return this.apiService.put(`/hrm/employees/${id}`, employee);
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/employees/${id}`);
  }

  // Job Posting methods
  async getJobPostings(
    filters?: HRMJobFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMJobPostingsResponse> {
    const params = new URLSearchParams();
    if (filters?.department) params.append("department", filters.department);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/jobs?${params.toString()}`);
  }

  async getJobPosting(id: string): Promise<JobPosting> {
    return this.apiService.get(`/hrm/jobs/${id}`);
  }

  async createJobPosting(job: JobPostingCreate): Promise<JobPosting> {
    return this.apiService.post("/hrm/jobs", job);
  }

  async updateJobPosting(
    id: string,
    job: JobPostingUpdate,
  ): Promise<JobPosting> {
    return this.apiService.put(`/hrm/jobs/${id}`, job);
  }

  async deleteJobPosting(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/jobs/${id}`);
  }

  // Application methods
  async getApplications(
    filters?: HRMApplicationFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMApplicationsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.jobPostingId)
      params.append("job_posting_id", filters.jobPostingId);
    if (filters?.assignedTo) params.append("assigned_to", filters.assignedTo);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/applications?${params.toString()}`);
  }

  async getApplication(id: string): Promise<Application> {
    return this.apiService.get(`/hrm/applications/${id}`);
  }

  async createApplication(
    application: ApplicationCreate,
  ): Promise<Application> {
    return this.apiService.post("/hrm/applications", application);
  }

  async updateApplication(
    id: string,
    application: ApplicationUpdate,
  ): Promise<Application> {
    return this.apiService.put(`/hrm/applications/${id}`, application);
  }

  async deleteApplication(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/applications/${id}`);
  }

  // Performance Review methods
  async getPerformanceReviews(
    filters?: HRMReviewFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMReviewsResponse> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employee_id", filters.employeeId);
    if (filters?.reviewType) params.append("review_type", filters.reviewType);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.reviewPeriod)
      params.append("review_period", filters.reviewPeriod);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/reviews?${params.toString()}`);
  }

  async getPerformanceReview(id: string): Promise<PerformanceReview> {
    return this.apiService.get(`/hrm/reviews/${id}`);
  }

  async createPerformanceReview(
    review: PerformanceReviewCreate,
  ): Promise<PerformanceReview> {
    return this.apiService.post("/hrm/reviews", review);
  }

  async updatePerformanceReview(
    id: string,
    review: PerformanceReviewUpdate,
  ): Promise<PerformanceReview> {
    return this.apiService.put(`/hrm/reviews/${id}`, review);
  }

  async deletePerformanceReview(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/reviews/${id}`);
  }

  // Time Entry methods
  async getTimeEntries(
    filters?: HRMTimeFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMTimeEntriesResponse> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employee_id", filters.employeeId);
    if (filters?.startDate) params.append("start_date", filters.startDate);
    if (filters?.endDate) params.append("end_date", filters.endDate);
    if (filters?.projectId) params.append("project_id", filters.projectId);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/time-entries?${params.toString()}`);
  }

  async getTimeEntry(id: string): Promise<TimeEntry> {
    return this.apiService.get(`/hrm/time-entries/${id}`);
  }

  async createTimeEntry(timeEntry: TimeEntryCreate): Promise<TimeEntry> {
    return this.apiService.post("/hrm/time-entries", timeEntry);
  }

  async updateTimeEntry(
    id: string,
    timeEntry: TimeEntryUpdate,
  ): Promise<TimeEntry> {
    return this.apiService.put(`/hrm/time-entries/${id}`, timeEntry);
  }

  async deleteTimeEntry(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/time-entries/${id}`);
  }

  // Leave Request methods
  async getLeaveRequests(
    filters?: HRMLeaveFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMLeaveRequestsResponse> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employee_id", filters.employeeId);
    if (filters?.leaveType) params.append("leave_type", filters.leaveType);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("start_date", filters.startDate);
    if (filters?.endDate) params.append("end_date", filters.endDate);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/leave-requests?${params.toString()}`);
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest> {
    return this.apiService.get(`/hrm/leave-requests/${id}`);
  }

  async createLeaveRequest(
    leaveRequest: LeaveRequestCreate,
  ): Promise<LeaveRequest> {
    return this.apiService.post("/hrm/leave-requests", leaveRequest);
  }

  async updateLeaveRequest(
    id: string,
    leaveRequest: LeaveRequestUpdate,
  ): Promise<LeaveRequest> {
    return this.apiService.put(`/hrm/leave-requests/${id}`, leaveRequest);
  }

  async deleteLeaveRequest(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/leave-requests/${id}`);
  }

  // Payroll methods
  async getPayroll(
    filters?: HRMPayrollFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMPayrollResponse> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employee_id", filters.employeeId);
    if (filters?.payPeriod) params.append("pay_period", filters.payPeriod);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("start_date", filters.startDate);
    if (filters?.endDate) params.append("end_date", filters.endDate);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/payroll?${params.toString()}`);
  }

  async getPayrollRecord(id: string): Promise<Payroll> {
    return this.apiService.get(`/hrm/payroll/${id}`);
  }

  async createPayroll(payroll: PayrollCreate): Promise<Payroll> {
    return this.apiService.post("/hrm/payroll", payroll);
  }

  async updatePayroll(id: string, payroll: PayrollUpdate): Promise<Payroll> {
    return this.apiService.put(`/hrm/payroll/${id}`, payroll);
  }

  async deletePayroll(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/payroll/${id}`);
  }

  // Benefits methods
  async getBenefits(
    filters?: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMBenefitsResponse> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append("employee_id", filters.employeeId);
    if (filters?.benefitType)
      params.append("benefit_type", filters.benefitType);
    if (filters?.status) params.append("status", filters.status);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/benefits?${params.toString()}`);
  }

  async getBenefit(id: string): Promise<Benefits> {
    return this.apiService.get(`/hrm/benefits/${id}`);
  }

  async createBenefit(benefit: BenefitsCreate): Promise<Benefits> {
    return this.apiService.post("/hrm/benefits", benefit);
  }

  async updateBenefit(id: string, benefit: BenefitsUpdate): Promise<Benefits> {
    return this.apiService.put(`/hrm/benefits/${id}`, benefit);
  }

  async deleteBenefit(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/benefits/${id}`);
  }

  // Training methods
  async getTraining(
    filters?: HRMTrainingFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMTrainingResponse> {
    const params = new URLSearchParams();
    if (filters?.trainingType)
      params.append("training_type", filters.trainingType);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.provider) params.append("provider", filters.provider);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(`/hrm/training?${params.toString()}`);
  }

  async getTrainingProgram(id: string): Promise<Training> {
    return this.apiService.get(`/hrm/training/${id}`);
  }

  async createTraining(training: TrainingCreate): Promise<Training> {
    return this.apiService.post("/hrm/training", training);
  }

  async updateTraining(
    id: string,
    training: TrainingUpdate,
  ): Promise<Training> {
    return this.apiService.put(`/hrm/training/${id}`, training);
  }

  async deleteTraining(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/training/${id}`);
  }

  // Training Enrollment methods
  async getTrainingEnrollments(
    filters?: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<HRMEnrollmentsResponse> {
    const params = new URLSearchParams();
    if (filters?.trainingId) params.append("training_id", filters.trainingId);
    if (filters?.employeeId) params.append("employee_id", filters.employeeId);
    if (filters?.status) params.append("status", filters.status);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.apiService.get(
      `/hrm/training-enrollments?${params.toString()}`,
    );
  }

  async getTrainingEnrollment(id: string): Promise<TrainingEnrollment> {
    return this.apiService.get(`/hrm/training-enrollments/${id}`);
  }

  async createTrainingEnrollment(
    enrollment: TrainingEnrollmentCreate,
  ): Promise<TrainingEnrollment> {
    return this.apiService.post("/hrm/training-enrollments", enrollment);
  }

  async updateTrainingEnrollment(
    id: string,
    enrollment: TrainingEnrollmentUpdate,
  ): Promise<TrainingEnrollment> {
    return this.apiService.put(`/hrm/training-enrollments/${id}`, enrollment);
  }

  async deleteTrainingEnrollment(id: string): Promise<void> {
    return this.apiService.delete(`/hrm/training-enrollments/${id}`);
  }

  // Dashboard method
  async getDashboard(): Promise<HRMDashboard> {
    return this.apiService.get("/hrm/dashboard");
  }

  // Utility Methods
  getEmploymentStatusColor(status: string): string {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "terminated":
        return "bg-red-100 text-red-800";
      case "resigned":
        return "bg-orange-100 text-orange-800";
      case "retired":
        return "bg-blue-100 text-blue-800";
      case "probation":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getEmployeeTypeColor(type: string): string {
    switch (type) {
      case "full_time":
        return "bg-blue-100 text-blue-800";
      case "part_time":
        return "bg-purple-100 text-purple-800";
      case "contractor":
        return "bg-orange-100 text-orange-800";
      case "intern":
        return "bg-green-100 text-green-800";
      case "freelancer":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getJobStatusColor(status: string): string {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "published":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-red-100 text-red-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getApplicationStatusColor(status: string): string {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "screening":
        return "bg-yellow-100 text-yellow-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
      case "technical_test":
        return "bg-indigo-100 text-indigo-800";
      case "reference_check":
        return "bg-pink-100 text-pink-800";
      case "offer":
        return "bg-green-100 text-green-800";
      case "hired":
        return "bg-emerald-100 text-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getLeaveStatusColor(status: string): string {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getPayrollStatusColor(status: string): string {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "processed":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getTrainingStatusColor(status: string): string {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getDepartmentIcon(department: string): string {
    switch (department) {
      case "engineering":
        return "🔧";
      case "sales":
        return "💰";
      case "marketing":
        return "📢";
      case "hr":
        return "👥";
      case "finance":
        return "💳";
      case "operations":
        return "⚙️";
      case "customer_support":
        return "🎧";
      case "legal":
        return "⚖️";
      case "it":
        return "💻";
      default:
        return "🏢";
    }
  }

  // Supplier Management
  async getSuppliers(
    skip: number = 0,
    limit: number = 100,
  ): Promise<SuppliersResponse> {
    const response = await this.apiService.get(
      `/hrm/suppliers?skip=${skip}&limit=${limit}`,
    );
    return response;
  }

  async getSupplier(id: string): Promise<SupplierResponse> {
    const response = await this.apiService.get(`/hrm/suppliers/${id}`);
    return response;
  }

  async createSupplier(supplier: SupplierCreate): Promise<SupplierResponse> {
    const response = await this.apiService.post("/hrm/suppliers", supplier);
    return response;
  }

  async updateSupplier(
    id: string,
    supplier: SupplierUpdate,
  ): Promise<SupplierResponse> {
    const response = await this.apiService.put(
      `/hrm/suppliers/${id}`,
      supplier,
    );
    return response;
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.apiService.delete(`/hrm/suppliers/${id}`);
  }
}

export default new HRMService();
