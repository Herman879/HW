export type OnboardingStatus =
  | 'request_received'
  | 'processing'
  | 'awaiting_hr_approval'
  | 'invitation_pending'
  | 'invitation_sent'
  | 'activated'
  | 'failed';

export type InvitationStatus = 'not_created' | 'pending' | 'sent' | 'expired' | 'used' | 'failed';
export type UserRole = 'hr' | 'employee';

export interface OnboardingSummary {
  team_lead?: string | null;
  required_accounts?: string[];
  department_description?: string | null;
  welcome_message?: string | null;
}

export interface NewEmployeeRequest {
  first_name: string;
  last_name: string;
  personal_email: string;
  department: string;
  role: string;
  start_date: string;
}

export interface OnboardingCreated {
  employee_id: string;
  status: OnboardingStatus;
  onboarding_summary?: OnboardingSummary | null;
}

export interface Employee extends NewEmployeeRequest {
  id: string;
  status: OnboardingStatus;
  invitation_status: InvitationStatus;
  onboarding_summary?: OnboardingSummary | null;
  created_at?: string;
  approved_at?: string | null;
  invitation_sent_at?: string | null;
}

export interface EmployeeListResponse { employees: Employee[] }
export interface EmployeeResponse { employee: Employee }

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  roles: UserRole[];
}
export interface AuthMeResponse { user: AuthUser }
export interface LoginRequest { username: string; password: string }

export type InvitationState = 'valid' | 'expired' | 'used' | 'invalid';
export interface InvitationValidation {
  state: InvitationState;
  employee?: { first_name: string; last_name: string };
  expires_at?: string;
}
export interface ActivationRequest { token: string; username: string; password: string }
export interface ActivationResponse { activated: true }

export interface ApiErrorBody {
  error?: { code?: string; message?: string; field_errors?: Record<string, string> } | string;
  message?: string;
}
