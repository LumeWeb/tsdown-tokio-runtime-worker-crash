import { init, registerRemotes } from "@module-federation/enhanced/runtime";

import { Builder } from "../api/builder";
import { Framework } from "../api/framework";
import { env } from "../env";
import { CategoryError, InitializationResult } from "../types/api";
import { getPortalPluginManifests } from "../util/getPortalPluginManifests";

// Track initialization state
const initializationState = new Map<
  string,
  {
    builder: Builder;
    framework: Framework;
    initialized: boolean;
  }
>();

interface InitializeFrameworkOptions {
  appName: string;
  configure: (builder: Builder) => Builder;
  existingBuilder?: Builder;
}

export async function initializeFramework(
  options: InitializeFrameworkOptions,
): Promise<InitializationResult> {
  const { appName, configure, existingBuilder } = options;
  const errors: CategoryError[] = [];

  // Check if already initialized
  const existing = initializationState.get(appName);
  if (existing?.initialized) {
    console.warn(
      `Framework already initialized for ${appName} - returning existing instance`,
    );
    return {
      builder: existing.builder,
      framework: existing.framework,
      success: true,
    };
  }

  let builder = existingBuilder || existing?.builder;
  let framework: Framework;

  try {
    if (!builder) {
      // Create builder first to ensure it's always initialized
      builder = new Builder(options.appName);

      // Initialize module federation runtime
      init({ name: appName, remotes: [] });

      // Get plugin manifests
      const manifestsMap = await getPortalPluginManifests(
        appName,
        env.VITE_PORTAL_DOMAIN,
      );

      // Register remote modules first
      await Promise.all(
        manifestsMap.map(async (manifestUrl, index) => {
          try {
            // Generate ID first before any registration
            const moduleId = `remote-${index}`;
            // Register with MF first
            await registerRemotes([{ entry: manifestUrl, name: moduleId }]);
            // Then load and register with plugin system
            await builder!.registerRemoteModule(manifestUrl, moduleId);
          } catch (err) {
            errors.push({
              category: "plugin",
              error: err instanceof Error ? err : new Error(String(err)),
              id: `plugin-load-${index}`,
            });
          }
        }),
      );

      // Configure builder
      builder = configure(builder);

      // Build framework after all registrations
      framework = await builder.framework;

      // Initialize framework
      const initResult = await framework.initialize();
      if (initResult.failures) {
        errors.push(...initResult.failures);
      }

      const result = {
        builder,
        framework,
        ...(errors.length > 0 ? { errors } : {}),
        success: errors.length === 0,
      };

      // Store successful initialization
      if (result.success) {
        initializationState.set(appName, {
          builder,
          framework,
          initialized: true,
        });
      }

      return result;
    }

    // Use existing framework
    framework = await builder.framework;
    const initResult = await framework.initialize();

    if (initResult.failures) {
      errors.push(...initResult.failures);
    }

    return {
      builder,
      framework,
      ...(errors.length > 0 ? { errors } : {}),
      success: errors.length === 0,
    };
  } catch (err) {
    // Handle unexpected system-level errors
    return {
      builder: builder!,
      errors: [
        {
          category: "system",
          error: err instanceof Error ? err : new Error(String(err)),
          id: "system-initialization",
        },
      ],
      framework: framework!,
      success: false,
    };
  }
}

// Helper to check if we need to reinitialize
export function shouldInitialize(
  builder?: Builder | null,
  framework?: Framework | null,
): boolean {
  if (!builder || !framework) return true;

  // Check if this instance is already initialized
  const existing = initializationState.get(framework.appName);
  if (!existing) return true;

  // Allow reinitialization if previous attempt failed
  if (!existing.initialized) return true;

  console.warn(
    `Framework already initialized for ${framework.appName} - skipping reinitialization`,
  );
  return false;
}
