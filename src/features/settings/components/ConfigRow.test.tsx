import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { changeLanguage } from "@/i18n";
import LocalizationProvider from "@/i18n/LocalizationProvider";
import type { DbConfiguration } from "@/shared/hooks";
import ConfigRow from "./ConfigRow";

const NOOP = vi.fn();
const LATIN = /[A-Za-z]/;
const ARABIC = /[؀-ۿ]/;

const config = (overrides: Partial<DbConfiguration>): DbConfiguration =>
  ({
    id: "cfg-1",
    config_key: "attendance.absence_basis",
    config_value: "26",
    value_type: "number",
    category: "attendance",
    label_ar: "",
    label_en: "",
    description_ar: null,
    min_value: null,
    max_value: null,
    options: null,
    sort_order: 1,
    ...overrides,
  }) as DbConfiguration;

/** A seeded row: its Arabic is catalogued, so all three languages resolve. */
const CATALOGUED = config({
  label_ar: "أساس حساب الغياب",
  label_en: "Absence Calculation Basis",
  description_ar: "طريقة حساب خصم الغياب من الراتب",
});

/**
 * A row added to the database after the catalogue was written. Its Arabic
 * contains catalogued words ("عدد", "الموظف"), which is exactly what the DOM
 * localizer's fragment pass used to chew on.
 */
const UNCATALOGUED = config({
  id: "cfg-2",
  config_key: "custom.threshold",
  label_ar: "عدد أيام تنبيه الموظف المخصص",
  label_en: "",
  description_ar: "حد مخصص لعدد أيام تنبيه الموظف قبل الاستحقاق",
});

const renderRow = (value: DbConfiguration) =>
  render(
    createElement(
      LocalizationProvider,
      null,
      createElement(ConfigRow, {
        config: value,
        currentValue: value.config_value,
        hasChanged: false,
        onEdit: NOOP,
        onSave: NOOP,
      }),
    ),
  );

/** The label + description block, which is the part that must stay one language. */
const rowText = (container: HTMLElement): string =>
  container.querySelector("[data-i18n-ignore]")?.textContent ?? "";

describe("ConfigRow settings copy", () => {
  afterEach(async () => {
    await changeLanguage("ar");
  });

  it("resolves a catalogued row into English", async () => {
    const { container } = renderRow(CATALOGUED);
    await changeLanguage("en");
    await waitFor(() => {
      expect(screen.getByText("Absence Calculation Basis")).toBeInTheDocument();
    });
    expect(
      screen.getByText("How to calculate absence deduction from salary"),
    ).toBeInTheDocument();
    expect(ARABIC.test(rowText(container))).toBe(false);
  });

  it.each(["en", "ku"] as const)(
    "leaves an uncatalogued row wholly Arabic in %s rather than mixing it",
    async (language) => {
      const { container } = renderRow(UNCATALOGUED);
      await changeLanguage(language);
      await waitFor(() => {
        expect(screen.getByText(UNCATALOGUED.label_ar)).toBeInTheDocument();
      });
      expect(
        screen.getByText(UNCATALOGUED.description_ar as string),
      ).toBeInTheDocument();
      expect(LATIN.test(rowText(container))).toBe(false);
    },
  );

  it("keeps Arabic mode on the Arabic columns", async () => {
    renderRow(CATALOGUED);
    await waitFor(() => {
      expect(screen.getByText("أساس حساب الغياب")).toBeInTheDocument();
    });
    expect(screen.queryByText("Absence Calculation Basis")).not.toBeInTheDocument();
  });
});
