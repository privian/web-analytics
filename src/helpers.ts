import { EBrowser, EDevice, EOperatingSystem } from './types';

/**
 * Max. screen width a mobile device. Used to determine whether it's a phone (mobile) or a tablet. See `getDevice()`.
 */
export const MOBILE_MAX_WIDTH = 576;

/**
 * Reads html data-* attributes (i.e. `data-property="value"`) from the current script tag.
 */
export function readScriptAttributes(): Record<string, unknown> {
  const script = document.currentScript;
  const result: Record<string, unknown> = {};
  if (script) {
    const attrs = script.getAttributeNames();
    attrs.reduce((acc, key) => {
      if (key.match(/^data-/)) {
        let val: unknown = decodeURIComponent(script.getAttribute(key) || '');
        if (val === 'true') {
          val = true;
        }
        if (val === 'false') {
          val = false;
        }
        acc[
          key
            .toLowerCase()
            .replace(/data-/, '')
            .replace(/\-\w/g, (m) => {
              return m[1].toUpperCase();
            })
        ] = val;
      }
      return acc;
    }, result);
  }
  return result;
}

/**
 * Detect user's browser
 */
export function getBrowser(): EBrowser | null {
  const uaData = 'userAgentData' in navigator ? navigator.userAgentData : null;
  const ua = navigator.userAgent;
  const isChrome = 'chrome' in window;
  if (
    'opr' in window ||
    'opera' in window ||
    uaData?.brands[0]?.brand.includes('Opera')
  ) {
    return EBrowser.OPERA;
  }
  if ('InstallTrigger' in window) {
    return EBrowser.FIREFOX;
  }
  if ('safari' in window || 'ApplePaySession' in window) {
    return EBrowser.SAFARI;
  }
  if (
    'StyleMedia' in window ||
    ua?.includes('Edg/') ||
    (isChrome && uaData?.brands[0]?.brand.includes('Edge'))
  ) {
    return EBrowser.EDGE;
  }
  if ('brave' in navigator) {
    return EBrowser.BRAVE;
  }
  if (ua?.includes('DuckDuckGo/')) {
    return EBrowser.DUCKDUCKGO;
  }
  if (ua?.includes('SamsungBrowser')) {
    return EBrowser.SAMSUNG;
  }
  if (isChrome || (isMobile() && ua?.includes('CriOS'))) {
    return EBrowser.CHROME;
  }
  return null;
}

/**
 * Detect user's OS
 */
export function getOperatingSystem(): EOperatingSystem | null {
  const mobile = isMobile();
  const ua = navigator.userAgent;
  const platform: string =
    navigator.userAgentData?.platform || navigator.platform || '';
  if (mobile && ua?.includes('Android')) {
    return EOperatingSystem.ANDROID;
  }
  if (['iPhone'].includes(platform)) {
    return EOperatingSystem.IOS;
  }
  if (['MacIntel', 'macOS'].includes(platform)) {
    if (mobile) {
      return EOperatingSystem.IOS;
    }
    return EOperatingSystem.MACOS;
  }
  if (platform.includes('Linux')) {
    return EOperatingSystem.LINUX;
  }
  if (['Win', 'Windows'].includes(platform)) {
    return EOperatingSystem.WINDOWS;
  }
  if (platform.includes('CrOS')) {
    return EOperatingSystem.CHROMEOS;
  }
  return null;
}

/**
 * Detect user's device
 */
export function getDevice(): EDevice {
  if (isMobile()) {
    return screen.width < MOBILE_MAX_WIDTH ? EDevice.MOBILE : EDevice.TABLET;
  }
  return EDevice.DESKTOP;
}

/**
 * Whether the user's device is a mobile device
 */
export function isMobile() {
  if ('userAgentData' in navigator) {
    return navigator.userAgentData.mobile;
  }
  if (
    navigator.platform === 'iPhone' ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 2)
  ) {
    // ios
    return true;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function debounce(fn: (...args: any[]) => void, delay: number) {
  let timeout: NodeJS.Timeout | null;
  return function (this: unknown, ...args: any[]) {
    if (!timeout) {
      timeout = setTimeout(() => {
        fn.apply(this, args);
        timeout = null;
      }, delay);
    }
  };
}
