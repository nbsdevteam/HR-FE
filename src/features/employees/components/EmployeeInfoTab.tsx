import { motion } from "motion/react";
import {
  Mail, Phone, MapPin, Wallet, CalendarCheck, CalendarX,
  Hash, PhoneCall, Smartphone, FileText, ClipboardList, Users,
} from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency";
import { Select, TypeAhead } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DepartmentOption, Employee, EmployeeOption, PositionOption } from "../types";
import EmployeeDepartmentField from "./EmployeeDepartmentField";
import EmployeeFieldRow from "./EmployeeFieldRow";
import EmployeePositionField from "./EmployeePositionField";

const inputClass = "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";
const getManagerOptionId = (emp: EmployeeOption): string => emp.dbId;
const getManagerOptionLabel = (emp: EmployeeOption): string => `${emp.name} (${emp.position})`;

type EmployeeInfoTabProps = {
  editData: Employee;
  isEditing: boolean;
  allDepts: DepartmentOption[];
  departmentId: string | null;
  allPositions: PositionOption[];
  positionId: string | null;
  allEmployees: EmployeeOption[];
  addingNewDept: boolean;
  creatingDept: boolean;
  newDeptName: string;
  onFieldChange: (field: keyof Employee, value: string | number) => void;
  onDepartmentSelect: (deptId: string, deptName: string) => void;
  onPositionSelect: (positionId: string, positionName: string) => void;
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
  departmentId,
  allPositions,
  positionId,
  allEmployees,
  addingNewDept,
  creatingDept,
  newDeptName,
  onFieldChange,
  onDepartmentSelect,
  onPositionSelect,
  onManagerChange,
  onStartAddingDept,
  onNewDeptNameChange,
  onConfirmNewDept,
  onCancelNewDept,
}: EmployeeInfoTabProps) => {
  const handleEmployeeNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("employeeNumber", e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("email", e.target.value);
  };

  const handlePersonalPhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("personalPhone", e.target.value);
  };

  const handleCompanyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("companyPhone", e.target.value);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("address", e.target.value);
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("salary", Number(e.target.value));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("startDate", e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("endDate", e.target.value || "");
  };

  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("nationalId", e.target.value);
  };

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("emergencyContact", e.target.value);
  };

  const handleEmergencyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange("emergencyPhone", e.target.value);
  };

  const handleBloodTypeChange = (value: string): void => {
    onFieldChange("bloodType", value);
  };

  const handleManagerChange = (value: string): void => {
    onManagerChange(value || null);
  };

  return (
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
          <input value={editData.employeeNumber} onChange={handleEmployeeNumberChange}
            className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
        }
      />
      <EmployeeDepartmentField
        department={editData.department}
        departmentId={departmentId}
        allDepts={allDepts}
        isEditing={isEditing}
        addingNewDept={addingNewDept}
        creatingDept={creatingDept}
        newDeptName={newDeptName}
        inputClass={inputClass}
        onSelectDepartment={onDepartmentSelect}
        onStartAddingDept={onStartAddingDept}
        onNewDeptNameChange={onNewDeptNameChange}
        onConfirmNewDept={onConfirmNewDept}
        onCancelNewDept={onCancelNewDept}
      />
      <EmployeePositionField
        position={editData.position}
        positionId={positionId}
        allPositions={allPositions}
        isEditing={isEditing}
        inputClass={inputClass}
        onSelectPosition={onPositionSelect}
      />
      <EmployeeFieldRow
        icon={Mail} label={arabicSource("common.email")} value={editData.email} dir="ltr"
        isEditing={isEditing}
        editElement={
          <input value={editData.email} onChange={handleEmailChange}
            className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
        }
      />
      <EmployeeFieldRow
        icon={Smartphone} iconColor="text-primary" label={arabicSource("shared.employee_phone")} value={editData.personalPhone || "—"} dir="ltr"
        isEditing={isEditing}
        editElement={
          <input value={editData.personalPhone} onChange={handlePersonalPhoneChange}
            className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
        }
      />
      <EmployeeFieldRow
        icon={PhoneCall} iconColor="text-primary" label={arabicSource("common.company_phone")} value={editData.companyPhone || "—"} dir="ltr"
        isEditing={isEditing}
        editElement={
          <input value={editData.companyPhone} onChange={handleCompanyPhoneChange}
            className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
        }
      />
      <EmployeeFieldRow
        icon={MapPin} iconColor="text-primary" label={arabicSource("common.address")} value={editData.address || "—"}
        isEditing={isEditing}
        editElement={
          <input value={editData.address} onChange={handleAddressChange}
            className={inputClass} style={{ fontSize: 14 }} />
        }
      />
      <EmployeeFieldRow
        icon={Wallet} iconColor="text-primary" label={arabicSource("common.salary")} value={formatCurrency(editData.salary, editData.currency || "IQD")} dir="ltr" highlight
        isEditing={isEditing}
        editElement={
          <input type="number" value={editData.salary} onChange={handleSalaryChange}
            className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
        }
      />
      <EmployeeFieldRow
        icon={CalendarCheck} iconColor="text-emerald-400" label={arabicSource("common.direct_date")} value={editData.startDate} dir="ltr"
        isEditing={isEditing}
        editElement={
          <input type="date" value={editData.startDate} onChange={handleStartDateChange}
            className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
        }
      />
      <EmployeeFieldRow
        icon={CalendarX} iconColor="text-destructive" label={arabicSource("shared.departure_date")}
        value={editData.endDate || arabicSource("shared.still_working")} dir="ltr"
        isEditing={isEditing}
        editElement={
          <input type="date" value={editData.endDate || ""} onChange={handleEndDateChange}
            className={inputClass} style={{ fontSize: 14 }} dir="ltr" />
        }
      />
      <EmployeeFieldRow
        icon={FileText} label={arabicSource("common.id_number")} value={editData.nationalId || "—"} dir="ltr"
        isEditing={isEditing}
        editElement={
          <input value={editData.nationalId} onChange={handleNationalIdChange}
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
              <input value={editData.emergencyContact} onChange={handleEmergencyContactChange}
                placeholder={arabicSource("common.name")} className={inputClass} style={{ fontSize: 14 }} />
              <input value={editData.emergencyPhone} onChange={handleEmergencyPhoneChange}
                placeholder={arabicSource("shared.no")} className={`${inputClass} max-w-[160px]`} style={{ fontSize: 14 }} dir="ltr" />
            </div>
          ) : (
            <span className="text-foreground" style={{ fontSize: 14 }}>
              {editData.emergencyContact || "—"} <span className="text-muted-foreground mx-1">—</span> <span dir="ltr">{editData.emergencyPhone || "—"}</span>
            </span>
          )}
        </div>
      </div>
      <EmployeeFieldRow
        icon={ClipboardList} iconColor="text-destructive" label={arabicSource("shared.blood_type")} value={editData.bloodType || "—"} dir="ltr"
        isEditing={isEditing}
        editElement={
          <Select
            value={editData.bloodType}
            onChange={handleBloodTypeChange}
            options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
            className={inputClass}
            style={{ fontSize: 14 }}
          />
        }
      />
      <EmployeeFieldRow
        icon={Users} iconColor="text-primary" label={arabicSource("common.direct_manager")} value={editData.managerName}
        isEditing={isEditing}
        editElement={
          <TypeAhead
            items={allEmployees}
            getId={getManagerOptionId}
            getLabel={getManagerOptionLabel}
            value={editData.managerId || ""}
            onChange={handleManagerChange}
            blankLabel={arabicSource("shared.without_a_direct_manager")}
          />
        }
      />
    </motion.div>
  );
};

export default EmployeeInfoTab;
