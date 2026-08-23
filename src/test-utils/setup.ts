import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// React Testing Library only auto-registers its cleanup when Vitest's globals
// are enabled; this project runs without them, so unmount explicitly. Without
// this, DOM from one test leaks into the next and queries match stale nodes.
afterEach(() => {
  cleanup();
});
