import * as odooData from "@/shared/api/odooData";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";

export const handleDownloadResume = async (applicantId: string) => {
  try {
    await odooData.downloadApplicantResume(applicantId);
  } catch (error: any) {
    localizedAlert(error?.message || arabicSource("common.error"));
  }
};
