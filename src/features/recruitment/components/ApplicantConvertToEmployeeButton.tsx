import { memo } from "react";
import { motion } from "motion/react";
import { UserPlus } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type ApplicantConvertToEmployeeButtonProps = {
  onClick: () => void;
};

const ApplicantConvertToEmployeeButton = ({ onClick }: ApplicantConvertToEmployeeButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className="w-full py-3 rounded-xl bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
    style={{ fontSize: 14 }}
  >
    <UserPlus className="w-5 h-5" />
    {arabicSource("recruitment.transfer_to_employee_attach_to_the_system")}
  </motion.button>
);

export default memo(ApplicantConvertToEmployeeButton);
