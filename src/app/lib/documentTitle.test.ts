/**
 * Tests for document title utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  setDocumentTitle,
  setReportTitle,
  resetDocumentTitle,
  getCurrentCustomTitle,
} from "./documentTitle";
import i18n from "../i18n";

describe("documentTitle utilities", () => {
  let originalTitle: string;

  beforeEach(() => {
    // Save original title
    originalTitle = document.title;
    // Mock i18n.t to return predictable values
    vi.spyOn(i18n, "t").mockImplementation((key: string) => {
      if (key === "shared.human_resources_system") {
        return "Human Resources System";
      }
      return key;
    });
  });

  afterEach(() => {
    // Restore original title
    document.title = originalTitle;
    resetDocumentTitle();
    vi.restoreAllMocks();
  });

  describe("setDocumentTitle", () => {
    it("should set a custom title", () => {
      setDocumentTitle("Test Page");
      expect(document.title).toBe("Test Page");
      expect(getCurrentCustomTitle()).toBe("Test Page");
    });

    it("should handle empty string", () => {
      setDocumentTitle("");
      expect(document.title).toBe("Human Resources System");
    });

    it("should use translation key when specified", () => {
      setDocumentTitle("some.translation.key", true);
      expect(i18n.t).toHaveBeenCalledWith("some.translation.key");
    });
  });

  describe("setReportTitle", () => {
    it("should set report title without date", () => {
      setReportTitle("Punch Audit Report");
      expect(document.title).toBe("Punch Audit Report");
      expect(getCurrentCustomTitle()).toBe("Punch Audit Report");
    });

    it("should set report title with date range", () => {
      setReportTitle("Monthly Attendance", "2026-08-01 to 2026-08-31");
      expect(document.title).toBe("2026-08-01 to 2026-08-31 - Monthly Attendance");
    });

    it("should set report title with month", () => {
      setReportTitle("Payroll Report", "August 2026");
      expect(document.title).toBe("August 2026 - Payroll Report");
    });

    it("should handle Arabic report names", () => {
      setReportTitle("تقرير تدقيق البصمات", "أغسطس 2026");
      expect(document.title).toBe("أغسطس 2026 - تقرير تدقيق البصمات");
    });
  });

  describe("resetDocumentTitle", () => {
    it("should reset to default title", () => {
      setDocumentTitle("Custom Title");
      expect(document.title).toBe("Custom Title");
      
      resetDocumentTitle();
      expect(document.title).toBe("Human Resources System");
      expect(getCurrentCustomTitle()).toBeNull();
    });
  });

  describe("getCurrentCustomTitle", () => {
    it("should return null when no custom title is set", () => {
      resetDocumentTitle();
      expect(getCurrentCustomTitle()).toBeNull();
    });

    it("should return custom title when set", () => {
      setDocumentTitle("My Custom Title");
      expect(getCurrentCustomTitle()).toBe("My Custom Title");
    });
  });

  describe("PDF filename scenarios", () => {
    it("should create proper filename for punch audit report", () => {
      setReportTitle("Punch Audit Report", "01-08-2026 to 31-08-2026");
      const title = document.title;
      
      // Verify the title would create a good PDF filename
      expect(title).toContain("Punch Audit Report");
      expect(title).toContain("01-08-2026 to 31-08-2026");
      expect(title.startsWith("01-08-2026 to 31-08-2026")).toBe(true);
    });

    it("should handle special characters in report names", () => {
      setReportTitle("Employee Report: Q3", "July-September 2026");
      expect(document.title).toContain("Employee Report: Q3");
      expect(document.title).toContain("July-September 2026");
    });
  });
});
