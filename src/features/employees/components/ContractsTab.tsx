import { useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, Search, Briefcase } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import {
  empDisplayName,
  type DbContractType,
  type DbEmployeeContract,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import {
  lifecycleCardClass as cardCls,
  lifecycleInputClass as inputCls,
} from "../styles/lifecycle";
import ContractFormPanel, { type ContractFormData } from "./ContractFormPanel";
import ContractTableRow from "./ContractTableRow";

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
  empMap: Record<string, any>;
  employees: any[];
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

  const contractTypeById = useMemo(
    () => new Map(contractTypes.map((t) => [t.id, t])),
    [contractTypes],
  );

  const filtered = useMemo(
    () =>
      contracts.filter((c) => {
        if (!search) return true;
        const emp = empMap[c.employee_id];
        const name = emp ? empDisplayName(emp) : "";
        return name.includes(search);
      }),
    [contracts, search, empMap],
  );

  const handleCreate = useCallback(async () => {
    if (
      !formData.employee_id ||
      !formData.contract_type_id ||
      !formData.start_date
    )
      return;
    setSaving(true);

    const ct = contractTypes.find((t) => t.id === formData.contract_type_id);

    // Calendar-day arithmetic (avoid UTC shift from toISOString).
    const probEnd = (() => {
      if (!ct || !(ct.probation_days > 0) || !formData.start_date) return null;
      const [y, m, d] = formData.start_date.split("-").map(Number);
      const end = new Date(y, m - 1, d + Number(ct.probation_days));
      return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    })();

    try {
      await odooData.createContract({
        ...formData,
        salary_amount: formData.salary_amount || null,
        end_date: formData.end_date || null,
        probation_end_date: probEnd,
        probation_status: probEnd ? "pending" : "waived",
        status: "active",
      });
      refetch();
      setShowForm(false);
      setFormData(EMPTY_CONTRACT_FORM);
    } catch (e) {
      console.error(e);
      alert("خطأ في حفظ العقد");
    }
    setSaving(false);
  }, [formData, contractTypes, refetch]);

  const handleProbation = useCallback(
    async (contractId: string, status: "passed" | "failed") => {
      try {
        await odooData.updateContract(contractId, { probation_status: status });
        refetch();
      } catch (e) {
        console.error(e);
        alert("خطأ في تحديث حالة التجربة");
      }
    },
    [refetch],
  );

  const handleTerminate = useCallback(
    async (contractId: string) => {
      try {
        await odooData.updateContract(contractId, { status: "terminated" });
        refetch();
      } catch (e) {
        console.error(e);
        alert("خطأ في إنهاء العقد");
      }
    },
    [refetch],
  );

  const closeForm = useCallback(() => setShowForm(false), []);
  const toggleForm = useCallback(() => setShowForm((v) => !v), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={arabicSource("lifecycle.search_by_name")}
            className={`${inputCls} ps-10`}
          />
        </div>
        <button
          onClick={toggleForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
          style={{ fontSize: 13 }}
        >
          <Plus className="w-4 h-4" /> {arabicSource("common.new_contract")}
        </button>
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
        renderRow={(c, i) => (
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
        )}
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
    </div>
  );
};

export default ContractsTab;
