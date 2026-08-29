import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { changeLanguage } from "@/i18n";
import { translateArabicSource } from "@/i18n/legacy";
import LocalizationProvider from "@/i18n/LocalizationProvider";
import type { OrgNode } from "../types";
import DirectReportRow from "./DirectReportRow";

/**
 * A backend record whose Arabic contains whole catalogued words ("قسم",
 * "المبيعات"). Those still resolve through the localizer's fragment pass, so
 * without an explicit opt-out the org chart renders job titles and departments
 * half-translated. Only `data-i18n-ignore` can say "this is data, not copy".
 */
const NODE: OrgNode = {
  id: 1,
  dbId: "emp-1",
  name: "سالم عبد الله",
  initials: "س",
  position: "مدير قسم المبيعات",
  department: "المبيعات",
  color: "#8B5CF6",
  photo: null,
  email: null,
  children: [],
};

const renderRow = () =>
  render(
    createElement(
      LocalizationProvider,
      null,
      createElement(DirectReportRow, { node: NODE }),
    ),
  );

describe("DirectReportRow backend names under the DOM localizer", () => {
  afterEach(async () => {
    await changeLanguage("ar");
  });

  it("would be rewritten by the localizer if left unguarded", () => {
    // Guards the test itself: if these ever stop differing, the assertions
    // below would pass for the wrong reason.
    expect(translateArabicSource(NODE.position, "en")).not.toBe(NODE.position);
    expect(translateArabicSource(NODE.department, "en")).not.toBe(NODE.department);
  });

  it.each(["en", "ku"] as const)(
    "renders backend names verbatim in %s",
    async (language) => {
      renderRow();
      await changeLanguage(language);
      await waitFor(() => {
        expect(screen.getByText(NODE.position)).toBeInTheDocument();
      });
      expect(screen.getByText(NODE.name)).toBeInTheDocument();
    },
  );
});
