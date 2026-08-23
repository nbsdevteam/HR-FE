import { empDisplayName, type DbEmployee, type DbTrainingParticipant, type DbTrainingProgram } from "@/shared/hooks";
import { indexBy } from "@/shared/utils/collections";
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

/**
 * Build the employee-name lookup once per employee list instead of rescanning
 * the whole array for every participant row (was O(rows x employees)).
 */
export const buildEmployeeNameLookup = (
  employees: DbEmployee[],
): ((employeeId: string) => string) => {
  const byId = indexBy(employees, (e) => e.id);
  return (employeeId: string): string => {
    const emp = byId.get(employeeId);
    return emp ? empDisplayName(emp) : employeeId;
  };
};
