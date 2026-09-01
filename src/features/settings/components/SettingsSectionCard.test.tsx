import { describe, expect, it } from "vitest";
import { createElement, type ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Palette } from "lucide-react";
import SettingsSectionCard from "./SettingsSectionCard";

type TCardProps = ComponentProps<typeof SettingsSectionCard>;

const renderCard = (extraProps: Partial<TCardProps> = {}) =>
  render(
    createElement<TCardProps>(SettingsSectionCard, {
      icon: Palette,
      title: "ألوان الأقسام",
      description: "تظهر على الهيكل التنظيمي",
      children: createElement("p", null, "محتوى القسم"),
      ...extraProps,
    }),
  );

describe("SettingsSectionCard", () => {
  it("renders a fixed-height card button and keeps the section content closed", () => {
    renderCard();

    const card = screen.getByRole("button", { name: /ألوان الأقسام/ });
    expect(card.className).toContain("h-28");
    expect(screen.queryByText("محتوى القسم")).not.toBeInTheDocument();
  });

  it("clamps title and description so long text ellipsises instead of growing the card", () => {
    renderCard();

    expect(screen.getByText("ألوان الأقسام").className).toContain("line-clamp-1");
    expect(screen.getByText("تظهر على الهيكل التنظيمي").className).toContain(
      "line-clamp-2",
    );
  });

  it("opens a scrollable dialog with the section content when the card is clicked", () => {
    const { container } = renderCard();

    fireEvent.click(screen.getByRole("button", { name: /ألوان الأقسام/ }));

    expect(screen.getByText("محتوى القسم")).toBeInTheDocument();
    expect(container.querySelector(".overflow-y-auto")).not.toBeNull();
  });

  it("shows section actions only once the dialog is open", () => {
    renderCard({
      actions: createElement("button", { type: "button" }, "إضافة نوع"),
    });

    expect(screen.queryByRole("button", { name: "إضافة نوع" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /ألوان الأقسام/ }));
    expect(screen.getByRole("button", { name: "إضافة نوع" })).toBeInTheDocument();
  });
});
