const PRODUCTION_BASE_URL =
  'https://ocm-api.ridvanekinci92.workers.dev';

function stripSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/** Expo: EXPO_PUBLIC_CHARGING_API_BASE_URL / EXPO_PUBLIC_CHARGING_API_SECRET */
export const ChargingApiConfig = {
  get baseUrl() {
    const env = (process.env.EXPO_PUBLIC_CHARGING_API_BASE_URL ?? '').trim();
    if (env) return stripSlash(env);
    return PRODUCTION_BASE_URL;
  },
  get serverSecret() {
    return (process.env.EXPO_PUBLIC_CHARGING_API_SECRET ?? '').trim();
  },
};
