import { ModalHeader, ModalOverlay } from "@/shared/components";
import { type DbLeaveType, type DbLeaveBalance, type DbLeaveSettings } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { useLeaveRequestForm } from "../hooks/useLeaveRequestForm";
import { leaveInputClass as inputCls } from "../styles";
import LeaveFormError from "./LeaveFormError";
import LeaveModalActions from "./LeaveModalActions";
import LeaveRequestAttachmentField from "./LeaveRequestAttachmentField";
import LeaveRequestDurationSummary from "./LeaveRequestDurationSummary";
import LeaveRequestEmployeeField from "./LeaveRequestEmployeeField";
import LeaveRequestHalfDayRow from "./LeaveRequestHalfDayRow";
import LeaveRequestHourlySummary from "./LeaveRequestHourlySummary";
import LeaveRequestHoursRow from "./LeaveRequestHoursRow";
import LeaveRequestProbationNotice from "./LeaveRequestProbationNotice";
import LeaveTypeChipButton from "./LeaveTypeChipButton";

type LeaveRequestModalProps = {
  employees: any[];
  leaveTypes: DbLeaveType[];
  balances: DbLeaveBalance[];
  settings: DbLeaveSettings | null;
  selfOnly: boolean;
  linkError: string | null;
  employeesLoading: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

const LeaveRequestModal = ({
  employees,
  leaveTypes,
  balances,
  settings,
  selfOnly,
  linkError,
  employeesLoading,
  onClose,
  onSubmit,
}: LeaveRequestModalProps) => {
  const {
    balanceWarning, blockedByProbation, days, employeeId, endDate, error,
    firstAccrualOn, halfDayPeriod, handleEmployeeChange, handleEndDateChange,
    handleIsHalfDayChange, handleReasonChange, handleSelectLeaveType,
    handleStartDateChange, handleSubmit, hourly, isHalfDay, isHourly,
    leaveTypeId, minStartDate, outOfBalance, probationEndDate, reason,
    remainingBalance, saving, selectedType, selfEmployee, setHalfDayPeriod,
    startDate,
  } = useLeaveRequestForm({ employees, leaveTypes, balances, selfOnly, linkError, settings, onSubmit });

  const submitDisabled =
    employeesLoading || outOfBalance || (selfOnly && (!!linkError || !selfEmployee));

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto"
    >
      <ModalHeader title={arabicSource("leave.new_leave_request")} onClose={onClose} />

      <LeaveFormError message={error} />

      <div className="space-y-4">
        {/* Employee Selection */}
        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.employee_3")}</label>
          <LeaveRequestEmployeeField
            employees={employees}
            employeeId={employeeId}
            onEmployeeChange={handleEmployeeChange}
            selfOnly={selfOnly}
            employeesLoading={employeesLoading}
            linkError={linkError}
            selfEmployee={selfEmployee}
          />
        </div>

        {/* Leave Type */}
        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.leave_type_2")}</label>
          <div className="flex flex-wrap gap-2">
            {leaveTypes.map(t => (
              <LeaveTypeChipButton
                key={t.id}
                leaveType={t}
                isSelected={leaveTypeId === t.id}
                onSelect={handleSelectLeaveType}
              />
            ))}
          </div>
        </div>

        <LeaveRequestProbationNotice
          blockedByProbation={blockedByProbation}
          probationEndDate={probationEndDate}
          minStartDate={minStartDate}
          firstAccrualOn={firstAccrualOn}
          outOfBalance={outOfBalance}
        />

        {!isHourly && (
          <>
            {/* Half Day Toggle */}
            {selectedType?.allow_half_day && (
              <LeaveRequestHalfDayRow
                isHalfDay={isHalfDay}
                halfDayPeriod={halfDayPeriod}
                onIsHalfDayChange={handleIsHalfDayChange}
                onHalfDayPeriodChange={setHalfDayPeriod}
              />
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
                  {isHalfDay ? arabicSource("common.date") : arabicSource("common.from_date")} *
                </label>
                {/* Raw input rather than the shared InputField: `min` is a date
                    string (the probation floor), and InputField types `min` as a number. */}
                <input type="date" value={startDate} onChange={handleStartDateChange} className={inputCls} dir="ltr" min={minStartDate || undefined} />
              </div>
              {!isHalfDay && (
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("leave.to_date")}</label>
                  <input type="date" value={endDate} onChange={handleEndDateChange} className={inputCls} dir="ltr" min={startDate || minStartDate || undefined} />
                </div>
              )}
            </div>

            <LeaveRequestDurationSummary
              days={days}
              isHalfDay={isHalfDay}
              remainingBalance={remainingBalance}
              warning={balanceWarning}
            />
          </>
        )}

        {isHourly && (
          <>
            {/* Single date for an hourly request */}
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.date_2")}</label>
              <input type="date" value={startDate} onChange={handleStartDateChange} className={inputCls} dir="ltr" min={minStartDate || undefined} />
            </div>
            <LeaveRequestHoursRow
              hours={hourly.hours}
              hourFrom={hourly.hourFrom}
              maxHours={hourly.maxHours}
              onHoursChange={hourly.handleHoursChange}
              onHourFromChange={hourly.handleHourFromChange}
            />
            <LeaveRequestHourlySummary hours={hourly.hours} hourFromFloat={hourly.hourFromFloat} />
          </>
        )}

        {/* Reason */}
        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.the_reason")}</label>
          <textarea
            value={reason} onChange={handleReasonChange}
            rows={2} placeholder={arabicSource("leave.reason_for_leave")}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
          />
        </div>

        {/* Attachment */}
        <LeaveRequestAttachmentField
          requiresAttachment={!!selectedType?.requires_attachment}
          attachmentFile={hourly.attachmentFile}
          attachmentError={hourly.attachmentError}
          acceptedFormats={hourly.acceptedFormats}
          maxBytes={hourly.maxBytes}
          onFileSelected={hourly.handleAttachmentSelected}
          onRemove={hourly.handleRemoveAttachment}
        />
        {selectedType?.requires_attachment && (
          <div className="flex items-center gap-2 -mt-2 text-amber-400" style={{ fontSize: 12 }}>
            {arabicSource("leave.this_type_of_leave_requires_an_attachment_medical_report_etc")}
          </div>
        )}

        <LeaveModalActions
          submitLabel={arabicSource("leave.send_request")}
          saving={saving}
          disabled={submitDisabled}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </ModalOverlay>
  );
};

export default LeaveRequestModal;
