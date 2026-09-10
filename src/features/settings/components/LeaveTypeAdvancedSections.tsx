import { motion } from "motion/react";
import { EXPAND_MOTION } from "../constants/settings";
import type { NewLeaveTypeForm } from "../types";
import type { LeaveTypeFormErrors } from "../hooks/useLeaveTypeFormValidation";
import LeaveTypeRulesFields from "./LeaveTypeRulesFields";
import LeaveTypeCarryoverFields from "./LeaveTypeCarryoverFields";

type TLeaveTypeAdvancedSectionsProps = {
  form: NewLeaveTypeForm;
  errors: LeaveTypeFormErrors;
  onFieldChange: (patch: Partial<NewLeaveTypeForm>) => void;
};

/**
 * The labeled Advanced sections, shown behind the "Advanced options"
 * disclosure. Same height-animate as the rest of this panel (`EXPAND_MOTION`)
 * — there's no Accordion/Collapsible primitive in this codebase yet, and
 * building one is more than this form needs.
 */
const LeaveTypeAdvancedSections = ({ form, errors, onFieldChange }: TLeaveTypeAdvancedSectionsProps) => (
  <motion.div {...EXPAND_MOTION} className="space-y-3 overflow-hidden">
    <LeaveTypeRulesFields form={form} errors={errors} onFieldChange={onFieldChange} />
    <LeaveTypeCarryoverFields form={form} errors={errors} onFieldChange={onFieldChange} />
  </motion.div>
);

export default LeaveTypeAdvancedSections;
