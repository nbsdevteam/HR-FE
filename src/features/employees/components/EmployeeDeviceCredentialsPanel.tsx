import type { ChangeEvent } from "react";
import { CreditCard, Fingerprint } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button } from "@/shared/components";
import type { Employee } from "../types";
import EmployeeDeviceEnrollmentBanner from "./EmployeeDeviceEnrollmentBanner";
import LabeledInput from "./LabeledInput";

type EmployeeDeviceCredentialsPanelProps = {
  employee: Employee;
  cardNumberDraft: string;
  setCardNumberDraft: (value: string) => void;
  showCardInput: boolean;
  setShowCardInput: (value: boolean) => void;
  credentialSyncing: boolean;
  credentialError: string | null;
  handleEnrolCard: () => void;
  handleEnrolFingerprint: () => void;
  handleRetryEnrollment: () => void;
};

const EmployeeDeviceCredentialsPanel = ({
  employee,
  cardNumberDraft,
  setCardNumberDraft,
  showCardInput,
  setShowCardInput,
  credentialSyncing,
  credentialError,
  handleEnrolCard,
  handleEnrolFingerprint,
  handleRetryEnrollment,
}: EmployeeDeviceCredentialsPanelProps) => {
  const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setCardNumberDraft(e.target.value);
  };

  const handleToggleCardInput = (): void => {
    setShowCardInput(!showCardInput);
  };

  if (!employee.deviceEmployeeNo) return null;

  const enrollment = employee.deviceEnrollment;
  const showRetry = Boolean(enrollment?.retry_required || enrollment?.state === "partial" || enrollment?.state === "failed");

  return (
    <div className="px-6 pb-4 space-y-3">
      <EmployeeDeviceEnrollmentBanner
        enrollment={enrollment}
        syncing={credentialSyncing}
        onRetry={showRetry && !employee.readOnly ? handleRetryEnrollment : undefined}
        retrying={credentialSyncing}
      />
      {credentialError && (
        <p className="text-destructive" style={{ fontSize: 12 }}>{credentialError}</p>
      )}
      {!employee.readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          {showCardInput ? (
            <div className="flex items-end gap-2">
              <LabeledInput
                label={arabicSource("devicemanagement.card_number")}
                type="text"
                dir="ltr"
                value={cardNumberDraft}
                onChange={handleCardNumberChange}
                placeholder={arabicSource("employees.enter_the_card_number")}
              />
              <Button onClick={handleEnrolCard} loading={credentialSyncing} className="h-11">
                {arabicSource("employees.enrol_card")}
              </Button>
            </div>
          ) : (
            <Button variant="outline" icon={CreditCard} onClick={handleToggleCardInput} className="h-9 px-3 text-xs">
              {arabicSource("employees.enrol_card")}
            </Button>
          )}
          <Button variant="outline" icon={Fingerprint} onClick={handleEnrolFingerprint} loading={credentialSyncing} className="h-9 px-3 text-xs">
            {arabicSource("employees.enrol_fingerprint")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployeeDeviceCredentialsPanel;
