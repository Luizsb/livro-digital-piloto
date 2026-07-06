export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface SessionDeviceContext {
  device_type: DeviceType;
  device_type_label: string;
  os_name: string;
  browser_name: string;
  browser_version: string;
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  is_touch_device: boolean;
  /** Idioma do livro/app (`<html lang>`). */
  app_language: string;
  /** Idioma principal configurado no navegador (`navigator.language`). */
  browser_language: string;
}

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  desktop: 'Computador',
  tablet: 'Tablet',
  mobile: 'Celular',
};

function getUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent ?? '';
}

function detectDeviceType(ua: string): DeviceType {
  const isIpad =
    /iPad/i.test(ua) ||
    (typeof navigator !== 'undefined' &&
      navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints > 1);

  const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);
  const isTablet = isIpad || isAndroidTablet || /Tablet|PlayBook/i.test(ua);

  const isMobile =
    /iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (/Android/i.test(ua) && /Mobile/i.test(ua));

  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

function parseOsName(ua: string): string {
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/CrOS/i.test(ua)) return 'Chrome OS';
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) return 'macOS';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Outro';
}

function parseBrowser(ua: string): { name: string; version: string } {
  const edge = ua.match(/Edg(?:e|A|iOS)?\/(\d+)/i);
  if (edge) return { name: 'Edge', version: edge[1] };

  const firefox = ua.match(/Firefox\/(\d+)/i);
  if (firefox) return { name: 'Firefox', version: firefox[1] };

  const chrome = ua.match(/Chrome\/(\d+)/i);
  if (chrome && !/Edg/i.test(ua)) return { name: 'Chrome', version: chrome[1] };

  const safari = ua.match(/Version\/(\d+).*Safari/i);
  if (safari && !/Chrome/i.test(ua)) return { name: 'Safari', version: safari[1] };

  const opera = ua.match(/OPR\/(\d+)/i);
  if (opera) return { name: 'Opera', version: opera[1] };

  return { name: 'Outro', version: '' };
}

function resolveAppLanguage(): string {
  if (typeof document !== 'undefined' && document.documentElement.lang) {
    return document.documentElement.lang;
  }
  return 'pt-BR';
}

function resolveBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return '—';
  return navigator.language || '—';
}

/** Snapshot do ambiente no início da sessão (sem gravar user-agent bruto). */
export function captureSessionDeviceContext(): SessionDeviceContext {
  const ua = getUserAgent();
  const device_type = detectDeviceType(ua);
  const browser = parseBrowser(ua);

  const screen_width =
    typeof window !== 'undefined' && window.screen ? window.screen.width : 0;
  const screen_height =
    typeof window !== 'undefined' && window.screen ? window.screen.height : 0;
  const viewport_width = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewport_height = typeof window !== 'undefined' ? window.innerHeight : 0;

  return {
    device_type,
    device_type_label: DEVICE_TYPE_LABELS[device_type],
    os_name: parseOsName(ua),
    browser_name: browser.name,
    browser_version: browser.version,
    screen_width,
    screen_height,
    viewport_width,
    viewport_height,
    is_touch_device:
      typeof navigator !== 'undefined'
        ? navigator.maxTouchPoints > 0 || 'ontouchstart' in window
        : false,
    app_language: resolveAppLanguage(),
    browser_language: resolveBrowserLanguage(),
  };
}

export function formatScreenResolution(
  width: number | undefined,
  height: number | undefined,
): string {
  if (!width || !height) return '—';
  return `${width}×${height}`;
}

export function formatBrowserLabel(name?: string, version?: string): string {
  if (!name) return '—';
  return version ? `${name} ${version}` : name;
}
