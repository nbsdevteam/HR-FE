import { useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, Briefcase } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { Button, DataTable, EmptyState, SearchInput, TableHeaderRow } from "@/shared/components";
import {
  EMPLOYEE_LIFECYCLE_KEY,
  empDisplayName,
  type DbContractType,
  type DbEmployee,
  type DbEmployeeContract,
} from "@/shared/hooks";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import { localizedAlert } from "@/i18n/native";
import { useExitRedirect } from "../hooks/useExitRedirect";
import { errorMessage } from "../utils/errorMessage";
import {
  lifecycleCardClass as cardCls,
  lifecycleInputClass as inputCls,
} from "../styles/lifecycle";
import type { EmployeeMap } from "../types/lifecycle";
import ContractFormPanel, { type ContractFormData } from "./ContractFormPanel";
import ContractTableRow from "./ContractTableRow";
import ExitRedirectDialog from "./ExitRedirectDialog";

const CONTRACTS_TABLE_HEADINGS = [
  arabicSource("common.employee"),
  arabicSource("lifecycle.contract_type"),
  arabicSource("common.contract_number"),
  arabicSource("common.start_date"),
  arabicSource("common.end_date"),
  arabicSource("common.probation_period"),
  arabicSource("common.status"),
  arabicSource("common.procedures"),
];

const EMPTY_CONTRACT_FORM: ContractFormData = {
  employee_id: "",
  contract_type_id: "",
  start_date: "",
  end_date: "",
  salary_amount: 0,
  salary_currency: "IQD",
  contract_number: "",
  notes: "",
};

const ContractsTab = ({
  contracts,
  contractTypes,
  empMap,
  employees,
  employeeLabels,
  refetch,
  search,
  onSearchChange,
  statusLabels,
  statusColors,
}: {
  contracts: DbEmployeeContract[];
  contractTypes: DbContractType[];
  empMap: EmployeeMap;
  employees: DbEmployee[];
  employeeLabels: Record<string, string>;
  refetch: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] =
    useState<ContractFormData>(EMPTY_CONTRACT_FORM);
  const [saving, setSaving] = useState(false);

  const { closeRedirect, confirmRedirect, redirectTarget, requestRedirect } = useExitRedirect();
  // A contract change can move the employee's lifecycle summary (current contract, exit actions).
  const createContractMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createContract(payload),
    ["contracts", EMPLOYEE_LIFECYCLE_KEY],
  );
  const updateContractMutation = useOdooMutation(
    (variables: { id: string; payload: Record<string, unknown> }) =>
      odooData.updateContract(variables.id, variables.payload),
    ["contracts", EMPLOYEE_LIFECYCLE_KEY],
  );

  const contractTypeById = useMemo(
    () => new Map(contractTypes.map((t) => [t.id, t])),
    [contractTypes],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return contracts.filter((c) => {
      if (!normalizedSearch) return true;
      const emp = empMap[c.employee_id];
      const name = emp ? empDisplayName(emp) : "";
      return name.toLowerCase().includes(normalizedSearch);
    });
  }, [contracts, search, empMap]);

  const handleCreate = useCallback(async () => {
    if (
      !formData.employee_id ||
      !formData.contract_type_id ||
      !formData.start_date
    )
      return;
    setSaving(true);

    const ct = contractTypeById.get(formData.contract_type_id);

    // Calendar-day arithmetic (avoid UTC shift from toISOString).
    const probEnd = (() => {
      if (!ct || !(ct.probation_days > 0) || !formData.start_date) return null;
      const [y, m, d] = formData.start_date.split("-").map(Number);
      const end = new Date(y, m - 1, d + Number(ct.probation_days));
      return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    })();

    try {
      await createContractMutation.mutateAsync({
        ...formData,
        salary_amount: formData.salary_amount || null,
        end_date: formData.end_date || null,
        probation_end_date: probEnd,
        probation_status: probEnd ? "pending" : "waived",
        status: "active",
      });
      setShowForm(false);
      setFormData(EMPTY_CONTRACT_FORM);
    } catch (e) {
      console.error(e);
      localizedAlert("خطأ في حفظ العقد " + errorMessage(e));
    }
    setSaving(false);
  }, [formData, contractTypeById, createContractMutation.mutateAsync]);

  const handleProbation = useCallback(
    async (contractId: string, status: "passed" | "failed") => {
      try {
        await updateContractMutation.mutateAsync({ id: contractId, payload: { probation_status: status } });
      } catch (e) {
        console.error(e);
        localizedAlert("خطأ في تحديث حالة التجربة " + errorMessage(e));
      }
    },
    [updateContractMutation.mutateAsync],
  );

  // Terminating the contract of someone with HR history is refused with
  // `use_end_of_service` (or `exit_process_open`): End of Service is the exit path.
  const handleTerminate = useCallback(
    async (contractId: string) => {
      const contract = contracts.find((c) => c.id === contractId);
      try {
        await updateContractMutation.mutateAsync({ id: contractId, payload: { status: "terminated" } });
      } catch (e) {
        const employeeId = contract?.employee_id ?? "";
        const employee = empMap[employeeId];
        if (requestRedirect(e, employeeId, employee ? empDisplayName(employee) : "")) return;
        console.error(e);
        localizedAlert("خطأ في إنهاء العقد " + errorMessage(e));
      }
    },
    [contracts, empMap, requestRedirect, updateContractMutation.mutateAsync],
  );

  const closeForm = useCallback(() => setShowForm(false), []);
  const toggleForm = useCallback(() => setShowForm((v) => !v), []);

  const renderContractRow = useCallback(
    (c: DbEmployeeContract, i: number) => (
      <ContractTableRow
        key={c.id}
        contract={c}
        index={i}
        emp={empMap[c.employee_id]}
        contractType={contractTypeById.get(c.contract_type_id)}
        statusLabels={statusLabels}
        statusColors={statusColors}
        onProbationUpdate={handleProbation}
        onTerminate={handleTerminate}
      />
    ),
    [empMap, contractTypeById, statusLabels, statusColors, handleProbation, handleTerminate],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={arabicSource("lifecycle.search_by_name")}
          wrapperClassName="relative flex-1 max-w-md"
          inputClassName={`${inputCls} ps-10`}
        />
        <Button
          size="lg"
          icon={Plus}
          onClick={toggleForm}
          className="shadow-lg shadow-primary/20"
        >
          {arabicSource("common.new_contract")}
        </Button>
      </div>

      {/* New Contract Form */}
      <AnimatePresence>
        {showForm && (
          <ContractFormPanel
            formData={formData}
            setFormData={setFormData}
            employees={employees}
            employeeLabels={employeeLabels}
            contractTypes={contractTypes}
            onSave={handleCreate}
            onCancel={closeForm}
            saving={saving}
            cardCls={cardCls}
            inputCls={inputCls}
          />
        )}
      </AnimatePresence>

      {/* Contracts List */}
      <DataTable
        wrapperClassName={cardCls}
        items={filtered}
        header={<TableHeaderRow headings={CONTRACTS_TABLE_HEADINGS} />}
        renderRow={renderContractRow}
        emptyRow={
          <tr>
            <td colSpan={8}>
              <EmptyState
                icon={Briefcase}
                message={arabicSource("lifecycle.no_contracts")}
              />
            </td>
          </tr>
        }
      />

      <AnimatePresence>
        {redirectTarget && (
          <ExitRedirectDialog target={redirectTarget} onConfirm={confirmRedirect} onClose={closeRedirect} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContractsTab;
