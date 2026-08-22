export type PublicApplyForm = {
  job_opening_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  expected_salary: string;
  consent: boolean;
  hp: string;
};

export type viewType = "jobs" | "applicants" | "pipeline" | "bank" | "ai";
export type sortTypes = "rank" | "rating" | "date" | "name" | "job" | "stage";
