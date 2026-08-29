import { CalendarCheck, Laptop, Paperclip, User } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { EmployeeDetailModalTab } from "../types";
import EmployeeDetailTabButton from "./EmployeeDetailTabButton";

type EmployeeDetailTabsProps = {
  modalTab: EmployeeDetailModalTab;
  custodiesCount: number;
  leavesCount: number;
  attachmentsCount: number;
  onSelect: (tab: EmployeeDetailModalTab) => void;
};

const EmployeeDetailTabs = ({ modalTab, custodiesCount, leavesCount, attachmentsCount, onSelect }: EmployeeDetailTabsProps) => {
  const tabs = [
    { key: "info" as const, label: arabicSource("shared.information"), icon: User, count: null },
    { key: "custodies" as const, label: arabicSource("shared.receivables"), icon: Laptop, count: custodiesCount },
    { key: "leaves" as const, label: arabicSource("common.vacations"), icon: CalendarCheck, count: leavesCount },
    { key: "attachments" as const, label: arabicSource("shared.attachments"), icon: Paperclip, count: attachmentsCount },
  ];

  return (
    <div className="shrink-0 flex items-center gap-0.5 px-6 bg-muted/5" style={{ borderBottom: "1px solid var(--border)" }}>
      {tabs.map(tab => (
        <EmployeeDetailTabButton
          key={tab.key}
          tabKey={tab.key}
          label={tab.label}
          icon={tab.icon}
          count={tab.count}
          isActive={modalTab === tab.key}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default EmployeeDetailTabs;
