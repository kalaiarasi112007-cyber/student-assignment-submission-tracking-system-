export type Role = 'student' | 'faculty';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  department?: string;
  year_class?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Assessment {
  id: number;
  faculty_id: number;
  faculty_name?: string;
  faculty_email?: string;
  title: string;
  description: string;
  subject: string;
  deadline: string;
  attachment_path?: string | null;
  assigned_count?: number;
  submitted_count?: number;
  status?: 'Pending' | 'Submitted' | 'Late';
  submitted_at?: string | null;
  submitted_file_name?: string | null;
  submitted_file_path?: string | null;
  created_at?: string;
}

export interface Submission {
  id?: number;
  submission_id?: number;
  assessment_id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  student_department?: string;
  student_class?: string;
  file_name: string;
  file_path: string;
  submitted_at: string;
  status: 'Pending' | 'Submitted' | 'Late';
  assessment_title?: string;
  assessment_subject?: string;
  subject?: string;
  deadline?: string;
  faculty_name?: string;
}

export interface DashboardSummary {
  totalAssessments: number;
  totalStudents?: number;
  totalSubmissions?: number;
  pendingSubmissions?: number;
  pending?: number;
  submitted?: number;
  late?: number;
}
