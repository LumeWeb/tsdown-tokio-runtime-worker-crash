import {
  createBridgeComponent as baseCreateBridgeComponent,
  type RenderFnParams,
} from "@module-federation/bridge-react";
import { loadRemote } from "@module-federation/enhanced/runtime";
import React, {
  ComponentType,
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from "react";

import type { Framework } from "../api/framework";
import type { NamespacedId } from "../types/plugin";

import { RemoteContextBridge, store } from "./context-bridge";

export type BridgeResult<T> = {
  __BRIDGE_FN__: (_args: T) => void;
  destroy(info: { dom: HTMLElement; moduleName: string }): Promise<void>;
  rawComponent: ComponentType<T>;
  render(info: Record<string, unknown> & RenderFnParams): Promise<void>;
};

export interface RemoteComponentConfig {
  componentPath: string;
  pluginId: NamespacedId;
}

export interface RemoteComponentOptions {
  ErrorComponent: React.ComponentType<{
    error: Error;
    resetErrorBoundary: () => void;
  }>;
  LoadingComponent: React.ComponentType;
}

type BridgeableComponent<T> =
  | ComponentType<T>
  | ForwardRefExoticComponent<PropsWithoutRef<T> & RefAttributes<any>>;

export function createRemoteComponentLoader(
  config: RemoteComponentConfig,
  framework: Framework,
  options: RemoteComponentOptions,
) {
  const LoadingElement = <options.LoadingComponent />;

  return framework._createRemoteComponent({
    fallback: (props) => {
      const { error, resetErrorBoundary } = props as {
        error: Error;
        resetErrorBoundary: () => void;
      };
      return (
        <options.ErrorComponent
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );
    },
    loader: async () => {
      const modulePath = framework.resolvePluginModule(
        config.pluginId,
        config.componentPath,
      );
      return framework._loadRemote(modulePath);
    },
    loading: LoadingElement,
  });
}

export const DefaultErrorComponent: React.FC<{
  error: Error;
  resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => (
  <div>
    <h3>Error loading component</h3>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Retry</button>
  </div>
);

export const DefaultLoadingComponent: React.FC = () => <div>Loading...</div>;

export const defaultRemoteOptions: RemoteComponentOptions = {
  ErrorComponent: DefaultErrorComponent,
  LoadingComponent: DefaultLoadingComponent,
};

export function createBridgeComponent<T extends Record<string, unknown>>(
  Component: ComponentType<T>,
): () => BridgeResult<T> {
  // Create wrapper that includes context bridge and forwards refs
  const WrappedComponent: BridgeableComponent<T> = forwardRef<any, T>(
    (props, ref) => {
      return store.getRegisteredContextIds().reduce(
        (children, contextId) => {
          return (
            <RemoteContextBridge
              contextId={contextId}
              name={store.getName(contextId)}>
              {children}
            </RemoteContextBridge>
          );
        },
        <Component {...props} ref={ref} />,
      );
    },
  );

  // Set display name for better debugging
  WrappedComponent.displayName = `Bridge(${
    Component.displayName || Component.name || "Component"
  })`;

  // Create base bridge component with proper type casting
  const bridge = baseCreateBridgeComponent<T>({
    rootComponent: WrappedComponent as ComponentType<T>,
  });

  return () => bridge();
}
