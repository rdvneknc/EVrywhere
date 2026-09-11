function stripSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/** Mobil ile aynı OCM proxy (Cloudflare Worker). */
export const ChargingApiConfig = {
  get baseUrl() {
    const env = (import.meta.env.VITE_CHARGING_API_BASE_URL ?? '').trim();
    if (env) return stripSlash(env);
    return 'https://ocm-api.ridvanekinci92.workers.dev';
  },
  get serverSecret() {
    return (import.meta.env.VITE_CHARGING_API_SECRET ?? '').trim();
  },
};
