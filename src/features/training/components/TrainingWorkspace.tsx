import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { CheckCircle } from "lucide-react";
import Toast from "@/shared/components/Toast";
import { arabicSource } from "@/i18n/source";
import {
  useEmployees,
  useTrainingParticipants,
  useTrainingPrograms,
} from "@/shared/hooks";
import { useParticipantEnrollment } from "../hooks/useParticipantEnrollment";
import { useProgramForm } from "../hooks/useProgramForm";
import { useTrainingConfig } from "../hooks/useTrainingConfig";
import { useTrainingToasts } from "../hooks/useTrainingToasts";
import {
  getEmployeeName,
  getProgramParticipants,
  filterPrograms,
  mapParticipantsToDisplay,
  mapProgramsToDisplay,
} from "../utils/trainingDisplay";
import {
  computeCategoryDistribution,
  computeMonthlyHours,
  computeStats,
} from "../utils/trainingStats";
import type { ToastType } from "../types";
import CreateProgramModal from "./CreateProgramModal";
import EditProgramModal from "./EditProgramModal";
import EnrollParticipantModal from "./EnrollParticipantModal";
import MonthlyHoursChart from "./MonthlyHoursChart";
import TrainingFiltersBar from "./TrainingFiltersBar";
import TrainingHeader from "./TrainingHeader";
import TrainingProgramsGrid from "./TrainingProgramsGrid";
import TrainingStatsGrid from "./TrainingStatsGrid";
import WeightDistributionCard from "./WeightDistributionCard";
import {
  TOAST_TONE_BORDER,
  TOAST_TONE_ICON_BG,
  TOAST_TONE_ICON_COLOR,
} from "../constants/training";

const TrainingWorkspace = () => {
  const [filter, setFilter] = useState(arabicSource("common.all"));
  const [searchTerm, setSearchTerm] = useState("");

  const {
    programs,
    loading: programsLoading,
    refetch: refetchPrograms,
  } = useTrainingPrograms();
  const { participants: allParticipants, refetch: refetchParticipants } =
    useTrainingParticipants();
  const { employees } = useEmployees();
  const config = useTrainingConfig();
  const { toasts, showToast } = useTrainingToasts();
  const programForm = useProgramForm({
    trainingCategories: config.trainingCategories,
    trainingStatuses: config.trainingStatuses,
    defaultWeight: config.defaultWeight,
    refetchPrograms,
    refetchParticipants,
    showToast,
  });
  const enrollment = useParticipantEnrollment({
    participantStatuses: config.participantStatuses,
    refetchParticipants,
    showToast,
  });

  const displayPrograms = useMemo(
    () => mapProgramsToDisplay(programs),
    [programs],
  );
  const displayParticipants = useMemo(
    () => mapParticipantsToDisplay(allParticipants),
    [allParticipants],
  );
  const filtered = useMemo(
    () =>
      filterPrograms(
        displayPrograms,
        filter,
        searchTerm,
        arabicSource("common.all"),
      ),
    [displayPrograms, filter, searchTerm],
  );
  const stats = useMemo(
    () => computeStats(displayPrograms, displayParticipants),
    [displayPrograms, displayParticipants],
  );
  const monthlyHours = useMemo(() => computeMonthlyHours(programs), [programs]);
  const categoryDistribution = useMemo(
    () => computeCategoryDistribution(programs, config.trainingCategories),
    [programs, config.trainingCategories],
  );
  const excludeIds = useMemo(
    () =>
      getProgramParticipants(
        displayParticipants,
        enrollment.selectedProgramForParticipants || "",
      ).map((p) => p.employee_id),
    [displayParticipants, enrollment.selectedProgramForParticipants],
  );

  const getEmployeeNameCb = useCallback(
    (employeeId: string) => getEmployeeName(employees, employeeId),
    [employees],
  );

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            icon={CheckCircle}
            position="bottom-start"
            toneClassName={`bg-card ${TOAST_TONE_BORDER[toast.type]}`}
            iconBoxClassName={TOAST_TONE_ICON_BG[toast.type]}
            iconClassName={`w-3 h-3 ${TOAST_TONE_ICON_COLOR[toast.type]}`}
            textClassName="text-foreground text-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          />
        ))}
      </AnimatePresence>

      <TrainingHeader onNewProgram={programForm.openCreateModal} />

      <WeightDistributionCard
        programs={programs}
        trainingCategories={config.trainingCategories}
        categoryDistribution={categoryDistribution}
      />

      <TrainingStatsGrid stats={stats} />

      <MonthlyHoursChart monthlyHours={monthlyHours} />

      <TrainingFiltersBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filters={config.filters}
        filter={filter}
        onFilterChange={setFilter}
      />

      <TrainingProgramsGrid
        programs={filtered}
        participants={displayParticipants}
        trainingCategories={config.trainingCategories}
        statusColors={config.statusColors}
        statusIcons={config.statusIcons}
        participantStatusColors={config.participantStatusColors}
        getEmployeeName={getEmployeeNameCb}
        onEditProgram={programForm.setEditingProgram}
        onDeleteProgram={programForm.handleDeleteProgram}
        onEnrollProgram={enrollment.openEnrollModal}
        onMarkParticipantCompleted={enrollment.handleMarkCompleted}
        onDeleteParticipant={enrollment.handleDeleteParticipant}
      />

      <AnimatePresence>
        {programForm.showCreateModal && (
          <CreateProgramModal
            form={programForm.createForm}
            trainingCategories={config.trainingCategories}
            trainingStatuses={config.trainingStatuses}
            defaultWeight={config.defaultWeight}
            onFieldChange={programForm.updateCreateForm}
            onSave={programForm.handleCreateProgram}
            onClose={programForm.closeCreateModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {programForm.editingProgram && (
          <EditProgramModal
            program={programForm.editingProgram}
            trainingStatuses={config.trainingStatuses}
            onFieldChange={programForm.updateEditingProgram}
            onSave={programForm.handleUpdateProgram}
            onClose={programForm.closeEditModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {enrollment.showEnrollModal && (
          <EnrollParticipantModal
            form={enrollment.enrollForm}
            employees={employees}
            participantStatuses={config.participantStatuses}
            excludeIds={excludeIds}
            onFieldChange={enrollment.updateEnrollForm}
            onSave={enrollment.handleEnrollParticipant}
            onClose={enrollment.closeEnrollModal}
          />
        )}
      </AnimatePresence>

      {programsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {arabicSource("common.loading")}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingWorkspace;
