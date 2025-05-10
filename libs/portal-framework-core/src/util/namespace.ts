import { NamespacedId } from "../types/plugin";

export function createNamespacedId(
  namespace: string,
  name: string,
): NamespacedId {
  return `${namespace}:${name}` as NamespacedId;
}

export function isNamespacedId(id: string): boolean {
  return id.includes(":");
}

export function normalizeId(pluginId: NamespacedId, id: string): NamespacedId {
  if (id.includes(":")) {
    return id as NamespacedId;
  }
  const [namespace] = pluginId.split(":");
  return createNamespacedId(namespace, id);
}

export function parseNamespacedId(id: string): {
  name: string;
  namespace: string;
} {
  const [namespace, ...rest] = id.split(":");
  const name = rest.join(":");
  return { name, namespace };
}

export function validateNamespacedId(id: string): asserts id is NamespacedId {
  if (!id.includes(":") || id.split(":").length !== 2) {
    throw new Error(`Invalid namespaced identifier: ${id}`);
  }
}
