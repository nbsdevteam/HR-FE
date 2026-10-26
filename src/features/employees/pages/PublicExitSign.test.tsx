import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { arabicSource } from "@/i18n/source";
import LocalizationProvider from "@/i18n/LocalizationProvider";

const openPublicExitSign = vi.fn();
const decidePublicExitSign = vi.fn();
vi.mock("../api/publicExitSignApi", async () => {
  const actual = await vi.importActual<typeof import("../api/publicExitSignApi")>("../api/publicExitSignApi");
  return {
    ...actual,
    openPublicExitSign: (...args: unknown[]) => openPublicExitSign(...args),
    decidePublicExitSign: (...args: unknown[]) => decidePublicExitSign(...args),
  };
});

const { default: PublicExitSign } = await import("./PublicExitSign");
const { PublicExitSignApiError } = await import("../api/publicExitSignApi");

const usable = {
  state: "sent", decidedAt: null, expiresAt: null, employeeName: "Suraj", companyName: "Acme", exitType: "resignation",
  exitDate: "2026-11-30", lastWorkingDay: "2026-11-29", clearance: [{ item: "Laptop", category: "it", completed: true }], settlement: null,
};

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LocalizationProvider>
        <MemoryRouter initialEntries={["/exit-sign/tok123"]}>
          <Routes><Route path="/exit-sign/:token" element={<PublicExitSign />} /></Routes>
        </MemoryRouter>
      </LocalizationProvider>
    </QueryClientProvider>,
  );
};

describe("PublicExitSign", () => {
  beforeEach(() => {
    openPublicExitSign.mockReset();
    decidePublicExitSign.mockReset();
    // jsdom has no canvas; the pad only needs a context that may be absent.
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it("opens the link by its token and shows what is being signed", async () => {
    openPublicExitSign.mockResolvedValue(usable);
    renderPage();

    expect(await screen.findByText("Suraj")).toBeTruthy();
    expect(openPublicExitSign).toHaveBeenCalledWith("tok123");
    expect(screen.getByText("Laptop")).toBeTruthy();
    expect(document.querySelector("[data-public-exit-sign]")).toBeTruthy();
  });

  it("says so when the link was already signed, with no form", async () => {
    openPublicExitSign.mockResolvedValue({ ...usable, state: "signed", employeeName: "" });
    renderPage();

    expect(await screen.findByText(arabicSource("public_exit_sign.closed_signed"))).toBeTruthy();
    expect(document.querySelector("[data-public-exit-sign]")).toBeNull();
  });

  it("explains an expired or replaced link", async () => {
    openPublicExitSign.mockResolvedValue({ ...usable, state: "revoked" });
    renderPage();
    expect(await screen.findByText(arabicSource("public_exit_sign.closed_revoked"))).toBeTruthy();
  });

  it("shows the not-found message for an unknown link", async () => {
    openPublicExitSign.mockRejectedValue(new PublicExitSignApiError("link_not_found", "raw"));
    renderPage();
    expect(await screen.findByText(arabicSource("public_exit_sign.error_link_not_found"))).toBeTruthy();
  });

  it("asks for the typed name and a drawn signature before signing", async () => {
    openPublicExitSign.mockResolvedValue(usable);
    renderPage();
    await screen.findByText("Suraj");

    fireEvent.click(document.querySelector("[data-public-exit-sign]") as HTMLElement);
    expect(await screen.findByText(arabicSource("public_exit_sign.error_name_required"))).toBeTruthy();

    fireEvent.change(document.querySelector("[data-public-exit-name]") as HTMLInputElement, { target: { value: "Suraj Kumar" } });
    fireEvent.click(document.querySelector("[data-public-exit-sign]") as HTMLElement);
    expect(await screen.findByText(arabicSource("public_exit_sign.error_signature_required"))).toBeTruthy();
    expect(decidePublicExitSign).not.toHaveBeenCalled();
  });

  it("declines with the reason as notes", async () => {
    openPublicExitSign.mockResolvedValue(usable);
    decidePublicExitSign.mockResolvedValue({});
    renderPage();
    await screen.findByText("Suraj");

    fireEvent.change(document.querySelector("textarea") as HTMLTextAreaElement, { target: { value: "The amount is wrong" } });
    fireEvent.click(document.querySelector("[data-public-exit-decline]") as HTMLElement);

    await waitFor(() => expect(decidePublicExitSign).toHaveBeenCalledWith("tok123", { accept: false, typedName: "", notes: "The amount is wrong" }));
    expect(await screen.findByText(arabicSource("public_exit_sign.done_declined_title"))).toBeTruthy();
  });

  it("shows the backend's reason when the decision is refused", async () => {
    openPublicExitSign.mockResolvedValue(usable);
    decidePublicExitSign.mockRejectedValue(new PublicExitSignApiError("rate_limited", "raw"));
    renderPage();
    await screen.findByText("Suraj");

    fireEvent.click(document.querySelector("[data-public-exit-decline]") as HTMLElement);
    expect(await screen.findByText(arabicSource("public_exit_sign.error_rate_limited"))).toBeTruthy();
  });
});
