import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { changeLanguage } from "@/i18n";
import { employeeNamePair, localizedEmployeeName } from "@/i18n/useLocalizedName";
import LocalizationProvider from "@/i18n/LocalizationProvider";
import type { DbLeaveType } from "@/shared/hooks";
import LeaveBalanceCard from "./LeaveBalanceCard";

const LEAVE_TYPE = {
  id: "lt-1",
  name_ar: "إجازة سنوية",
  name_en: "Annual leave",
  color: "#3b82f6",
  allow_half_day: false,
  is_encashable: false,
  is_carryover_allowed: false,
  is_paid: true,
} as unknown as DbLeaveType;

const renderCard = () =>
  render(
    createElement(
      LocalizationProvider,
      null,
      createElement(LeaveBalanceCard, {
        leaveType: LEAVE_TYPE,
        index: 0,
        bal: undefined,
        entitlement: 21,
      }),
    ),
  );

describe("LeaveBalanceCard leave-type name", () => {
  afterEach(async () => {
    await changeLanguage("ar");
  });

  it("shows the Arabic name in Arabic mode", async () => {
    renderCard();
    await waitFor(() => {
      expect(screen.getByText("إجازة سنوية")).toBeInTheDocument();
    });
    expect(screen.queryByText("Annual leave")).not.toBeInTheDocument();
  });

  it.each(["en", "ku"] as const)(
    "shows the record's English name — never a mix — in %s",
    async (language) => {
      renderCard();
      await changeLanguage(language);
      await waitFor(() => {
        expect(screen.getByText("Annual leave")).toBeInTheDocument();
      });
      expect(screen.queryByText("إجازة سنوية")).not.toBeInTheDocument();
    },
  );
});

describe("employee name columns", () => {
  it("picks the column matching the active language", () => {
    const employee = { name: "Salem Abdullah", arabic_name: "سالم عبد الله" };
    expect(localizedEmployeeName(employee, true)).toBe("سالم عبد الله");
    expect(localizedEmployeeName(employee, false)).toBe("Salem Abdullah");
  });

  it("falls back to the column the record actually has", () => {
    expect(localizedEmployeeName({ arabic_name: "سالم" }, false)).toBe("سالم");
    expect(localizedEmployeeName({ name: "Salem" }, true)).toBe("Salem");
    expect(localizedEmployeeName({}, false)).toBe("—");
  });

  it("never displays a login handle as a name", () => {
    // The backend stores logins in `name`; showing "salem.abdullah" as a
    // person's name is worse than falling back to the Arabic column.
    const { nameEn } = employeeNamePair({
      name: "salem.abdullah",
      arabic_name: "سالم عبد الله",
    });
    expect(nameEn).toBeNull();
    expect(
      localizedEmployeeName(
        { name: "salem.abdullah", arabic_name: "سالم عبد الله" },
        false,
      ),
    ).toBe("سالم عبد الله");
  });
});
