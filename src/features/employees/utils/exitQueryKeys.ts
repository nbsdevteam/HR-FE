import { EMPLOYEE_LIFECYCLE_KEY, MY_TASKS_KEY } from "@/shared/hooks";

/**
 * Every End of Service write can move the process, the profile's lifecycle
 * summary and what is waiting in My tasks, so each one refreshes all of them
 * instead of patching any locally.
 */
export const EXIT_QUERY_KEYS = ["exitProcesses", "exitChecklist", EMPLOYEE_LIFECYCLE_KEY, MY_TASKS_KEY];

/** Completion archives the employee and updates their contract server-side, so those refetch too. */
export const EXIT_COMPLETION_QUERY_KEYS = [...EXIT_QUERY_KEYS, "employees", "contracts"];
