import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n, {
  LANGUAGE_STORAGE_KEY,
  changeLanguage,
  getLanguageDirection,
  normalizeLanguage,
  syncDocumentLocale,
} from "./index";
import { translateArabicSource } from "./legacy";
import { LocalizationProvider } from "./LocalizationProvider";
import { employeeStatusKeys, translateBackendCode } from "./status";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { localizedConfirm } from "./native";
import { arabicSource } from "./source";

describe("application localization", () => {
  beforeEach(async () => {
    localStorage.clear();
    await changeLanguage("ar");
  });

  it("uses Arabic as the default normalization fallback", () => {
    expect(normalizeLanguage(null)).toBe("ar");
    expect(normalizeLanguage("unsupported")).toBe("ar");
  });

  it("persists language changes", async () => {
    await changeLanguage("en");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
  });

  it.each([
    ["en", "ltr"],
    ["ar", "rtl"],
    ["ku", "rtl"],
  ] as const)("sets %s document language and direction", (language, direction) => {
    syncDocumentLocale(language);
    expect(document.documentElement.lang).toBe(language);
    expect(document.documentElement.dir).toBe(direction);
    expect(getLanguageDirection(language)).toBe(direction);
    expect(document.title).not.toBe("shared.human_resources_system");
  });

  it("translates audited Arabic UI copy in English and Sorani", () => {
    const loadingSource = arabicSource("common.loading");
    expect(translateArabicSource(loadingSource, "en")).toBe("Loading...");
    expect(translateArabicSource(loadingSource, "ku")).toBe(
      i18n.getFixedT("ku")("common.loading"),
    );
  });

  it("uses English fallback and preserves interpolation", async () => {
    i18n.addResource("en", "translation", "test.greeting", "Hello, {{name}}");
    expect(i18n.getFixedT("ku")("test.greeting", { name: "Ava" })).toBe("Hello, Ava");
    expect(i18n.getFixedT("en")("common.records", { count: 1 })).toBe("1 record");
    expect(i18n.getFixedT("en")("common.records", { count: 3 })).toBe("3 records");
    expect(i18n.getFixedT("ku")("missing.translation.key")).toBe("");
  });

  it("updates rendered legacy text and attributes without a page reload", async () => {
    render(
      createElement(
        LocalizationProvider,
        null,
        createElement(
          "button",
          { title: arabicSource("common.loading") },
          arabicSource("common.loading"),
        ),
      ),
    );
    await changeLanguage("en");
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("Loading...");
      expect(screen.getByRole("button")).toHaveAttribute("title", "Loading...");
    });
    await changeLanguage("ku");
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent(
        i18n.getFixedT("ku")("common.loading"),
      );
    });
    await changeLanguage("ar");
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent(
        arabicSource("common.loading"),
      );
    });
  });

  it("maps backend status codes and keeps unknown values readable", async () => {
    await changeLanguage("en");
    expect(
      translateBackendCode(arabicSource("common.is_active"), employeeStatusKeys),
    ).toBe("Active");
    expect(translateBackendCode("new_backend_status", employeeStatusKeys)).toBe(
      "new_backend_status",
    );
  });

  it("provides an accessible, immediate language selector", async () => {
    render(
      createElement(
        LocalizationProvider,
        null,
        createElement(LanguageSwitcher),
      ),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: i18n.getFixedT("ar")("languages.selector_label"),
      }),
    );
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(3);
    fireEvent.click(
      screen.getByRole("menuitemradio", {
        name: i18n.getFixedT("en")("languages.self_name"),
      }),
    );
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("en");
      expect(document.documentElement.dir).toBe("ltr");
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: i18n.getFixedT("en")("languages.selector_label"),
      }),
    );
    fireEvent.click(
      screen.getByRole("menuitemradio", {
        name: i18n.getFixedT("ku")("languages.self_name"),
      }),
    );
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ku");
      expect(document.documentElement.dir).toBe("rtl");
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: i18n.getFixedT("ku")("languages.selector_label"),
      }),
    );
    fireEvent.click(
      screen.getByRole("menuitemradio", {
        name: i18n.getFixedT("ar")("languages.self_name"),
      }),
    );
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ar");
      expect(document.documentElement.dir).toBe("rtl");
    });
  });

  it("localizes native confirmation messages produced outside React", async () => {
    const nativeConfirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await changeLanguage("en");
    expect(i18n.resolvedLanguage).toBe("en");
    localizedConfirm(
      arabicSource("warnings.are_you_sure_you_want_to_delete_this_alarm"),
    );
    expect(nativeConfirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this alarm?",
    );
    nativeConfirm.mockRestore();
  });
});
