/**
 * Warning attachment endpoints (settings/upload/list/download/delete), split
 * out of `performance.ts` the same way `leaveAttachments.ts` was split out of
 * `leave.ts`. Backend `lugal_hr` 19.0.1.12.12 §2.
 */
import { hrCall } from "./client";
import { mapWarningAttachment, mapWarningAttachmentSettings } from "./mappers";
import type { DbWarningAttachment, DbWarningAttachmentSettings } from "../hooks";
import { eid } from "./httpHelpers";

/** Server-driven size/format limits for the file input — read, never hard-coded. */
export const fetchWarningAttachmentSettings = async (): Promise<DbWarningAttachmentSettings> => {
  const data = await hrCall<any>("/api/hr/warnings/attachment_settings", {});
  return mapWarningAttachmentSettings(data);
};

export const uploadWarningAttachment = async (
  warningId: string | number,
  file: { file_name: string; file_data: string },
): Promise<DbWarningAttachment> => {
  const data = await hrCall<any>(
    `/api/hr/warnings/${eid(warningId)}/attachments/upload`,
    file,
  );
  return mapWarningAttachment(data?.attachment ?? data);
};

export const fetchWarningAttachments = async (
  warningId: string | number,
): Promise<DbWarningAttachment[]> => {
  const data = await hrCall<any>(
    `/api/hr/warnings/${eid(warningId)}/attachments`,
    {},
  );
  const rows = Array.isArray(data) ? data : data?.items || data?.attachments || [];
  return rows.map(mapWarningAttachment);
};

/**
 * Bytes come back base64 in the JSON body: the attachment is not `public`, so
 * `/web/content/<id>` 404s for a browser that sends neither the JWT header nor
 * an Odoo session cookie.
 */
export const downloadWarningAttachment = async (
  warningId: string | number,
  attachmentId: string | number,
): Promise<{ file_name: string; mimetype: string; file_data: string }> => {
  return hrCall(
    `/api/hr/warnings/${eid(warningId)}/attachments/${eid(attachmentId)}/download`,
    {},
  );
};

export const deleteWarningAttachment = async (
  warningId: string | number,
  attachmentId: string | number,
) => {
  return hrCall(
    `/api/hr/warnings/${eid(warningId)}/attachments/${eid(attachmentId)}/delete`,
    {},
  );
};
