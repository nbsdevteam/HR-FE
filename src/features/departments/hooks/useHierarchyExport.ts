import { useCallback, useRef } from "react";
import i18n, { getLanguageDirection, normalizeLanguage } from "@/i18n";
import { formatDate } from "@/i18n/format";
import { translateArabicSource } from "@/i18n/legacy";
import { arabicSource } from "@/i18n/source";

/**
 * Owns the ref to the rendered chart plus the print / PNG exporters that read
 * from it, so callers never have to wire the ref up themselves.
 */
export const useHierarchyExport = () => {
  const chartContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!chartContentRef.current) return;
    const w = window.open("", "_blank"); if (!w) return;
    const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
    const direction = getLanguageDirection(language);
    const title = translateArabicSource(arabicSource("common.organizational_structure"), language);
    const subtitle = translateArabicSource(arabicSource("exports.organization_subtitle"), language);
    const footer = translateArabicSource(arabicSource("exports.created_on"), language);
    const product = translateArabicSource(arabicSource("shared.human_resources_system"), language);
    w.document.write(`<!DOCTYPE html><html dir="${direction}" lang="${language}"><head><meta charset="UTF-8"><title>${title}</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;font-family:'Tajawal',sans-serif}body{background:#fff;padding:40px 20px;direction:${direction}}
      .ph{text-align:center;margin-bottom:30px;border-bottom:2px solid #e5e7eb;padding-bottom:20px}
      .ph h1{font-size:24px;color:#1f2937}.ph p{font-size:14px;color:#6b7280;margin-top:5px}
      .pf{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af}
      @media print{body{padding:10px}@page{size:landscape;margin:15mm}}</style></head>
      <body><div class="ph"><h1>${title}</h1><p>${subtitle}</p></div>
      <div style="overflow:auto">${chartContentRef.current.innerHTML}</div>
      <div class="pf">${footer} ${formatDate(new Date())} — ${product}</div></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 500);
  }, []);

  const handleExportPNG = useCallback(async () => {
    if (!chartContentRef.current) return;
    try {
      const exportLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
      const exportDirection = getLanguageDirection(exportLanguage);
      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d"); if (!ctx) return;
      const el = chartContentRef.current; const scale = 2;
      canvas.width = el.scrollWidth * scale; canvas.height = el.scrollHeight * scale;
      const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${el.scrollWidth}" height="${el.scrollHeight}">
        <foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="background:#0F0F0F;color:#FFF8E1;font-family:Tajawal,sans-serif;direction:${exportDirection}">${el.innerHTML}</div></foreignObject></svg>`;
      const img = new Image(); const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob);
      img.onload = () => { ctx.scale(scale, scale); ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url);
        canvas.toBlob(b => { if (!b) return; const a = document.createElement("a"); a.download = `${translateArabicSource(arabicSource("common.organizational_structure")).replace(/\s+/g, "-")}-${formatDate(new Date()).replace(/[\\/:]/g, "-")}.png`; a.href = URL.createObjectURL(b); a.click(); URL.revokeObjectURL(a.href); }); };
      img.onerror = () => { URL.revokeObjectURL(url); handlePrint(); }; img.src = url;
    } catch { handlePrint(); }
  }, [handlePrint]);

  return { chartContentRef, handlePrint, handleExportPNG };
};
