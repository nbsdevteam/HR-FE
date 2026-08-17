import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Clock } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useEmployees, useWarnings } from "@/shared/hooks";
import { useWarningConfig } from "../hooks/useWarningConfig";
import { useWarningForm } from "../hooks/useWarningForm";
import { useWarningRecordActions } from "../hooks/useWarningRecordActions";
import { useWarningToast } from "../hooks/useWarningToast";
import type { WarningViewMode, WarningWithEmployee } from "../types";
import { computeWarningsByEmployee, enrichWarnings, filterWarnings } from "../utils/warningsDisplay";
import { computeWarningStats } from "../utils/warningsStats";
import WarningDetailModal from "./WarningDetailModal";
import WarningEscalationPath from "./WarningEscalationPath";
import WarningFormModal from "./WarningFormModal";
import WarningsFiltersBar from "./WarningsFiltersBar";
import WarningsHeader from "./WarningsHeader";
import WarningsKanbanView from "./WarningsKanbanView";
import WarningsListView from "./WarningsListView";
import LoadingState from "@/shared/components/LoadingState";
import WarningsStats from "./WarningsStats";
import Toast from "@/shared/components/Toast";

const WarningsWorkspace = () => {
  const [viewMode, setViewMode] = useState<WarningViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedWarning, setSelectedWarning] = useState<WarningWithEmployee | null>(null);

  const { warnings, loading, refetch } = useWarnings();
  const { employees } = useEmployees();
  const config = useWarningConfig();
  const { toast, setToast } = useWarningToast();
  const form = useWarningForm({ warningTypes: config.warningTypes, refetch, setToast });
  const recordActions = useWarningRecordActions({ warningStatuses: config.warningStatuses, refetch, setToast });

  const enrichedWarnings = useMemo(
    () => enrichWarnings(warnings, employees, config.warningTypes, config.warningStatuses),
    [warnings, employees, config.warningTypes, config.warningStatuses],
  );
  const filteredWarnings = useMemo(
    () => filterWarnings(enrichedWarnings, searchQuery, filterType, filterStatus),
    [enrichedWarnings, searchQuery, filterType, filterStatus],
  );
  const warningsByEmployee = useMemo(
    () => computeWarningsByEmployee(enrichedWarnings, arabicSource("common.is_active")),
    [enrichedWarnings],
  );
  const stats = useMemo(() => computeWarningStats(filteredWarnings, config.warningTypes), [filteredWarnings, config.warningTypes]);

  const closeDetailModal = useCallback(() => setSelectedWarning(null), []);
  const handleEditFromDetail = useCallback(() => {
    if (!selectedWarning) return;
    form.handleEditWarning(selectedWarning);
    setSelectedWarning(null);
  }, [form, selectedWarning]);
  const handleActivateFromDetail = useCallback(() => {
    if (!selectedWarning) return;
    recordActions.handleStatusChange(selectedWarning.id, arabicSource("common.is_active"));
    setSelectedWarning(null);
  }, [recordActions, selectedWarning]);
  const handleEndFromDetail = useCallback(() => {
    if (!selectedWarning) return;
    recordActions.handleStatusChange(selectedWarning.id, arabicSource("common.finished"));
    setSelectedWarning(null);
  }, [recordActions, selectedWarning]);
  const handleDeleteFromDetail = useCallback(() => {
    if (!selectedWarning) return;
    recordActions.handleDelete(selectedWarning.id);
    setSelectedWarning(null);
  }, [recordActions, selectedWarning]);

  return (
    <div className="space-y-6">
      <WarningsHeader viewMode={viewMode} onViewModeChange={setViewMode} onNewWarning={form.openNewForm} />

      <WarningsStats stats={stats} typeColors={config.typeColors} />

      <WarningsFiltersBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        warningTypes={config.warningTypes}
        warningStatuses={config.warningStatuses}
      />

      <WarningEscalationPath warningTypes={config.warningTypes} />

      {loading && <LoadingState message={arabicSource("warnings.loading_alarms")} variant="stacked" icon={Clock} />}

      {!loading && (
        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <WarningsListView
              warnings={filteredWarnings}
              typeColors={config.typeColors}
              statusColors={config.statusColors}
              typeSeverity={config.typeSeverity}
              warningsByEmployee={warningsByEmployee}
              onSelectWarning={setSelectedWarning}
            />
          ) : (
            <WarningsKanbanView
              columns={config.kanbanStatusCols}
              warnings={filteredWarnings}
              typeColors={config.typeColors}
              typeSeverity={config.typeSeverity}
              onSelectWarning={setSelectedWarning}
            />
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {selectedWarning && (
          <WarningDetailModal
            warning={selectedWarning}
            typeColors={config.typeColors}
            statusColors={config.statusColors}
            onClose={closeDetailModal}
            onEdit={handleEditFromDetail}
            onActivate={handleActivateFromDetail}
            onEnd={handleEndFromDetail}
            onDelete={handleDeleteFromDetail}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {form.showForm && (
          <WarningFormModal
            form={form.formData}
            employees={employees}
            warningTypes={config.warningTypes}
            saving={form.saving}
            isEditing={!!form.editingId}
            onFieldChange={form.updateFormField}
            onSubmit={form.handleCreateWarning}
            onClose={form.closeForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast}
            shape="card"
            position="bottom-end"
            toneClassName="bg-card border-border"
            textClassName="text-foreground text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarningsWorkspace;
