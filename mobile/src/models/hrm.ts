// HRM Enums
export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
  RESIGNED = 'resigned',
  RETIRED = 'retired',
  PROBATION = 'probation',
}

export enum EmployeeType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACTOR = 'contractor',
  INTERN = 'intern',
  FREELANCER = 'freelancer',
}

export enum Department {
  ENGINEERING = 'engineering',
  SALES = 'sales',
  MARKETING = 'marketing',
  HR = 'hr',
  FINANCE = 'finance',
  OPERATIONS = 'operations',
  CUSTOMER_SUPPORT = 'customer_support',
  LEGAL = 'legal',
  IT = 'it',
  GENERAL = 'general',
  OTHER = 'other',
}

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ON_HOLD = 'on_hold',
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  TECHNICAL_TEST = 'technical_test',
  REFERENCE_CHECK = 'reference_check',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum ReviewType {
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly',
  PROJECT_BASED = 'project_based',
  PROBATION = 'probation',
}

export enum ReviewStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
}

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  PERSONAL = 'personal',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  BEREAVEMENT = 'bereavement',
  UNPAID = 'unpaid',
  OTHER = 'other',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSED = 'processed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum TrainingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum TrainingType {
  ONBOARDING = 'onboarding',
  SKILL_DEVELOPMENT = 'skill_development',
  COMPLIANCE = 'compliance',
  LEADERSHIP = 'leadership',
  TECHNICAL = 'technical',
  SOFT_SKILLS = 'soft_skills',
  CERTIFICATION = 'certification',
}

// HRM Models
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  hireDate: string;
  employeeId: string;
  department: Department;
  position: string;
  employeeType: EmployeeType;
  employmentStatus: EmploymentStatus;
  managerId?: string;
  salary?: number;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  skills: string[];
  certifications: string[];
  notes?: string;
  resume_url?: string;
  attachments?: string[];
  avatar?: string | null;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCreate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  hireDate: string;
  employeeId: string;
  department: Department;
  position: string;
  employeeType: EmployeeType;
  employmentStatus: EmploymentStatus;
  managerId?: string;
  salary?: number;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  skills?: string[];
  certifications?: string[];
  notes?: string;
  resume_url?: string;
  attachments?: string[];
}

export interface EmployeeUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  hireDate?: string;
  employeeId?: string;
  department?: Department;
  position?: string;
  employeeType?: EmployeeType;
  employmentStatus?: EmploymentStatus;
  managerId?: string;
  salary?: number;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  skills?: string[];
  certifications?: string[];
  notes?: string;
  resume_url?: string;
  attachments?: string[];
}

export interface JobPosting {
  id: string;
  title: string;
  department: Department;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location: string;
  type: EmployeeType;
  salaryRange?: string;
  benefits: string[];
  status: JobStatus;
  openDate: string;
  closeDate?: string;
  hiringManagerId?: string;
  tags: string[];
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPostingCreate {
  title: string;
  department: Department;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  location: string;
  type: EmployeeType;
  salaryRange?: string;
  benefits?: string[];
  status: JobStatus;
  openDate: string;
  closeDate?: string;
  hiringManagerId?: string;
  tags?: string[];
}

export interface JobPostingUpdate {
  title?: string;
  department?: Department;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  location?: string;
  type?: EmployeeType;
  salaryRange?: string;
  benefits?: string[];
  status?: JobStatus;
  openDate?: string;
  closeDate?: string;
  hiringManagerId?: string;
  tags?: string[];
}

export interface Application {
  id: string;
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  experience?: string;
  education?: string;
  skills: string[];
  status: ApplicationStatus;
  assignedTo?: string;
  notes?: string;
  interviewDate?: string;
  interviewNotes?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationCreate {
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  status: ApplicationStatus;
  assignedTo?: string;
  notes?: string;
  interviewDate?: string;
  interviewNotes?: string;
}

export interface ApplicationUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  status?: ApplicationStatus;
  assignedTo?: string;
  notes?: string;
  interviewDate?: string;
  interviewNotes?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  reviewType: ReviewType;
  reviewPeriod: string;
  reviewDate: string;
  status: ReviewStatus;
  goals: string[];
  achievements: string[];
  areasOfImprovement: string[];
  overallRating?: number;
  technicalRating?: number;
  communicationRating?: number;
  teamworkRating?: number;
  leadershipRating?: number;
  comments?: string;
  nextReviewDate?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReviewCreate {
  employeeId: string;
  reviewerId: string;
  reviewType: ReviewType;
  reviewPeriod: string;
  reviewDate: string;
  status: ReviewStatus;
  goals?: string[];
  achievements?: string[];
  areasOfImprovement?: string[];
  overallRating?: number;
  technicalRating?: number;
  communicationRating?: number;
  teamworkRating?: number;
  leadershipRating?: number;
  comments?: string;
  nextReviewDate?: string;
}

export interface PerformanceReviewUpdate {
  reviewerId?: string;
  reviewType?: ReviewType;
  reviewPeriod?: string;
  reviewDate?: string;
  status?: ReviewStatus;
  goals?: string[];
  achievements?: string[];
  areasOfImprovement?: string[];
  overallRating?: number;
  technicalRating?: number;
  communicationRating?: number;
  teamworkRating?: number;
  leadershipRating?: number;
  comments?: string;
  nextReviewDate?: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  projectId?: string;
  taskId?: string;
  notes?: string;
  status: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryCreate {
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  projectId?: string;
  taskId?: string;
  notes?: string;
  status?: string;
}

export interface TimeEntryUpdate {
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  projectId?: string;
  taskId?: string;
  notes?: string;
  status?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestCreate {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface LeaveRequestUpdate {
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  reason?: string;
  status?: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  payPeriod: string;
  startDate: string;
  endDate: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtimePay: number;
  bonus: number;
  netPay: number;
  status: PayrollStatus;
  paymentDate?: string;
  notes?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollCreate {
  employeeId: string;
  payPeriod: string;
  startDate: string;
  endDate: string;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  overtimePay?: number;
  bonus?: number;
  netPay: number;
  status: PayrollStatus;
  paymentDate?: string;
  notes?: string;
}

export interface PayrollUpdate {
  payPeriod?: string;
  startDate?: string;
  endDate?: string;
  basicSalary?: number;
  allowances?: number;
  deductions?: number;
  overtimePay?: number;
  bonus?: number;
  netPay?: number;
  status?: PayrollStatus;
  paymentDate?: string;
  notes?: string;
}

export interface Benefits {
  id: string;
  employeeId: string;
  benefitType: string;
  provider: string;
  policyNumber?: string;
  startDate: string;
  endDate?: string;
  monthlyCost: number;
  employeeContribution: number;
  employerContribution: number;
  status: string;
  notes?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BenefitsCreate {
  employeeId: string;
  benefitType: string;
  provider: string;
  policyNumber?: string;
  startDate: string;
  endDate?: string;
  monthlyCost: number;
  employeeContribution: number;
  employerContribution: number;
  status?: string;
  notes?: string;
}

export interface BenefitsUpdate {
  benefitType?: string;
  provider?: string;
  policyNumber?: string;
  startDate?: string;
  endDate?: string;
  monthlyCost?: number;
  employeeContribution?: number;
  employerContribution?: number;
  status?: string;
  notes?: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  trainingType: TrainingType;
  duration: string;
  cost: number;
  provider: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  status: TrainingStatus;
  materials: string[];
  objectives: string[];
  prerequisites: string[];
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCreate {
  title: string;
  description: string;
  trainingType: TrainingType;
  duration: string;
  cost: number;
  provider: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  status: TrainingStatus;
  materials?: string[];
  objectives?: string[];
  prerequisites?: string[];
}

export interface TrainingUpdate {
  title?: string;
  description?: string;
  trainingType?: TrainingType;
  duration?: string;
  cost?: number;
  provider?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  status?: TrainingStatus;
  materials?: string[];
  objectives?: string[];
  prerequisites?: string[];
}

export interface TrainingEnrollment {
  id: string;
  trainingId: string;
  employeeId: string;
  enrollmentDate: string;
  completionDate?: string;
  status: TrainingStatus;
  score?: number;
  certificate?: string;
  feedback?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingEnrollmentCreate {
  trainingId: string;
  employeeId: string;
  enrollmentDate: string;
  completionDate?: string;
  status: TrainingStatus;
  score?: number;
  certificate?: string;
  feedback?: string;
}

export interface TrainingEnrollmentUpdate {
  completionDate?: string;
  status?: TrainingStatus;
  score?: number;
  certificate?: string;
  feedback?: string;
}

// HRM Response Models
export interface HRMEmployeesResponse {
  employees: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMJobPostingsResponse {
  jobPostings: JobPosting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMApplicationsResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMReviewsResponse {
  reviews: PerformanceReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMTimeEntriesResponse {
  timeEntries: TimeEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMLeaveRequestsResponse {
  leaveRequests: LeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMPayrollResponse {
  payroll: Payroll[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMBenefitsResponse {
  benefits: Benefits[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMTrainingResponse {
  training: Training[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HRMEnrollmentsResponse {
  enrollments: TrainingEnrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// HRM Dashboard Models
export interface HRMMetrics {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  turnoverRate: number;
  averageSalary: number;
  openPositions: number;
  pendingApplications: number;
  upcomingReviews: number;
  pendingLeaveRequests: number;
  trainingCompletionRate: number;
}

export interface HRMDashboard {
  metrics: HRMMetrics;
  recentHires: Employee[];
  upcomingReviews: PerformanceReview[];
  pendingLeaveRequests: LeaveRequest[];
  openJobPostings: JobPosting[];
  recentApplications: Application[];
  departmentDistribution: Record<string, number>;
  trainingPrograms: Training[];
}

// HRM Filter Models
export interface HRMEmployeeFilters {
  department?: string;
  status?: string;
  employeeType?: string;
  search?: string;
}

export interface HRMJobFilters {
  department?: string;
  status?: string;
  type?: string;
  search?: string;
}

export interface HRMApplicationFilters {
  status?: string;
  jobPostingId?: string;
  assignedTo?: string;
  search?: string;
}

export interface HRMReviewFilters {
  employeeId?: string;
  reviewType?: string;
  status?: string;
  reviewPeriod?: string;
}

export interface HRMTimeFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

export interface HRMLeaveFilters {
  employeeId?: string;
  leaveType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface HRMPayrollFilters {
  employeeId?: string;
  payPeriod?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface HRMTrainingFilters {
  trainingType?: string;
  status?: string;
  provider?: string;
  search?: string;
}

// Supplier Models (moved from Inventory to HRM)
export interface Supplier {
  id: string;
  tenantId: string;
  createdBy: string;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCreate {
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive?: boolean;
}

export interface SupplierUpdate {
  name?: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive?: boolean;
}

export interface SupplierResponse {
  supplier: Supplier;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
}