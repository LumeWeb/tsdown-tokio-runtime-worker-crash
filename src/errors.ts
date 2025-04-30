import { NamespacedId } from "./types/plugin";

class BaseError extends Error {
  cause?: Error;
  constructor(message: string, options?: { cause?: Error }) {
    super(message);
    this.name = this.constructor.name;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class CapabilityLoadError extends BaseError {
  constructor(id: NamespacedId, cause?: Error) {
    super(`Failed to load capability: ${id}`);
    this.name = "CapabilityLoadError";
    this.cause = cause;
  }
}

export class FeatureLoadError extends BaseError {
  constructor(id: NamespacedId, cause?: Error) {
    super(`Failed to load feature: ${id}`);
    this.name = "FeatureLoadError";
    this.cause = cause;
  }
}

export class PluginInitError extends BaseError {
  constructor(id: NamespacedId, cause?: Error) {
    super(`Failed to initialize plugin: ${id}`);
    this.name = "PluginInitError";
    this.cause = cause;
  }
}

export class PluginLoadError extends BaseError {
  constructor(id: NamespacedId, cause?: Error) {
    super(`Failed to load plugin: ${id}`);
    this.name = "PluginLoadError";
    this.cause = cause;
  }
}
