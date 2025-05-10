import { createRemoteComponent } from "@module-federation/bridge-react";
import { loadRemote } from "@module-federation/enhanced/runtime";

import type { BaseCapability } from "../types/capabilities";
import type { NamespacedId, WidgetRegistrationInfo } from "../types/plugin";

import { CapabilityManager } from "../capabilities/manager";
import { PluginManager } from "../plugins/manager";
import { CategoryError, FrameworkFeature } from "../types/api";
import { validateNamespacedId } from "../util/namespace";

export class Framework {
  get appName() {
    return this._appName;
  }
  readonly #capabilities: CapabilityManager;
  readonly #plugins: PluginManager;
  private readonly _appName: string;

  constructor(
    capabilities: CapabilityManager,
    plugins: PluginManager,
    appName: string,
  ) {
    this.#capabilities = capabilities;
    this.#plugins = plugins;
    this._appName = appName;
    plugins.framework = this;
    capabilities.framework = this;
  }

  _createRemoteComponent = (...args: any) =>
    createRemoteComponent.apply(null, args);
  _loadRemote = (...args: any) => loadRemote.apply(null, args);

  enablePlugin(id: NamespacedId): void {
    validateNamespacedId(id);
    this.#plugins.enablePlugin(id);
  }

  async getCapabilitiesByType<T extends BaseCapability>(
    type: string,
  ): Promise<T[]> {
    return (await this.#capabilities.getAllOfType(type)) as T[];
  }

  async getCapability<T extends BaseCapability>(
    id: string,
  ): Promise<T | undefined> {
    return (await this.#capabilities.get(id)) as T;
  }

  async getFeature<T extends FrameworkFeature>(
    id: NamespacedId,
  ): Promise<T> {
    validateNamespacedId(id);
    const feature = await this.#plugins.getFeatureWithFallback<T>(id);
    if (!feature) {
      throw new Error(`Feature ${id} not found`);
    }
    return feature;
  }

  getPlugins() {
    return this.#plugins.getPlugins();
  }

  getPluginManager(): PluginManager {
    return this.#plugins;
  }

  /**
   * Retrieves widget registrations for a given area from all enabled plugins.
   * @param area The area to retrieve widget registrations for (e.g., "dashboard").
   * @returns An array of objects containing the pluginId and componentName for each registration.
   */
  getWidgetRegistrations(area: string): WidgetRegistrationInfo[] {
    const registrations: WidgetRegistrationInfo[] = [];

    for (const plugin of this.getPlugins()) {
      if (plugin.widgetRegistrations) {
        plugin.widgetRegistrations.forEach((reg) => {
          if (reg.area === area) {
            registrations.push({
              componentName: reg.componentName,
              pluginId: plugin.id,
            });
          }
        });
      }
    }
    return registrations;
  }

  hasCapability(type: string): boolean {
    validateNamespacedId(type);
    return this.#plugins.hasCapability(type);
  }

  async initialize(): Promise<{
    failures?: CategoryError[];
    success: boolean;
  }> {
    const errors: CategoryError[] = [];

    // Initialize plugins in dependency order
    const pluginFailures = await this.#plugins.initializePlugins();
    for (const [id, error] of pluginFailures) {
      errors.push({
        category: "plugin",
        error,
        id,
      });
    }

    // Attempt to retry any failed plugin initializations
    await this.#plugins.retryFailedPlugins();

    // Load and initialize enabled plugins
    for (const pluginId of this.#plugins.getEnabledPlugins()) {
      const plugin = this.#plugins.getOrActivatePlugin(pluginId);
      if (!plugin) {
        errors.push({
          category: "plugin",
          error: new Error(`Failed to load plugin: ${pluginId}`),
          id: pluginId,
        });
      } else {
        // Register capabilities from the plugin with plugin ID
        plugin.capabilities?.forEach((capability) => {
          this.#capabilities.register(capability, plugin.id);
        });
      }
    }

    // Initialize capabilities
    const capabilityFailures = await this.#capabilities.initializeAll();
    for (const [id, error] of capabilityFailures) {
      errors.push({
        category: "capability",
        error,
        id,
      });
    }

    // Load features from all enabled plugins
    for (const plugin of this.getPlugins()) {
      if (plugin.features) {
        for (const feature of plugin.features) {
          try {
            await this.loadFeature(feature.id);
          } catch (error) {
            errors.push({
              category: "feature",
              error: error instanceof Error ? error : new Error(String(error)),
              id: feature.id,
            });
          }
        }
      }
    }

    return {
      failures: errors.length > 0 ? errors : undefined,
      success: errors.length === 0,
    };
  }

  isFeatureAvailable(id: NamespacedId): boolean {
    const state = this.#plugins.getPluginState(id);
    return state?.loadState === "loaded" && state?.initState === "initialized";
  }

  isPluginEnabled(id: NamespacedId): boolean {
    validateNamespacedId(id);
    return this.#plugins.isPluginEnabled(id);
  }

  async loadFeature(id: NamespacedId) {
    validateNamespacedId(id);
    const feature = await this.#plugins.loadFeature(id);
    if (feature) {
      await feature.initialize(this);
    }
    return feature;
  }

  registerCapability(capability: BaseCapability, pluginId: string): void {
    this.#capabilities.register(capability, pluginId);
  }

  resolvePluginModule(pluginId: NamespacedId, exportName: string): string {
    // Find the module mapping for this plugin
    const mapping = this.#plugins.getRemoteModule(pluginId);

    if (!mapping) {
      throw new Error(`No module mapping found for plugin: ${pluginId}`);
    }

    // Assume component is exported at root level
    return `${mapping.moduleId}/${exportName}`;
  }
}
