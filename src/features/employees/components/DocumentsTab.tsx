import { useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { FileText, Plus } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { DataTable, EmptyState, FilterChip, Select, TableHeaderRow, TypeAhead } from "@/shared/components";
import {
  getEmployeeDescription,
  getEmployeeId,
  getEmployeeSearchText,
} from "@/features/employees/utils/employeeTypeAhead";
import {
  empDisplayName,
  type DbDocumentType, type DbEmployeeDocument,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { lifecycleCardClass as cardCls, lifecycleInputClass as inputCls } from "../styles/lifecycle";
import FormFieldLabel from "./FormFieldLabel";
import ExpandFormCard from "./shared/ExpandFormCard";
import DocumentTableRow from "./DocumentTableRow";

const DOCUMENT_FILTERS = [
  { key: "all", label: arabicSource("common.all") },
  { key: "valid", label: arabicSource("common.surrey") },
  { key: "expiring_soon", label: arabicSource("common.soon_to_be_completed") },
  { key: "expired", label: arabicSource("common.finished") },
  { key: "missing", label: arabicSource("common.is_missing") },
];

const EMPTY_DOCUMENT_FORM = {
  employee_id: "", document_type_id: "", document_number: "",
  issue_date: "", expiry_date: "", notes: "",
};

const DocumentsTab = ({
  documents, docTypes, empMap, employees, employeeLabels, refetch,
  statusLabels, statusColors,
}: {
  documents: DbEmployeeDocument[];
  docTypes: DbDocumentType[];
  empMap: Record<string, any>;
  employees: any[];
  employeeLabels: Record<string, string>;
  refetch: () => void;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_DOCUMENT_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const docTypeById = useMemo(
    () => new Map(docTypes.map((t) => [t.id, t])),
    [docTypes],
  );

  // Auto-compute document statuses
  const enrichedDocs = useMemo(() => {
    return documents.map((d: DbEmployeeDocument) => {
      const dt = docTypeById.get(d.document_type_id);
      let computedStatus = d.status;
      if (d.expiry_date && dt?.has_expiry) {
        const daysToExpiry = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / 86400000);
        if (daysToExpiry < 0) computedStatus = "expired";
        else if (daysToExpiry <= (dt.expiry_warning_days || 30)) computedStatus = "expiring_soon";
        else computedStatus = "valid";
      }
      return { ...d, computedStatus };
    });
  }, [documents, docTypeById]);

  const filtered = useMemo(
    () => (filter === "all" ? enrichedDocs : enrichedDocs.filter(d => d.computedStatus === filter)),
    [filter, enrichedDocs],
  );

  const handleCreate = useCallback(async () => {
    if (!formData.employee_id || !formData.document_type_id) return;
    setSaving(true);
    try {
      await odooData.createDocument({
        employee_id: formData.employee_id,
        document_type_id: formData.document_type_id,
        name: formData.document_number || "Document",
        issue_date: formData.issue_date || false,
        expiry_date: formData.expiry_date || false,
      });
      refetch();
      setShowForm(false);
      setFormData(EMPTY_DOCUMENT_FORM);
    } catch (e) {
      console.error(e);
      alert("خطأ في حفظ الوثيقة");
    }
    setSaving(false);
  }, [formData, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await odooData.deleteDocument(id);
      refetch();
    } catch (e) {
      console.error(e);
      alert("خطأ في حذف الوثيقة");
    }
  }, [refetch]);

  const closeForm = useCallback(() => setShowForm(false), []);
  const toggleForm = useCallback(() => setShowForm((v) => !v), []);

  const handleFilterClick = (key: string) => () => setFilter(key);

  const handleEmployeeChange = (id: string): void => {
    setFormData((p) => ({ ...p, employee_id: String(id) }));
  };

  const handleDocumentTypeChange = (value: string): void => {
    setFormData((p) => ({ ...p, document_type_id: value }));
  };

  const handleDocumentNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData((p) => ({ ...p, document_number: e.target.value }));
  };

  const handleIssueDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData((p) => ({ ...p, issue_date: e.target.value }));
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData((p) => ({ ...p, expiry_date: e.target.value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {DOCUMENT_FILTERS.map(f => (
          <FilterChip key={f.key} label={f.label} active={filter === f.key} onClick={handleFilterClick(f.key)} fontSize={13} />
        ))}
        <button onClick={toggleForm} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark cursor-pointer ms-auto" style={{ fontSize: 13 }}>
          <Plus className="w-4 h-4" /> {arabicSource("common.add_document")}
        </button>
      </div>

      {/* New Doc Form */}
      <AnimatePresence>
        {showForm && (
          <ExpandFormCard
            cardClassName={cardCls}
            title={arabicSource("common.add_document")}
            saveLabel={arabicSource("common.save")}
            saving={saving}
            onSave={handleCreate}
            onCancel={closeForm}
          >
            <div>
              <FormFieldLabel>{arabicSource("common.employee_3")}</FormFieldLabel>
              <TypeAhead
                items={employees}
                getId={getEmployeeId}
                getLabel={empDisplayName}
                getDescription={getEmployeeDescription}
                getSearchText={getEmployeeSearchText}
                fallbackLabels={employeeLabels}
                value={formData.employee_id}
                onChange={handleEmployeeChange}
              />
            </div>
            <div>
              <FormFieldLabel>{arabicSource("lifecycle.document_type_2")}</FormFieldLabel>
              <Select
                value={formData.document_type_id}
                onChange={handleDocumentTypeChange}
                options={docTypes.filter(t => t.is_active).map(t => ({ value: t.id, label: t.name_ar }))}
                placeholder={arabicSource("common.choose")}
                className={inputCls}
              />
            </div>
            <div>
              <FormFieldLabel>{arabicSource("common.document_number")}</FormFieldLabel>
              <input value={formData.document_number} onChange={handleDocumentNumberChange} className={inputCls} dir="ltr" />
            </div>
            <div>
              <FormFieldLabel>{arabicSource("common.release_date")}</FormFieldLabel>
              <input type="date" value={formData.issue_date} onChange={handleIssueDateChange} className={inputCls} dir="ltr" />
            </div>
            <div>
              <FormFieldLabel>{arabicSource("common.end_date")}</FormFieldLabel>
              <input type="date" value={formData.expiry_date} onChange={handleExpiryDateChange} className={inputCls} dir="ltr" />
            </div>
          </ExpandFormCard>
        )}
      </AnimatePresence>

      {/* Documents List */}
      <DataTable
        wrapperClassName={cardCls}
        items={filtered}
        header={<TableHeaderRow headings={[arabicSource("common.employee"), arabicSource("lifecycle.document_type"), arabicSource("common.document_number"), arabicSource("common.release_date"), arabicSource("common.end_date"), arabicSource("common.status"), arabicSource("common.procedures")]} />}
        renderRow={(d, i) => (
          <DocumentTableRow
            key={d.id}
            doc={d}
            index={i}
            emp={empMap[d.employee_id]}
            docType={docTypeById.get(d.document_type_id)}
            statusLabels={statusLabels}
            statusColors={statusColors}
            onDelete={handleDelete}
          />
        )}
        emptyRow={<tr><td colSpan={7}><EmptyState icon={FileText} message={arabicSource("lifecycle.no_documents")} /></td></tr>}
      />
    </div>
  );
};

export default DocumentsTab;
