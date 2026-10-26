import { arabicSource } from "@/i18n/source";

type EmployeeSaveErrorBannerProps = {
  message: string;
};

const EmployeeSaveErrorBanner = ({ message }: EmployeeSaveErrorBannerProps) => (
  <div
    className="shrink-0 mx-6 mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
    style={{ fontSize: 13 }}
  >
    {arabicSource("shared.error_saving")} {message}
  </div>
);

export default EmployeeSaveErrorBanner;
