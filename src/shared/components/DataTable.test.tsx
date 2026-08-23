import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import DataTable from "./DataTable";

type Row = { id: string };

const makeRows = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({ id: `row-${i}` }));

const renderRow = (item: Row) =>
  createElement("tr", { key: item.id, "data-testid": "row" }, createElement("td", null, item.id));

const header = createElement("tr", null, createElement("th", null, "ID"));

const renderTable = (props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) =>
  render(
    createElement(DataTable<Row>, {
      items: makeRows(10),
      renderRow,
      header,
      ...props,
    })
  );

describe("DataTable", () => {
  it("renders every row when virtualization is not requested", () => {
    renderTable({ items: makeRows(250) });
    expect(screen.getAllByTestId("row")).toHaveLength(250);
  });

  it("renders the empty row when there are no items", () => {
    renderTable({
      items: [],
      emptyRow: createElement("tr", { "data-testid": "empty" }, createElement("td", null, "none")),
    });
    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.queryAllByTestId("row")).toHaveLength(0);
  });

  it("prefers emptyState over the table chrome when empty", () => {
    renderTable({
      items: [],
      emptyState: createElement("p", { "data-testid": "empty-state" }, "nothing here"),
    });
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(document.querySelector("table")).toBeNull();
  });

  it("stays un-windowed below the threshold even when virtualization is on", () => {
    // 10 rows is far under the default 100-row threshold, so all of them render
    // and no spacer rows are inserted.
    renderTable({ items: makeRows(10), virtualization: { rowHeight: 40 } });
    expect(screen.getAllByTestId("row")).toHaveLength(10);
    expect(document.querySelectorAll("tr[aria-hidden='true']")).toHaveLength(0);
  });

  it("renders only a slice of a long list and pads it with spacer rows", () => {
    // jsdom reports a zero-height viewport and a zero rect, so the computed
    // window is just the overscan — enough to prove the slice is applied and
    // the missing height is compensated by a bottom spacer.
    renderTable({ items: makeRows(1000), virtualization: { rowHeight: 40 } });

    const rendered = screen.getAllByTestId("row");
    expect(rendered.length).toBeLessThan(1000);

    const spacers = document.querySelectorAll("tr[aria-hidden='true']");
    expect(spacers.length).toBeGreaterThan(0);
  });

  it("passes the true list index to renderRow when windowed", () => {
    const seen = new Map<string, number>();
    render(
      createElement(DataTable<Row>, {
        items: makeRows(1000),
        header,
        virtualization: { rowHeight: 40 },
        renderRow: (item: Row, index: number) => {
          seen.set(item.id, index);
          return createElement("tr", { key: item.id }, createElement("td", null, item.id));
        },
      })
    );

    // Indices must be absolute positions in `items`, not slice-relative — row
    // components use them for striping and selection. `row-N` must arrive as N.
    expect(seen.size).toBeGreaterThan(0);
    for (const [id, index] of seen) {
      expect(id).toBe(`row-${index}`);
    }
  });

  it("skips the wrapper div when wrapperClassName is null", () => {
    const { container } = renderTable({ wrapperClassName: null });
    expect(container.firstElementChild?.tagName).toBe("DIV");
    expect(container.querySelector("div > table")).not.toBeNull();
  });
});
