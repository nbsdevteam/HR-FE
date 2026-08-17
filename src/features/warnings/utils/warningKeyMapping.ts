import { ODOO_WARNING_STATUS_KEYS, ODOO_WARNING_TYPE_KEYS } from "../constants/warnings";

export const typeKeyToLabel = (key: string, warningTypes: string[]): string => {
  const idx = ODOO_WARNING_TYPE_KEYS.indexOf(key);
  return idx >= 0 ? (warningTypes[idx] || key) : key;
};

export const typeLabelToKey = (label: string, warningTypes: string[]): string => {
  const idx = warningTypes.indexOf(label);
  return idx >= 0 ? (ODOO_WARNING_TYPE_KEYS[idx] || "verbal") : "verbal";
};

export const statusKeyToLabel = (key: string, warningStatuses: string[]): string => {
  const idx = ODOO_WARNING_STATUS_KEYS.indexOf(key);
  return idx >= 0 ? (warningStatuses[idx] || key) : key;
};

export const statusLabelToKey = (label: string, warningStatuses: string[]): string => {
  const idx = warningStatuses.indexOf(label);
  return idx >= 0 ? (ODOO_WARNING_STATUS_KEYS[idx] || "active") : "active";
};
