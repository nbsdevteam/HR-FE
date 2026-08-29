import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Check } from "lucide-react";
import Button from "./Button";

describe("Button", () => {
  it("renders its children and fires onClick", () => {
    const onClick = vi.fn();
    render(createElement(Button, { onClick }, "Save"));

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the primary variant by default, with the app's gold hover", () => {
    render(createElement(Button, null, "Save"));
    const className = screen.getByRole("button").className;
    expect(className).toContain("bg-primary");
    // Call sites migrating off hand-rolled buttons must keep this hover.
    expect(className).toContain("hover:bg-gold-dark");
  });

  it("renders tonal variants without a solid fill", () => {
    render(createElement(Button, { variant: "success" }, "Open door"));
    const className = screen.getByRole("button").className;
    expect(className).toContain("bg-emerald-500/20");
    expect(className).not.toContain("bg-primary");
  });

  it("contributes no colour for the unstyled variant", () => {
    render(createElement(Button, { variant: "unstyled", className: "custom-look" }, "Go"));
    const className = screen.getByRole("button").className;
    expect(className).toContain("custom-look");
    expect(className).not.toContain("bg-primary");
    // Layout/disabled behaviour is still shared.
    expect(className).toContain("inline-flex");
  });

  it("lets a segmented control replace the corner rounding", () => {
    render(createElement(Button, { rounded: "rounded-none" }, "Middle"));
    const className = screen.getByRole("button").className;
    expect(className).toContain("rounded-none");
    expect(className).not.toContain("rounded-lg");
  });

  it("uses square padding for the icon size", () => {
    render(createElement(Button, { size: "icon", icon: Check, "aria-label": "confirm" }));
    const className = screen.getByRole("button", { name: "confirm" }).className;
    expect(className).toContain("p-2");
    expect(className).not.toContain("px-4");
  });

  it("blocks clicks and hides the icon while loading", () => {
    const onClick = vi.fn();
    const { container } = render(
      createElement(Button, { loading: true, icon: Check, onClick }, "Saving")
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("stays disabled when disabled is passed without loading", () => {
    const onClick = vi.fn();
    render(createElement(Button, { disabled: true, onClick }, "Save"));

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("still renders a working button when motionProps are supplied", () => {
    const onClick = vi.fn();
    render(
      createElement(
        Button,
        { motionProps: { whileHover: { scale: 1.05 } }, onClick },
        "Animated"
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Animated" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards native button attributes such as type and aria-label", () => {
    render(createElement(Button, { type: "submit", "aria-label": "submit form" }));
    const button = screen.getByRole("button", { name: "submit form" });
    expect(button).toHaveAttribute("type", "submit");
  });
});
