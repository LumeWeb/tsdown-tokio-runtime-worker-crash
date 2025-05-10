import { env } from "../env";

const IPLoopbackRegex =
  /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;

interface ApiUrlOptions {
  allowLocalhost?: boolean;
  currentUrl?: string;
  isRootDomain?: boolean; // Explicit option (can be overridden by env)
}

export function getApiBaseUrl(options: ApiUrlOptions = {}): false | string {
  const {
    allowLocalhost = false,
    currentUrl = window.location.href,
    isRootDomain: explicitIsRootDomain, // Rename to avoid shadowing
  } = options;

  // Override with environment variable
  const viteIsRootDomain = env.VITE_PORTAL_DOMAIN_IS_ROOT;
  const isRootDomain =
    viteIsRootDomain === "true" ? true : explicitIsRootDomain;

  const normalizedUrl = normalizeUrl(currentUrl);
  const urlObject = new URL(normalizedUrl);

  // Check if we're on localhost or a local IP address
  const isLocalEnvironment =
    urlObject.hostname === "localhost" ||
    IPLoopbackRegex.test(urlObject.hostname);

  if (isLocalEnvironment && !allowLocalhost) {
    // For localhost without override, return false
    return false;
  }

  // Handle Explicit Root Domain Case (NEW LOGIC)
  if (isRootDomain) {
    return normalizeUrl(`${urlObject.protocol}//${urlObject.hostname}`);
  }

  // Check if we're using an IP address (not localhost)
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(urlObject.hostname)) {
    // For IP addresses, assume the API is at the root
    return normalizeUrl(`${urlObject.protocol}//${urlObject.hostname}`);
  }

  // For FQDNs, extract the root domain
  const hostParts = urlObject.hostname.split(".");
  if (hostParts.length > 2) {
    const left = hostParts.length - 1;
    // Get the last two parts of the domain (e.g., 'example.com' from 'subdomain.example.com')
    const rootDomain = hostParts.slice(-left).join(".");
    return normalizeUrl(`${urlObject.protocol}//${rootDomain}`);
  }

  // If it's already a root domain (e.g., 'example.com')
  return normalizeUrl(`${urlObject.protocol}//${urlObject.hostname}`);
}

/**
 * Normalizes a URL to ensure consistent format:
 * - Forces HTTPS protocol unless it's localhost
 * - Removes trailing slashes
 * - Removes default ports
 */
function normalizeUrl(url: string): string {
  // Add protocol if missing
  const hasProtocol = /^[a-zA-Z]+:\/\//.test(url);
  const urlWithProtocol = hasProtocol ? url : `https://${url}`;

  const urlObject = new URL(urlWithProtocol);

  // Force HTTPS unless it's localhost or IP
  const isLocalOrIP =
    urlObject.hostname === "localhost" ||
    IPLoopbackRegex.test(urlObject.hostname) ||
    /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(urlObject.hostname);

  const protocol = isLocalOrIP ? urlObject.protocol : "https:";

  // Remove default ports
  let port = urlObject.port;
  if (
    (port === "80" && urlObject.protocol === "http:") ||
    (port === "443" && urlObject.protocol === "https:")
  ) {
    port = "";
  }

  // Construct normalized URL without trailing slash
  const baseUrl = `${protocol}//${urlObject.hostname}${port ? ":" + port : ""}`;
  return baseUrl.replace(/\/$/, "");
}
