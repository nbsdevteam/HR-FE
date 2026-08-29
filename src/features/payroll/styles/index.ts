import { arabicSource } from "@/i18n/source";

export const dayNamesAr: Record<string, string> = {
  sunday: arabicSource("common.sunday_2"),
  monday: arabicSource("common.monday"),
  tuesday: arabicSource("common.tuesday"),
  wednesday: arabicSource("common.wednesday"),
  thursday: arabicSource("common.thursday"),
  friday: arabicSource("common.friday"),
  saturday: arabicSource("common.saturday"),
};

export const payrollCardClass = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";
export const payrollInputClass = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";
export const payrollSelectClass = payrollInputClass;
