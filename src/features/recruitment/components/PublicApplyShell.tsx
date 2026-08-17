import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/app/providers";
import { getLanguageDirection, normalizeLanguage } from "@/i18n";

type PublicApplyShellProps = {
  children: React.ReactNode;
  companyName?: string;
};

const PublicApplyShell = ({ children, companyName }: PublicApplyShellProps) => {
  const { i18n } = useTranslation();

  const direction = getLanguageDirection(
    normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
  );

  return (
    <div className="min-h-screen bg-background px-4 py-8" dir={direction}>
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-primary" style={{ fontSize: 14 }}>{companyName || ""}</span>
          <LanguageSwitcher />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
};

export default PublicApplyShell;
