/** Strips a `data:image/...;base64,` prefix so a stored photo can be resent as raw base64 (device-sync expects no prefix). */
export const stripDataUrlPrefix = (photo: string | null | undefined): string | null => {
  if (!photo) return null;
  const idx = photo.indexOf("base64,");
  return idx >= 0 ? photo.slice(idx + "base64,".length) : photo;
};
