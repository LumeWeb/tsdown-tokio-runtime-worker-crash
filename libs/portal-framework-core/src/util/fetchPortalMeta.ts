import memoize from "memoizee";

import { PortalMeta } from "../types/portal";
import { getApiBaseUrl } from "./getApiBaseUrl";

const _fetchPortalMeta = memoize(
  async function (portalUrl?: string): Promise<PortalMeta> {
    const endpoint = "/api/meta";
    const baseUrl = getApiBaseUrl({ currentUrl: portalUrl });
    let fullEndpoint = "";
    if (baseUrl) {
      fullEndpoint = `${baseUrl}${endpoint}`;
    }
    if (portalUrl) {
      const portalUrlObj = new URL(portalUrl);
      portalUrlObj.pathname = endpoint;
      fullEndpoint = portalUrlObj.toString();

      if (!fullEndpoint.startsWith("http")) {
        fullEndpoint = `https://${fullEndpoint}`;
      }
    } else {
      if (!baseUrl) {
        throw new Error("Could not detect portal API endpoint");
      }
    }

    try {
      const response = await fetch(fullEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.domain) {
        throw new Error("Response does not contain required 'domain' property");
      }
      return data as PortalMeta;
    } catch (error) {
      console.error("Failed to fetch portal url:", error);
      throw error; // Re-throw the error instead of returning undefined
    }
  },
  { promise: true },
);

export function fetchPortalMeta(portalUrl?: string): Promise<PortalMeta> {
  return _fetchPortalMeta(portalUrl);
}
