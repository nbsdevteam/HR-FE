import { describe, expect, it } from "vitest";
import { arabicSource } from "@/i18n/source";
import { mapExitProgress } from "@/shared/api/mappers/exitProgress";
import type { ExitRequiredItem, MyTask } from "@/shared/hooks";
import {
  EXIT_STAGE_LATE_DAYS,
  EXIT_STAGE_WARN_DAYS,
  exitDaysTone,
  exitOwnerLabel,
  exitRowActions,
  exitStageState,
  exitWaitingOnLabel,
  isHeldRequiredItem,
  requiredItemText,
  taskFor,
} from "./exitProgress";
import { progressAt } from "./exitProgress.fixtures";

const item = (over: Record<string, unknown>): ExitRequiredItem =>
  mapExitProgress({ still_required: [{ code: "clearance_item", owner: "it", label: "Laptop returned", label_ar: "إرجاع الحاسوب", ...over }] })
    .still_required[0];

const categoryLabels = { hr: "HR officer", it: "IT" };

describe("exitDaysTone", () => {
  it("is plain below 3 days, amber from 3 and red from 7", () => {
    expect(exitDaysTone(EXIT_STAGE_WARN_DAYS - 1)).toBe("normal");
    expect(exitDaysTone(EXIT_STAGE_WARN_DAYS)).toBe("warn");
    expect(exitDaysTone(EXIT_STAGE_LATE_DAYS - 1)).toBe("warn");
    expect(exitDaysTone(EXIT_STAGE_LATE_DAYS)).toBe("late");
  });
});

describe("requiredItemText", () => {
  it("shows a clearance item's name in the active language, falling back to the other", () => {
    expect(requiredItemText(item({}), "en")).toBe("Laptop returned");
    expect(requiredItemText(item({}), "ar")).toBe("إرجاع الحاسوب");
    expect(requiredItemText(item({ label_ar: "" }), "ar")).toBe("Laptop returned");
  });

  it("prefixes custody and approval items and names the approvers", () => {
    expect(requiredItemText(item({ code: "custody_item", owner: "custodies", label: "Work phone" }), "en"))
      .toBe(`${arabicSource("lifecycle.exit_req_custody_item")}: Work phone`);
    expect(requiredItemText(item({ code: "approval_step", owner: "approver", label: "Direct Manager", people: [{ id: 5, name: "Ali Hassan" }] }), "en"))
      .toBe(`${arabicSource("lifecycle.exit_req_approval_step")}: Direct Manager (Ali Hassan)`);
  });

  it("carries the approver's rejection reason on a resubmit", () => {
    const text = requiredItemText(item({ code: "submit_for_approval", owner: "hr", detail: "Wrong date" }), "en");
    expect(text).toContain(arabicSource("lifecycle.exit_submit_for_approval"));
    expect(text).toContain(`${arabicSource("lifecycle.exit_req_returned")}: Wrong date`);
  });

  it("adds the signing link's state, with its own wording when not sent", () => {
    expect(requiredItemText(item({ code: "employee_signature", owner: "employee", detail: "not_sent" }), "en"))
      .toContain(arabicSource("lifecycle.exit_sig_not_sent"));
    expect(requiredItemText(item({ code: "employee_signature", owner: "employee", detail: "viewed" }), "en"))
      .toContain(arabicSource("lifecycle.exit_clr_sig_viewed"));
  });

  it("never hides an unknown code", () => {
    expect(requiredItemText(item({ code: "brand_new", label: "" , label_ar: "" }), "en")).toBe("brand_new");
    expect(requiredItemText(item({ code: "brand_new", label: "Something" }), "en")).toBe("Something");
  });
});

describe("owner labels", () => {
  it("uses the team labels, the fixed role keys, and shows an unknown owner as sent", () => {
    expect(exitOwnerLabel("it", categoryLabels)).toBe("IT");
    expect(exitOwnerLabel("employee", categoryLabels)).toBe(arabicSource("common.employee"));
    expect(exitOwnerLabel("approver", categoryLabels)).toBe(arabicSource("lifecycle.exit_owner_approver"));
    expect(exitOwnerLabel("legal", categoryLabels)).toBe("legal");
  });

  it("names the approvers when the open step has them, else the role", () => {
    const named = { owner: "approver", people: [{ id: "5", name: "Ali Hassan" }, { id: "6", name: "Noor" }] };
    expect(exitWaitingOnLabel(named, categoryLabels)).toBe("Ali Hassan, Noor");
    expect(exitWaitingOnLabel({ owner: "approver", people: [] }, categoryLabels)).toBe(arabicSource("lifecycle.exit_owner_approver"));
  });
});

describe("held items and row actions", () => {
  it("holds a sequential step behind anything listed before it", () => {
    expect(isHeldRequiredItem(item({ code: "move_to_settlement" }), 0)).toBe(false);
    expect(isHeldRequiredItem(item({ code: "move_to_settlement" }), 2)).toBe(true);
    // Finance can confirm while custody is still out, so confirm is never held.
    expect(isHeldRequiredItem(item({ code: "confirm_settlement" }), 1)).toBe(false);
  });

  it("offers a button only when the backend's my_actions lists it", () => {
    const move = item({ code: "move_to_settlement", owner: "hr" });
    expect(exitRowActions(move, [], false)).toEqual([]);
    expect(exitRowActions(move, ["start_settlement"], false).map(s => s.action)).toEqual(["start_settlement"]);
    expect(exitRowActions(item({ code: "approval_step" }), ["approve", "reject"], false).map(s => s.action)).toEqual(["approve", "reject"]);
    expect(exitRowActions(item({ code: "final_approval" }), ["complete"], false).map(s => s.action)).toEqual(["complete"]);
  });

  it("offers Mark done only on a checklist line the user may tick", () => {
    const line = item({ line_id: 812 });
    expect(exitRowActions(line, ["edit"], false)).toEqual([]);
    expect(exitRowActions(line, [], true).map(s => s.action)).toEqual(["tick"]);
  });
});

describe("taskFor and stage state", () => {
  const task = (exit_id: string): MyTask => ({ action: "clear_items", exit_id } as MyTask);

  it("finds the My tasks entry for a process, or none", () => {
    expect(taskFor({ id: "7" }, [task("3"), task("7")])?.exit_id).toBe("7");
    expect(taskFor({ id: "9" }, [task("3")])).toBeNull();
  });

  it("reads a stage's state as sent, and an unlisted stage as not reached", () => {
    const proc = { progress: mapExitProgress(progressAt("clearance")) };
    expect(exitStageState(proc, "approval")).toBe("done");
    expect(exitStageState(proc, "clearance")).toBe("current");
    expect(exitStageState(proc, "completed")).toBe("todo");
    expect(exitStageState({ progress: mapExitProgress(undefined) }, "clearance")).toBe("todo");
  });
});

describe("mapExitProgress", () => {
  it("keeps the backend block as sent and maps ids to strings", () => {
    const progress = mapExitProgress({
      stages: [{ key: "clearance", state: "current" }],
      percent: 40,
      waiting_on: [{ owner: "approver", people: [{ id: 5, name: "Ali" }] }],
      still_required: [{ code: "clearance_item", owner: "it", label: "Laptop", line_id: 812 }, { code: "custody_item", owner: "custodies", label: "Phone", custody_id: 77 }],
      next: { code: "clearance_item", owner: "it", label: "Laptop", line_id: 812 },
      since: "2026-10-24T11:02:13+03:00",
      days_in_stage: 2,
    });
    expect(progress.waiting_on[0].people).toEqual([{ id: "5", name: "Ali" }]);
    expect(progress.still_required.map(r => [r.line_id, r.custody_id])).toEqual([["812", null], [null, "77"]]);
    expect(progress.next?.line_id).toBe("812");
    expect(progress.days_in_stage).toBe(2);
  });

  it("maps a record without progress to an empty block instead of guessing", () => {
    const progress = mapExitProgress(undefined);
    expect(progress.stages).toEqual([]);
    expect(progress.next).toBeNull();
    expect(progress.days_in_stage).toBeNull();
  });
});
