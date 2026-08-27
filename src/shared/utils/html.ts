export const stripHtmlTags = (value: string | null | undefined): string => {
  if (!value) return "";

  const withBreaks = value
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  if (typeof DOMParser === "undefined") {
    return withBreaks.replace(/<[^>]*>/g, "").replace(/\n{3,}/g, "\n\n").trim();
  }

  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
};
