export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface CreateProgramForm {
  title: string;
  category: string;
  weight: string;
  instructor: string;
  duration: string;
  status: string;
  max_participants: string;
  start_date: string;
  end_date: string;
  objectives: string;
}

export interface EnrollParticipantForm {
  employee_id: string;
  completion_status: string;
  score: string;
}
