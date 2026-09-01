import { describe, expect, it } from "vitest";
import { PAGE_GAP, pageRange, pageWindow } from "./pagination";

describe("pageWindow", () => {
  it("lists every page when they all fit without a gap", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("degrades to a single page for an empty or unknown result set", () => {
    expect(pageWindow(1, 0)).toEqual([1]);
    expect(pageWindow(1, Number.NaN)).toEqual([1]);
  });

  it("keeps the first and last page either side of a gap", () => {
    expect(pageWindow(6, 12)).toEqual([1, PAGE_GAP, 4, 5, 6, 7, 8, PAGE_GAP, 12]);
  });

  it("only gaps on one side when the current page is near an end", () => {
    expect(pageWindow(2, 12)).toEqual([1, 2, 3, 4, PAGE_GAP, 12]);
    expect(pageWindow(11, 12)).toEqual([1, PAGE_GAP, 9, 10, 11, 12]);
  });

  it("shows the skipped page rather than an ellipsis hiding a single number", () => {
    // The window reaches 3 and 9; an ellipsis for page 2 alone would cost the
    // same width as the number and one more click.
    expect(pageWindow(5, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, PAGE_GAP, 10]);
  });

  it("clamps a current page outside the range instead of inventing one", () => {
    expect(pageWindow(99, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(0, 3)).toEqual([1, 2, 3]);
  });
});

describe("pageRange", () => {
  it("reports the rows a full page covers", () => {
    expect(pageRange(3, 50, 412)).toEqual({ from: 101, to: 150 });
  });

  it("stops the last page at the true total", () => {
    expect(pageRange(9, 50, 412)).toEqual({ from: 401, to: 412 });
  });

  it("reports an empty range rather than a negative one", () => {
    expect(pageRange(1, 50, 0)).toEqual({ from: 0, to: 0 });
    // A page past the end (e.g. after rows were deleted) has no rows to name.
    expect(pageRange(20, 50, 412)).toEqual({ from: 0, to: 0 });
  });
});
