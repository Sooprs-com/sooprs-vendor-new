import {mobile_siteConfig} from '../services/mobile-siteConfig';

function toOrigin(url: string) {
  try {
    const cleaned = url.trim();
    const match = cleaned.match(/^(https?:\/\/[^/]+)/i);
    if (match?.[1]) {
      return match[1];
    }
    return cleaned.replace(/\/$/, '');
  } catch {
    return url.replace(/\/$/, '');
  }
}

const PRODUCTION_BASE = toOrigin(mobile_siteConfig.BASE_URL);
const LOCAL_BASE = toOrigin(
  (mobile_siteConfig as any).BASE_URL_2 ?? mobile_siteConfig.BASE_URL2,
);

const ENV = __DEV__ ? 'local' : 'production';

const CONFIG = {
  local: {
    API_BASE_URL: LOCAL_BASE,
    SOCKET_URL: LOCAL_BASE,
  },
  production: {
    API_BASE_URL: PRODUCTION_BASE,
    SOCKET_URL: PRODUCTION_BASE,
  },
};

const resolvedConfig = CONFIG[ENV];

export const HEALTH_VIDEO_CONFIG = {
  ...resolvedConfig,
  BASE_URL: resolvedConfig.API_BASE_URL,
  API_PREFIX: '/api/user/health-consultation',
  SOCKET_PATH: '/api/user/health-consultation/socket.io',
  TIMEZONE: 'Asia/Kolkata',
};
