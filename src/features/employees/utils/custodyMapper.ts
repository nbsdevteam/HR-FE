import type { DbCustody } from "@/shared/hooks";
import type { Custody, CustodyStatus } from "../types";

const CUSTODY_STATUSES: readonly CustodyStatus[] = ["active", "returned", "damaged", "lost"];

const toCustodyStatus = (status: string): CustodyStatus =>
  (CUSTODY_STATUSES as readonly string[]).includes(status) ? (status as CustodyStatus) : "active";

export const toCustody = (row: DbCustody): Custody => ({
  id: row.id,
  item: row.item,
  description: row.description,
  dateReceived: row.date_received || "",
  ...(row.serial_number ? { serialNumber: row.serial_number } : {}),
  status: toCustodyStatus(row.status),
  notes: row.notes,
  returnDate: row.return_date,
});

export const toCustodies = (rows: readonly DbCustody[]): Custody[] => rows.map(toCustody);
