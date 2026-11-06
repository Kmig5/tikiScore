const configuredPublicOrigin = import.meta.env.DEV ? import.meta.env.VITE_PUBLIC_ORIGIN : undefined;

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function resolvePublicUrl(value: string): string {
  const configuredUrl = new URL(value || "/", window.location.origin);
  let origin = window.location.origin;
  if (import.meta.env.DEV && isLoopback(window.location.hostname) && configuredPublicOrigin) {
    const publicOrigin = new URL(configuredPublicOrigin);
    if (!publicOrigin.port && window.location.port) publicOrigin.port = window.location.port;
    origin = publicOrigin.origin;
  } else if (!import.meta.env.DEV && !isLoopback(configuredUrl.hostname)) {
    origin = configuredUrl.origin;
  }

  return new URL(`${configuredUrl.pathname}${configuredUrl.search}${configuredUrl.hash}`, origin).toString();
}

export function getChampionshipPublicUrl(value: string, slug: string): string {
  const publicUrl = new URL(resolvePublicUrl(value));
  publicUrl.searchParams.set("championship", slug);
  return publicUrl.toString();
}
