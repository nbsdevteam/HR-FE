import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { DEFAULT_SETTINGS } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import type { PayrollDetailPanelProps } from "../types";
import { usePayrollDetailPanel } from "../hooks/usePayrollDetailPanel";
import PayrollSummaryChips from "./PayrollSummaryChips";
import PayrollLedgerEditor from "./PayrollLedgerEditor";
import PayrollSalaryBreakdownCard from "./PayrollSalaryBreakdownCard";
import PayrollLeaveDaysCard from "./PayrollLeaveDaysCard";
import AbsencePopover from "./AbsencePopover";
import CalendarView from "./CalendarView";
import ShortfallPopover from "./ShortfallPopover";

const PayrollDetailPanel = (props: PayrollDetailPanelProps) => {
  const { onClose, selectedMonth } = props;
  const {
    absenceRecs,
    avgHoursPerDay,
    calc,
    currentLedger,
    displayMonth,
    editingLedger,
    excuseAbsence,
    excuseShortfall,
    handleSaveLedger,
    isOpen,
    leaveRecs,
    ledgerCurrency,
    ledgerLoan,
    ledgerPenalty,
    ledgerSaving,
    ledgerTip,
    paidLeaveCount,
    records,
    selectedData,
    setEditingLedger,
    setLedgerCurrency,
    setLedgerLoan,
    setLedgerPenalty,
    setLedgerTip,
    setShowAbsence,
    setShowCalendar,
    setShowShortfall,
    shortfallRecs,
    showAbsence,
    showCalendar,
    showShortfall,
    unpaidLeaveCount,
  } = usePayrollDetailPanel(props);

  const handleShowShortfall = useCallback(
    () => setShowShortfall(true),
    [setShowShortfall],
  );
  const handleShowAbsence = useCallback(
    () => setShowAbsence(true),
    [setShowAbsence],
  );
  const handleToggleCalendar = useCallback(
    () => setShowCalendar((current) => !current),
    [setShowCalendar],
  );
  const handleStartEditLedger = useCallback(
    () => setEditingLedger(true),
    [setEditingLedger],
  );
  const handleCancelEditLedger = useCallback(
    () => setEditingLedger(false),
    [setEditingLedger],
  );
  const handleCloseShortfall = useCallback(
    () => setShowShortfall(false),
    [setShowShortfall],
  );
  const handleCloseAbsence = useCallback(
    () => setShowAbsence(false),
    [setShowAbsence],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="panel-content"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 end-0 z-50 h-full w-full max-w-2xl bg-background border-s border-border shadow-2xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={arabicSource("common.employee_details")}
          >
            <div className="p-6 space-y-6 pb-24">
              {/* Close Button & Employee Header */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  aria-label={arabicSource("common.close")}
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-primary" style={{ fontSize: 18 }}>
                      {selectedData.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-foreground">{selectedData.name}</h2>
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: 13 }}
                    >
                      {selectedData.department} — {displayMonth(selectedMonth)}
                    </p>
                  </div>
                </div>
              </div>

              <PayrollSummaryChips
                calc={calc}
                avgHoursPerDay={avgHoursPerDay}
                hasShortfallRecords={shortfallRecs.length > 0}
                hasAbsenceRecords={absenceRecs.length > 0}
                leaveRecsCount={leaveRecs.length}
                paidLeaveCount={paidLeaveCount}
                unpaidLeaveCount={unpaidLeaveCount}
                showCalendar={showCalendar}
                onShowShortfall={handleShowShortfall}
                onShowAbsence={handleShowAbsence}
                onToggleCalendar={handleToggleCalendar}
              />

              {/* Ledger Editor + Salary Breakdown */}
              <div className="flex flex-col gap-5">
                <PayrollLedgerEditor
                  ledgerCurrency={ledgerCurrency}
                  onLedgerCurrencyChange={setLedgerCurrency}
                  editingLedger={editingLedger}
                  onStartEdit={handleStartEditLedger}
                  onCancelEdit={handleCancelEditLedger}
                  onSave={handleSaveLedger}
                  ledgerSaving={ledgerSaving}
                  ledgerLoan={ledgerLoan}
                  onLedgerLoanChange={setLedgerLoan}
                  ledgerTip={ledgerTip}
                  onLedgerTipChange={setLedgerTip}
                  ledgerPenalty={ledgerPenalty}
                  onLedgerPenaltyChange={setLedgerPenalty}
                  currentLedger={currentLedger}
                />

                {Object.values(calc.salaryByCurrency).map((sc) => (
                  <PayrollSalaryBreakdownCard
                    key={sc.currency}
                    sc={sc}
                    calc={calc}
                    monthLabel={displayMonth(selectedMonth)}
                  />
                ))}
              </div>

              {leaveRecs.length > 0 && (
                <PayrollLeaveDaysCard
                  leaveRecs={leaveRecs}
                  paidLeaveCount={paidLeaveCount}
                  unpaidLeaveCount={unpaidLeaveCount}
                />
              )}

              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CalendarView
                      records={records}
                      settings={DEFAULT_SETTINGS}
                      monthYear={selectedMonth}
                      onExcuseAbsence={excuseAbsence}
                      onExcuseShortfall={excuseShortfall}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shortfall Popover */}
              <AnimatePresence>
                {showShortfall && (
                  <ShortfallPopover
                    records={shortfallRecs}
                    targetHours={DEFAULT_SETTINGS.targetWorkingHoursPerDay}
                    onClose={handleCloseShortfall}
                    onExcuse={excuseShortfall}
                  />
                )}
              </AnimatePresence>

              {/* Absence Popover */}
              <AnimatePresence>
                {showAbsence && (
                  <AbsencePopover
                    records={absenceRecs}
                    onClose={handleCloseAbsence}
                    onExcuse={excuseAbsence}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default memo(PayrollDetailPanel);
