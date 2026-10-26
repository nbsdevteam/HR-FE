import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { formatDate } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { ExitProgressStage } from "@/shared/hooks";
import ExitProgressStepper from "./ExitProgressStepper";

const stages: ExitProgressStage[] = [
  { key: "in_progress", state: "done" },
  { key: "approval", state: "skipped" },
  { key: "clearance", state: "current" },
  { key: "settlement", state: "todo" },
  { key: "completed", state: "cancelled" },
  { key: "later", state: "not_reached" },
];

const states = () =>
  [...document.querySelectorAll("[data-exit-stage]")].map(el => el.getAttribute("data-exit-stage-state"));

describe("ExitProgressStepper", () => {
  it("draws every state the backend can send", () => {
    render(<ExitProgressStepper stages={stages} statusLabels={{}} size="lg" />);
    expect(states()).toEqual(["done", "skipped", "current", "todo", "cancelled", "not_reached"]);
    expect(document.querySelector('[aria-current="step"]')?.getAttribute("data-exit-stage")).toBe("clearance");
  });

  it("labels stages from statusLabels, falling back to the key", () => {
    const { container } = render(<ExitProgressStepper stages={stages.slice(0, 3)} statusLabels={{ clearance: "Clearance" }} size="lg" />);
    expect(container.textContent).toContain("Clearance");
    expect(container.textContent).toContain("in_progress");
  });

  it("captions the large stepper: date when done, days when current, skipped and cancelled wording", () => {
    const { container } = render(
      <ExitProgressStepper
        stages={stages.slice(0, 5)}
        statusLabels={{}}
        size="lg"
        daysInStage={2}
        dates={{ in_progress: "2026-10-20T09:00:00+03:00" }}
      />,
    );
    expect(container.textContent).toContain(`2 ${arabicSource("common.days_2")}`);
    expect(container.textContent).toContain(arabicSource("lifecycle.exit_stage_skipped"));
    expect(container.textContent).toContain(arabicSource("lifecycle.exit_stage_cancelled_here"));
    expect(container.textContent).toContain(formatDate("2026-10-20T09:00:00+03:00"));
  });

  it("keeps the small stepper to dots, with the label as a tooltip", () => {
    const { container } = render(<ExitProgressStepper stages={stages.slice(0, 3)} statusLabels={{ clearance: "Clearance" }} size="sm" daysInStage={2} />);
    expect(container.querySelector('[data-exit-stepper="sm"]')).toBeTruthy();
    expect(container.querySelector('[data-exit-stage="clearance"]')?.getAttribute("title")).toBe("Clearance");
    expect(container.textContent).toBe("");
  });

  it("renders nothing without stages", () => {
    const { container } = render(<ExitProgressStepper stages={[]} statusLabels={{}} size="sm" />);
    expect(container.textContent).toBe("");
    expect(container.querySelector("ol")).toBeNull();
  });
});
