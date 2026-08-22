import { useCallback } from "react";
import { AlertTriangle, Fingerprint, Loader2, ScanFace, ShieldOff } from "lucide-react";
import { ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import EmployeeTerminationOptionRow from "./EmployeeTerminationOptionRow";

type TerminationOptions = { removeFace: boolean; removeFingerprint: boolean; removePerson: boolean };

type EmployeeTerminationDialogProps = {
  terminationOptions: TerminationOptions;
  onToggleOption: (key: keyof TerminationOptions, checked: boolean) => void;
  terminationLoading: boolean;
  terminationResult: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

const EmployeeTerminationDialog = ({
  terminationOptions,
  onToggleOption,
  terminationLoading,
  terminationResult,
  onConfirm,
  onClose,
}: EmployeeTerminationDialogProps) => {
  const options = [
    { key: "removeFace" as const, label: arabicSource("shared.remove_face_image"), icon: ScanFace, desc: arabicSource("shared.delete_facial_recognition_data") },
    { key: "removeFingerprint" as const, label: arabicSource("shared.removing_fingerprints"), icon: Fingerprint, desc: arabicSource("shared.delete_fingerprint_data") },
    { key: "removePerson" as const, label: arabicSource("shared.delete_the_account_from_the_device_completely"), icon: ShieldOff, desc: arabicSource("shared.permanently_remove_the_employee_from_the_fingerprint_device") },
  ];

  const handleBackdropClose = useCallback(
    () => !terminationLoading && onClose(),
    [terminationLoading, onClose],
  );

  return (
    <ModalOverlay
      onClose={handleBackdropClose}
      overlayClassName="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl"
      contentMotionProps={{
        initial: { scale: 0.9 },
        animate: { scale: 1 },
        exit: { scale: 0.9 },
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
          <ShieldOff className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-foreground">{arabicSource("shared.termination_of_employee_service")}</h3>
          <p className="text-xs text-muted-foreground">{arabicSource("shared.do_you_want_to_remove_employee_data_from_the_fingerprint_device")}</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-4">
        <p className="text-xs text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {arabicSource("shared.all_employee_data_attendance_records_evaluations_salaries_will_r")}
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {options.map(opt => (
          <EmployeeTerminationOptionRow
            key={opt.key}
            label={opt.label}
            desc={opt.desc}
            icon={opt.icon}
            checked={terminationOptions[opt.key]}
            onChange={(checked) => onToggleOption(opt.key, checked)}
          />
        ))}
      </div>

      {terminationResult && (
        <div className={`p-3 rounded-lg border mb-4 text-sm ${
          terminationResult.includes(arabicSource("common.done")) ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"
        }`}>
          {terminationResult}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={terminationLoading || (!terminationOptions.removeFace && !terminationOptions.removeFingerprint && !terminationOptions.removePerson)}
          className="flex-1 h-10 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {terminationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
          {terminationLoading ? arabicSource("shared.removing") : arabicSource("shared.confirm_removal")}
        </button>
        <button
          onClick={onClose}
          disabled={terminationLoading}
          className="flex-1 h-10 rounded-lg border border-border text-muted-foreground hover:bg-muted/20 transition-colors text-sm disabled:opacity-50"
        >
          {arabicSource("shared.skip_keep_access")}
        </button>
      </div>
    </ModalOverlay>
  );
};

export default EmployeeTerminationDialog;
