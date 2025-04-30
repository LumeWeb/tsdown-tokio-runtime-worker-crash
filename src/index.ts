export { Builder } from "./api/builder";
export { Framework } from "./api/framework";
export { ErrorDisplay } from "./components/ErrorDisplay";
export { RouteErrorBoundary } from "./components/RouteErrorBoundary";
export { RouteLoading } from "./components/RouteLoading";
export { WidgetArea } from "./components/WidgetArea";

// Contexts
export {
  FrameworkProvider,
  type InitializationError,
  useFramework,
  useFrameworkLoading,
} from "./contexts/framework";
export { env } from "./env";
// API
export {
  HostContextBridge,
  registerBridgedContext,
  RemoteContextConsumer,
} from "./plugins/context-bridge";
// Plugins
export { PluginManager } from "./plugins/manager";

export {
  createBridgeComponent,
  createRemoteComponentLoader,
  defaultRemoteOptions,
  type RemoteComponentOptions,
} from "./plugins/remoteComponentLoader";
// Types
export type { FrameworkFeature } from "./types/api";
export type {
  BaseCapability,
  RefineConfigCapability,
  SdkCapability,
} from "./types/capabilities";
export type { NavigationFeature } from "./types/features";

export type { NavigationItem, RouteDefinition } from "./types/navigation";
export type {
  NamespacedId,
  Plugin,
  PluginModule,
  PluginState,
} from "./types/plugin";
export * from "./types/portal";
export { fetchPortalMeta } from "./util/fetchPortalMeta";
export { getApiBaseUrl } from "./util/getApiBaseUrl";
// Utils
export { getPortalPluginManifests } from "./util/getPortalPluginManifests";
export * from "./util/namespace";
