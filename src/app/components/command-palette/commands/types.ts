import type { ComponentType } from "react";

export type CommandGroupId = "pages" | "create" | "actions";

interface BaseCommand {
  id: string;
  group: CommandGroupId;
  label: string;
  keywords?: string[];
  icon: ComponentType<{ className?: string }>;
  routeKeys: string[];
}

export interface NavigateCommand extends BaseCommand {
  kind: "navigate";
  to: string;
}

export type ModalIntentId =
  | "employee.add"
  | "warning.add"
  | "training.addProgram"
  | "leave.request"
  | "leave.permission"
  | "recruitment.addJob"
  | "recruitment.addApplicant"
  | "policy.create"
  | "hierarchy.addDepartment"
  | "hierarchy.addPosition";

export interface OpenModalCommand extends BaseCommand {
  kind: "open-modal";
  modalId: ModalIntentId;
  permissionPath?: string;
  navigateTo?: string;
}

export interface RunActionCommand extends BaseCommand {
  kind: "run-action";
  run: () => void;
}

export type CommandDefinition = NavigateCommand | OpenModalCommand | RunActionCommand;
