import { memo, useCallback } from "react";
import { Download, FileText } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { handleDownloadResume } from "../utils/resumeDownload";

type ApplicantResumeCardProps = {
  applicantId: string;
};

const ApplicantResumeCard = ({ applicantId }: ApplicantResumeCardProps) => {
  const handleDownloadResumeClick = useCallback(() => {
    void handleDownloadResume(applicantId);
  }, [applicantId]);

  return (
    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
      <button type="button" onClick={handleDownloadResumeClick}
        className="flex items-center gap-2 text-emerald-400 hover:underline cursor-pointer">
        <FileText className="w-4 h-4" />
        <span style={{ fontSize: 13 }}>{arabicSource("recruitment.download_cv")}</span>
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};

export default memo(ApplicantResumeCard);
