import {
  Component,
  Suspense,
  lazy,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { loadRemote } from "@module-federation/runtime";
import type { ClickToCallProps } from "./contracts";

/**
 * The other direction: HR using the CRM composition's components.
 *
 * Federation here is not one-way. HR exposes the employee record; the contact centre exposes the
 * dialer, and an HR screen showing a phone number should be able to ring it without HR ever
 * learning what Digi is, how the WebRTC offer is exchanged, or which queue the agent is in.
 *
 *     import { ClickToCall } from "@/mf/remote";
 *     <ClickToCall phone={employee.phone} displayName={employee.name} />
 *
 * Mirrors packages/mf/src/runtime/RemoteComponent.tsx in CRM-FE (see contracts.ts on why this is
 * duplicated rather than imported). Every remote mount degrades rather than throws: contact-centre
 * being mid-deploy must cost this screen its call button and nothing else.
 */

const RETRY_DELAY_MS = 600;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type BoundaryProps = { children: ReactNode; fallback: ReactNode; label: string };

class RemoteBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[mf] remote surface " + this.props.label + " failed to render", error, info);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const remoteComponent = <P extends object>(
  app: string,
  module: string,
  options: { pending?: ReactNode; fallback?: ReactNode } = {}
): ComponentType<P> => {
  const specifier = app + "/" + module.replace(/^\.\//, "");
  const { pending = null, fallback = null } = options;

  /*
    `lazy()` widens the component's props to the union React uses internally, so spreading a generic
    P into it fails to type-check. The cast is at the boundary where the real type is known — the
    loader above returns ComponentType<P> — rather than on the caller's side, so consumers still get
    fully typed props.
  */
  const Lazy = lazy(async () => {
    const load = async () => {
      const loaded = await loadRemote<{ default: ComponentType<P> }>(specifier);
      if (!loaded) throw new Error("[mf] " + specifier + " resolved to nothing");
      return { default: loaded.default };
    };
    try {
      return await load();
    } catch (error) {
      // The common failure is a remote mid-deploy, which resolves in well under a second.
      console.warn("[mf] " + specifier + " failed to load, retrying once", error);
      await wait(RETRY_DELAY_MS);
      return load();
    }
  });

  const Typed = Lazy as unknown as ComponentType<P>;

  const Federated = (props: P) => (
    <RemoteBoundary label={specifier} fallback={fallback}>
      <Suspense fallback={pending}>
        <Typed {...props} />
      </Suspense>
    </RemoteBoundary>
  );

  return Federated;
};

/** Contact Center's dialer. Renders nothing at all if that remote is unreachable. */
export const ClickToCall = remoteComponent<ClickToCallProps>("contact_center", "./ClickToCall");

export { remoteComponent };
