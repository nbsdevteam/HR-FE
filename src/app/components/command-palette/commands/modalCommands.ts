import { Plus, UserPlus, Building2, Briefcase } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { ROUTE_SEGMENT } from "@/app/router/routePaths";
import type { OpenModalCommand } from "./types";

/**
 * One "open-modal" command per creation flow that lives on a page other than
 * wherever the palette is invoked from — see CommandIntentContext for how the
 * target page picks these up after CommandPalette navigates it into view.
 */
export const modalCommands: OpenModalCommand[] = [
  {
    id: "modal.employee.add",
    kind: "open-modal",
    group: "create",
    label: arabicSource("common.add_an_employee"),
    icon: Plus,
    routeKeys: ["hr.employees"],
    modalId: "employee.add",
    navigateTo: `/${ROUTE_SEGMENT.employees}`,
  },
  {
    id: "modal.warning.add",
    kind: "open-modal",
    group: "create",
    label: arabicSource("warnings.issue_an_alarm"),
    icon: Plus,
    routeKeys: ["hr.warnings"],
    modalId: "warning.add",
    navigateTo: `/${ROUTE_SEGMENT.warnings}`,
  },
  {
    id: "modal.training.addProgram",
    kind: "open-modal",
    group: "create",
    label: arabicSource("training.new_program"),
    icon: Plus,
    routeKeys: ["hr.training"],
    modalId: "training.addProgram",
    navigateTo: `/${ROUTE_SEGMENT.training}`,
  },
  {
    id: "modal.leave.request",
    kind: "open-modal",
    group: "create",
    label: arabicSource("leave.leave_request"),
    icon: Plus,
    routeKeys: ["hr.leave"],
    modalId: "leave.request",
    navigateTo: `/${ROUTE_SEGMENT.leave}`,
  },
  {
    id: "modal.leave.permission",
    kind: "open-modal",
    group: "create",
    label: arabicSource("leave.asking_for_permission"),
    icon: Plus,
    routeKeys: ["hr.leave"],
    modalId: "leave.permission",
    navigateTo: `/${ROUTE_SEGMENT.leave}`,
  },
  {
    id: "modal.recruitment.addJob",
    kind: "open-modal",
    group: "create",
    label: arabicSource("common.new_vacancy"),
    icon: Plus,
    routeKeys: ["hr.recruitment"],
    modalId: "recruitment.addJob",
    navigateTo: `/${ROUTE_SEGMENT.recruitment}`,
  },
  {
    id: "modal.recruitment.addApplicant",
    kind: "open-modal",
    group: "create",
    label: arabicSource("recruitment.add_advanced_2"),
    icon: UserPlus,
    routeKeys: ["hr.recruitment"],
    modalId: "recruitment.addApplicant",
    navigateTo: `/${ROUTE_SEGMENT.recruitment}`,
  },
  {
    id: "modal.policy.create",
    kind: "open-modal",
    group: "create",
    label: arabicSource("policies.add_policy"),
    icon: Plus,
    routeKeys: ["hr.policies"],
    modalId: "policy.create",
    navigateTo: `/${ROUTE_SEGMENT.policies}`,
  },
  {
    id: "modal.hierarchy.addDepartment",
    kind: "open-modal",
    group: "create",
    label: arabicSource("hierarchy.add_a_new_section"),
    icon: Building2,
    routeKeys: ["hr.departments", "hr.org"],
    modalId: "hierarchy.addDepartment",
    navigateTo: `/${ROUTE_SEGMENT.hierarchy}`,
  },
  {
    id: "modal.hierarchy.addPosition",
    kind: "open-modal",
    group: "create",
    label: arabicSource("hierarchy.new_position"),
    icon: Briefcase,
    routeKeys: ["hr.departments", "hr.org"],
    modalId: "hierarchy.addPosition",
    navigateTo: `/${ROUTE_SEGMENT.hierarchy}`,
  },
];
