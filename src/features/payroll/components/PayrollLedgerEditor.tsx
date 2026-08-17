import { Loader2, Pencil, Save, Plus, Minus } from "lucide-react";
import type { DbMonthlyLedger } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { payrollCardClass as cardCls } from "../styles";
import PayrollLedgerRow from "./PayrollLedgerRow";

type PayrollLedgerEditorProps = {
  ledgerCurrency: "IQD" | "USD";
  onLedgerCurrencyChange: (currency: "IQD" | "USD") => void;
  editingLedger: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  ledgerSaving: boolean;
  ledgerLoan: number;
  onLedgerLoanChange: (value: number) => void;
  ledgerTip: number;
  onLedgerTipChange: (value: number) => void;
  ledgerPenalty: number;
  onLedgerPenaltyChange: (value: number) => void;
  currentLedger: DbMonthlyLedger | undefined;
};

const PayrollLedgerEditor = ({
  ledgerCurrency,
  onLedgerCurrencyChange,
  editingLedger,
  onStartEdit,
  onCancelEdit,
  onSave,
  ledgerSaving,
  ledgerLoan,
  onLedgerLoanChange,
  ledgerTip,
  onLedgerTipChange,
  ledgerPenalty,
  onLedgerPenaltyChange,
  currentLedger,
}: PayrollLedgerEditorProps) => {
  const otherCurrency = ledgerCurrency === "IQD" ? "USD" : "IQD";
  const otherLoan = currentLedger?.loan_by_currency?.[otherCurrency] || 0;
  const otherTip = currentLedger?.tip_by_currency?.[otherCurrency] || 0;
  const otherPenalty = currentLedger?.penalty_by_currency?.[otherCurrency] || 0;

  return (
    <div className={`${cardCls} p-6`}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Pencil className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">{arabicSource("payroll.monthly_adjustments")}</h3>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.advances_rewards_and_penalties")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border/40 p-0.5 bg-muted/10">
            {(["IQD", "USD"] as const).map((cur) => (
              <button
                key={cur}
                onClick={() => onLedgerCurrencyChange(cur)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  ledgerCurrency === cur
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontSize: 12 }}
              >
                {cur}
              </button>
            ))}
          </div>
          {!editingLedger ? (
            <button
              onClick={onStartEdit}
              className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
              style={{ fontSize: 12 }}
            >
              <Pencil className="w-3.5 h-3.5" /> {arabicSource("common.edit")}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/20 transition-colors cursor-pointer"
                style={{ fontSize: 12 }}
              >
                {arabicSource("common.cancel")}
              </button>
              <button
                onClick={onSave}
                disabled={ledgerSaving}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                style={{ fontSize: 12 }}
              >
                {ledgerSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {arabicSource("common.save")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <PayrollLedgerRow
          label={arabicSource("common.advance")}
          value={ledgerLoan}
          onChange={onLedgerLoanChange}
          icon={Minus}
          isCredit={false}
          color="text-destructive"
          otherVal={otherLoan}
          otherCurrency={otherCurrency}
          editing={editingLedger}
          currency={ledgerCurrency}
        />
        <PayrollLedgerRow
          label={arabicSource("common.gratuity_tip")}
          value={ledgerTip}
          onChange={onLedgerTipChange}
          icon={Plus}
          isCredit={true}
          color="text-emerald-400"
          otherVal={otherTip}
          otherCurrency={otherCurrency}
          editing={editingLedger}
          currency={ledgerCurrency}
        />
        <PayrollLedgerRow
          label={arabicSource("payroll.penalty")}
          value={ledgerPenalty}
          onChange={onLedgerPenaltyChange}
          icon={Minus}
          isCredit={false}
          color="text-destructive"
          otherVal={otherPenalty}
          otherCurrency={otherCurrency}
          editing={editingLedger}
          currency={ledgerCurrency}
        />
      </div>
    </div>
  );
};

export default PayrollLedgerEditor;
