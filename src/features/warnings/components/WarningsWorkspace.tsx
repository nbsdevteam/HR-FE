import { memo, useCallback, useMemo, useState, lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import { Clock } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { ConfirmDeleteModal } from "@/shared/components";
import { useEmployees, useWarningAttachmentSettings, useWarnings } from "@/shared/hooks";
import { useWarningConfig } from "../hooks/useWarningConfig";
import { useWarningForm } from "../hooks/useWarningForm";
import { useWarningPermissions } from "../hooks/useWarningPermissions";
import { useWarningRecordActions } from "../hooks/useWarningRecordActions";
import { useWarningToast } from "../hooks/useWarningToast";
import type { WarningViewMode, WarningWithEmployee } from "../types";
import {
  computeWarningsByEmployee,
  enrichWarnings,
  filterWarnings,
} from "../utils/warningsDisplay";
import { computeWarningStats } from "../utils/warningsStats";
import WarningEscalationPath from "./WarningEscalationPath";
import WarningsFiltersBar from "./WarningsFiltersBar";
import WarningsHeader from "./WarningsHeader";
import WarningsListView from "./WarningsListView";
import LoadingState from "@/shared/components/LoadingState";
import WarningsStats from "./WarningsStats";
import Toast from "@/shared/components/Toast";

const WarningsKanbanView = lazy(() => import("./WarningsKanbanView"));
const WarningDetailModal = lazy(() => import("./WarningDetailModal"));
const WarningFormModal = lazy(() => import("./WarningFormModal"));

const WarningsWorkspace = () => {
  const [viewMode, setViewMode] = useState<WarningViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  // Held by id, not by value, so an attachment upload/delete refetch re-renders
  // the open detail modal with the warning's new file list.
  const [selectedWarningId, setSelectedWarningId] = useState<string | null>(null);

  const { warnings, loading, refetch } = useWarnings();
  const { employees } = useEmployees();
  const config = useWarningConfig();
  const { settings: attachmentSettings } = useWarningAttachmentSettings();
  const { canEdit } = useWarningPermissions();
  const { toast, setToast } = useWarningToast();
  const form = useWarningForm({
    warningTypes: config.warningTypes,
    attachmentSettings,
    refetch,
    setToast,
  });
  const recordActions = useWarningRecordActions({
    warningStatuses: config.warningStatuses,
    refetch,
    setToast,
  });

  const enrichedWarnings = useMemo(
    () =>
      enrichWarnings(
        warnings,
        employees,
        config.warningTypes,
        config.warningStatuses,
      ),
    [warnings, employees, config.warningTypes, config.warningStatuses],
  );
  const filteredWarnings = useMemo(
    () =>
      filterWarnings(enrichedWarnings, searchQuery, filterType, filterStatus),
    [enrichedWarnings, searchQuery, filterType, filterStatus],
  );
  const warningsByEmployee = useMemo(
    () =>
      computeWarningsByEmployee(
        enrichedWarnings,
        arabicSource("common.is_active"),
      ),
    [enrichedWarnings],
  );
  const stats = useMemo(
    () => computeWarningStats(filteredWarnings, config.warningTypes),
    [filteredWarnings, config.warningTypes],
  );
  const selectedWarning = useMemo(
    () => enrichedWarnings.find((w) => w.id === selectedWarningId) || null,
    [enrichedWarnings, selectedWarningId],
  );
  const editingWarning = useMemo(
    () => enrichedWarnings.find((w) => w.id === form.editingId) || null,
    [enrichedWarnings, form.editingId],
  );

  const handleSelectWarning = useCallback((warning: WarningWithEmployee) => {
    setSelectedWarningId(warning.id);
  }, []);
  const closeDetailModal = useCallback(() => setSelectedWarningId(null), []);
  const handleEditFromDetail = useCallback(() => {
    if (!selectedWarning) return;
    form.handleEditWarning(selectedWarning);
    setSelectedWarningId(null);
  }, [form, selectedWarning]);
  const handleActivateFromDetail = useCallback(() => {
    if (!selectedWarning) return;
    recordActions.handleStatusChange(
      selectedWarning.id,
      arabicSource("common.is_active"),
    );
    setSelectedWarningId(null);
  }, [recordActions, selectedWarning]);
  const handleEndFromDetail = useCallback(() => {
    if (!selectedWarning) return;
    recordActions.handleStatusChange(
      selectedWarning.id,
      arabicSource("common.finished"),
    );
    setSelectedWarningId(null);
  }, [recordActions, selectedWarning]);
  const handleDeleteFromDetail = useCallback(() => {
    if (!selectedWarning) return;
    recordActions.requestDelete(selectedWarning.id);
    setSelectedWarningId(null);
  }, [recordActions, selectedWarning]);

  return (
    <div className="space-y-6">
      <WarningsHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewWarning={form.openNewForm}
      />

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

      {loading && (
        <LoadingState
          message={arabicSource("warnings.loading_alarms")}
          variant="stacked"
          icon={Clock}
        />
      )}

      {!loading && (
        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <WarningsListView
              warnings={filteredWarnings}
              typeColors={config.typeColors}
              statusColors={config.statusColors}
              typeSeverity={config.typeSeverity}
              warningsByEmployee={warningsByEmployee}
              onSelectWarning={handleSelectWarning}
            />
          ) : (
            <Suspense fallback={null}>
              <WarningsKanbanView
                columns={config.kanbanStatusCols}
                warnings={filteredWarnings}
                typeColors={config.typeColors}
                typeSeverity={config.typeSeverity}
                onSelectWarning={handleSelectWarning}
              />
            </Suspense>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {selectedWarning && (
          <Suspense fallback={null}>
            <WarningDetailModal
              warning={selectedWarning}
              typeColors={config.typeColors}
              statusColors={config.statusColors}
              attachmentSettings={attachmentSettings}
              canEdit={canEdit}
              onAttachmentsChanged={refetch}
              onClose={closeDetailModal}
              onEdit={handleEditFromDetail}
              onActivate={handleActivateFromDetail}
              onEnd={handleEndFromDetail}
              onDelete={handleDeleteFromDetail}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {form.showForm && (
          <Suspense fallback={null}>
            <WarningFormModal
              form={form.formData}
              employees={employees}
              warningTypes={config.warningTypes}
              saving={form.saving}
              isEditing={!!form.editingId}
              storedExpiryDate={editingWarning?.expiry_date ?? null}
              attachmentFiles={form.attachments.files}
              attachmentError={form.attachments.error}
              acceptedFormats={form.attachments.acceptedFormats}
              maxBytes={form.attachments.maxBytes}
              onFilesSelected={form.attachments.handleFilesSelected}
              onRemoveFile={form.attachments.handleRemoveFile}
              onFieldChange={form.updateFormField}
              onSubmit={form.handleCreateWarning}
              onClose={form.closeForm}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recordActions.pendingDeleteId && (
          <ConfirmDeleteModal
            onClose={recordActions.cancelDelete}
            onConfirm={recordActions.confirmDelete}
            title={arabicSource("employees.confirm_deletion")}
            message={arabicSource("warnings.are_you_sure_you_want_to_delete_this_alarm")}
            loading={recordActions.deleting}
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

export default memo(WarningsWorkspace);
