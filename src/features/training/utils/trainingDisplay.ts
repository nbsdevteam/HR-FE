import { empDisplayName, type DbEmployee, type DbTrainingParticipant, type DbTrainingProgram } from "@/shared/hooks";
import { ODOO_TO_PARTICIPANT_STATUS, ODOO_TO_TRAINING_STATUS } from "../constants/training";

export const mapProgramsToDisplay = (programs: DbTrainingProgram[]): DbTrainingProgram[] => (
  programs.map((p) => ({ ...p, status: ODOO_TO_TRAINING_STATUS[p.status] || p.status }))
);

export const mapParticipantsToDisplay = (participants: DbTrainingParticipant[]): DbTrainingParticipant[] => (
  participants.map((p) => ({
    ...p,
    completion_status: ODOO_TO_PARTICIPANT_STATUS[p.completion_status] || p.completion_status,
  }))
);

export const filterPrograms = (
  programs: DbTrainingProgram[],
  filter: string,
  searchTerm: string,
  allLabel: string,
): DbTrainingProgram[] => {
  let result = programs;
  if (filter !== allLabel) {
    result = result.filter((p) => p.category === filter);
  }
  if (searchTerm) {
    result = result.filter((p) => p.title.includes(searchTerm));
  }
  return result;
};

export const getProgramParticipants = (
  participants: DbTrainingParticipant[],
  programId: string,
): DbTrainingParticipant[] => participants.filter((p) => p.training_program_id === programId);

export const getEmployeeName = (employees: DbEmployee[], employeeId: string): string => {
  const emp = employees.find((e) => e.id === employeeId);
  return emp ? empDisplayName(emp) : employeeId;
};
