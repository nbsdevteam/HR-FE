/**
 * Leave attachment endpoints (upload/list/download/delete). Split out of
 * `leave.ts` to keep both files inside the 300-line limit.
 */
import { hrCall } from "./client";
import { mapLeaveAttachment } from "./mappers";
import type { DbLeaveAttachment } from "../hooks";
import { eid } from "./httpHelpers";

export const uploadLeaveAttachment = async (
  leaveId: string | number,
  file: { file_name: string; file_data: string },
): Promise<DbLeaveAttachment> => {
  const data = await hrCall<any>(
    `/api/hr/leave/${eid(leaveId)}/attachments/upload`,
    file,
  );
  return mapLeaveAttachment(data?.attachment);
};

export const fetchLeaveAttachments = async (
  leaveId: string | number,
): Promise<DbLeaveAttachment[]> => {
  const data = await hrCall<any>(
    `/api/hr/leave/${eid(leaveId)}/attachments`,
    {},
  );
  const rows = Array.isArray(data) ? data : data?.items || [];
  return rows.map(mapLeaveAttachment);
};

export const downloadLeaveAttachment = async (
  leaveId: string | number,
  attachmentId: string | number,
): Promise<{ file_name: string; mimetype: string; file_data: string }> => {
  return hrCall(
    `/api/hr/leave/${eid(leaveId)}/attachments/${eid(attachmentId)}/download`,
    {},
  );
};

export const deleteLeaveAttachment = async (
  leaveId: string | number,
  attachmentId: string | number,
) => {
  return hrCall(
    `/api/hr/leave/${eid(leaveId)}/attachments/${eid(attachmentId)}/delete`,
    {},
  );
};
