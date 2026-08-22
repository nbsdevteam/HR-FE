import { motion } from "motion/react";
import {
  Mail, Phone, MapPin, Building, Wallet, CalendarCheck, CalendarX,
  Hash, Briefcase, PhoneCall, Smartphone, FileText, ClipboardList, Users, Check, X,
} from "lucide-react";
import { formatCurrency } from "@/features/payroll/services/payslip-engine";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { Employee, EmployeeOption } from "../types";
import EmployeeFieldRow from "./EmployeeFieldRow";

const inputClass = "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";

type EmployeeInfoTabProps = {
  editData: Employee;
  isEditing: boolean;
  allDepts: string[];
  allEmployees: EmployeeOption[];
  addingNewDept: boolean;
  newDeptName: string;
  onFieldChange: (field: keyof Employee, value: string | number) => void;
  onManagerChange: (managerId: string | null) => void;
  onStartAddingDept: () => void;
  onNewDeptNameChange: (value: string) => void;
  onConfirmNewDept: () => void;
  onCancelNewDept: () => void;
};

const EmployeeInfoTab = ({
  editData,
  isEditing,
  allDepts,
  allEmployees,
  addingNewDept,
  newDeptName,
  onFieldChange,
  onManagerChange,
  onStartAddingDept,
  onNewDeptNameChange,
  onConfirmNewDept,
  onCancelNewDept,
}: EmployeeInfoTabProps) => (
  <motion.div
    key="info"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15 }}
    className="px-6 py-4"
  >
    <EmployeeFieldRow
      icon={Hash} label={arabicSource("common.job_number")} value={editData.employeeNumber} dir="ltr"
      isEditing={isEditing}
      editElement={
        <input value={editData.employeeNumber} onChange={(e) => onFieldChange("employeeNumber", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
      }
    />
    <EmployeeFieldRow
      icon={Building} label={arabicSource("common.section")} value={editData.department}
      isEditing={isEditing}
      editElement={
        addingNewDept ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newDeptName}
              onChange={(e) => onNewDeptNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newDeptName.trim()) {
                  onConfirmNewDept();
                } else if (e.key === "Escape") {
                  onCancelNewDept();
                }
              }}
              placeholder={arabicSource("shared.write_the_name_of_the_new_section")}
              className={inputClass}
              style={{ fontSize: 14 }}
            />
            <button
              onClick={onConfirmNewDept}
              disabled={!newDeptName.trim()}
              className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelNewDept}
              className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Select
            value={editData.department}
            onChange={(e) => {
              if (e.target.value === "__NEW__") {
                onStartAddingDept();
              } else {
                onFieldChange("department", e.target.value);
              }
            }}
            className={inputClass}
            style={{ fontSize: 14 }}
          >
            {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
            <option disabled style={{ borderTop: "1px solid var(--border)", fontSize: 11 }}>──────────</option>
            <option value="__NEW__">{arabicSource("shared.add_a_new_section")}</option>
          </Select>
        )
      }
    />
    <EmployeeFieldRow
      icon={Briefcase} label={arabicSource("shared.job_title")} value={editData.position}
      isEditing={isEditing}
      editElement={
        <input value={editData.position} onChange={(e) => onFieldChange("position", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }} />
      }
    />
    <EmployeeFieldRow
      icon={Mail} label={arabicSource("common.email")} value={editData.email} dir="ltr"
      isEditing={isEditing}
      editElement={
        <input value={editData.email} onChange={(e) => onFieldChange("email", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
      }
    />
    <EmployeeFieldRow
      icon={Smartphone} iconColor="text-primary" label={arabicSource("shared.employee_phone")} value={editData.personalPhone} dir="ltr"
      isEditing={isEditing}
      editElement={
        <input value={editData.personalPhone} onChange={(e) => onFieldChange("personalPhone", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
      }
    />
    <EmployeeFieldRow
      icon={PhoneCall} iconColor="text-primary" label={arabicSource("common.company_phone")} value={editData.companyPhone} dir="ltr"
      isEditing={isEditing}
      editElement={
        <input value={editData.companyPhone} onChange={(e) => onFieldChange("companyPhone", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
      }
    />
    <EmployeeFieldRow
      icon={MapPin} iconColor="text-primary" label={arabicSource("common.address")} value={editData.address}
      isEditing={isEditing}
      editElement={
        <input value={editData.address} onChange={(e) => onFieldChange("address", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }} />
      }
    />
    <EmployeeFieldRow
      icon={Wallet} iconColor="text-primary" label={arabicSource("common.salary")} value={formatCurrency(editData.salary, editData.currency || "IQD")} dir="ltr" highlight
      isEditing={isEditing}
      editElement={
        <input type="number" value={editData.salary} onChange={(e) => onFieldChange("salary", Number(e.target.value))}
          className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
      }
    />
    <EmployeeFieldRow
      icon={CalendarCheck} iconColor="text-emerald-400" label={arabicSource("common.direct_date")} value={editData.startDate} dir="ltr"
      isEditing={isEditing}
      editElement={
        <input type="date" value={editData.startDate} onChange={(e) => onFieldChange("startDate", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
      }
    />
    <EmployeeFieldRow
      icon={CalendarX} iconColor="text-destructive" label={arabicSource("shared.departure_date")}
      value={editData.endDate || arabicSource("shared.still_working")} dir="ltr"
      isEditing={isEditing}
      editElement={
        <input type="date" value={editData.endDate || ""} onChange={(e) => onFieldChange("endDate", e.target.value || "")}
          className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
      }
    />
    <EmployeeFieldRow
      icon={FileText} label={arabicSource("common.id_number")} value={editData.nationalId} dir="ltr"
      isEditing={isEditing}
      editElement={
        <input value={editData.nationalId} onChange={(e) => onFieldChange("nationalId", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
      }
    />
    {/* Emergency Contact — special two-part row */}
    <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <Phone className="w-5 h-5 text-destructive shrink-0" />
      <span className="text-muted-foreground shrink-0 min-w-[110px]" style={{ fontSize: 13 }}>{arabicSource("shared.emergency_contact")}</span>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-3">
            <input value={editData.emergencyContact} onChange={(e) => onFieldChange("emergencyContact", e.target.value)}
              placeholder={arabicSource("common.name")} className={inputClass} style={{ fontSize: 14 }} />
            <input value={editData.emergencyPhone} onChange={(e) => onFieldChange("emergencyPhone", e.target.value)}
              placeholder={arabicSource("shared.no")} className={`${inputClass} max-w-[160px]`} style={{ fontSize: 14 }} dir="ltr" />
          </div>
        ) : (
          <span className="text-foreground" style={{ fontSize: 14 }}>
            {editData.emergencyContact} <span className="text-muted-foreground mx-1">—</span> <span dir="ltr">{editData.emergencyPhone}</span>
          </span>
        )}
      </div>
    </div>
    <EmployeeFieldRow
      icon={ClipboardList} iconColor="text-destructive" label={arabicSource("shared.blood_type")} value={editData.bloodType} dir="ltr"
      isEditing={isEditing}
      editElement={
        <Select value={editData.bloodType} onChange={(e) => onFieldChange("bloodType", e.target.value)}
          className={inputClass} style={{ fontSize: 14 }}>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
            <option key={bt} value={bt}>{bt}</option>
          ))}
        </Select>
      }
    />
    <EmployeeFieldRow
      icon={Users} iconColor="text-primary" label={arabicSource("common.direct_manager")} value={editData.managerName}
      isEditing={isEditing}
      editElement={
        <Select value={editData.managerId || ""} onChange={(e) => onManagerChange(e.target.value || null)}
          className={inputClass} style={{ fontSize: 14 }}>
          <option value="">{arabicSource("shared.without_a_direct_manager")}</option>
          {allEmployees.map(emp => (
            <option key={emp.dbId} value={emp.dbId}>{emp.name} ({emp.position})</option>
          ))}
        </Select>
      }
    />
  </motion.div>
);

export default EmployeeInfoTab;
