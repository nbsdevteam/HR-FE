import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, UserCheck } from "lucide-react";
import { DatePicker, Modal, ModalFooterActions, Select } from "@/shared/components";
import type { RehireContractInput } from "@/shared/api/odooData";
import { useContractTypes } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { RehireState } from "../hooks/useEmployeeStatusActions";
import FormFieldLabel from "./FormFieldLabel";
import EmployeeRehireContractSummary from "./EmployeeRehireContractSummary";

type EmployeeRehireDialogProps = {
  state: RehireState;
  saving: boolean;
  onSubmit: (contract: RehireContractInput) => void;
  onClose: () => void;
};

/**
 * Restoring an employee whose End of Service completed is a rehire: the backend
 * wants a new contract start date before it reactivates them, and answers with
 * the contract it created — which this dialog then shows.
 */
const EmployeeRehireDialog = ({ state, saving, onSubmit, onClose }: EmployeeRehireDialogProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contractTypeId, setContractTypeId] = useState("");
  const { types } = useContractTypes();

  const typeOptions = useMemo(
    () => types.map(type => ({ value: type.id, label: type.name_ar || type.name_en || type.code })),
    [types],
  );

  const handleConfirm = useCallback((): void => {
    if (!startDate) return;
    onSubmit({ start_date: startDate, end_date: endDate || null, contract_type_id: contractTypeId || null });
  }, [contractTypeId, endDate, onSubmit, startDate]);

  if (state.contract) {
    return (
      <Modal
        onClose={onClose}
        icon={CheckCircle2}
        title={arabicSource("employees.rehire_success_title")}
        subtitle={state.employee.name}
        footer={<ModalFooterActions onCancel={onClose} onConfirm={onClose} confirmLabel={arabicSource("common.close")} />}
      >
        <EmployeeRehireContractSummary contract={state.contract} contractTypeOptions={typeOptions} />
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      icon={UserCheck}
      title={arabicSource("employees.rehire_title")}
      subtitle={state.employee.name}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={arabicSource("employees.rehire_confirm")}
          confirmIcon={UserCheck}
          disabled={!startDate || saving}
          cancelDisabled={saving}
          loading={saving}
        />
      }
    >
      <p className="text-muted-foreground" style={{ fontSize: 14 }}>{arabicSource("employees.rehire_message")}</p>
      <div>
        <FormFieldLabel>{arabicSource("employees.rehire_contract_start_date")}</FormFieldLabel>
        <DatePicker value={startDate} onChange={setStartDate} className="w-full" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("common.end_date")}</FormFieldLabel>
        <DatePicker value={endDate} onChange={setEndDate} className="w-full" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.contract_type")}</FormFieldLabel>
        <Select
          value={contractTypeId}
          onChange={setContractTypeId}
          options={typeOptions}
          blankLabel={arabicSource("common.not_specified")}
          optionsAreData
          className="w-full"
        />
      </div>
    </Modal>
  );
};

export default EmployeeRehireDialog;
