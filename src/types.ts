export type TMode = 'beacon' | 'fetch';

export enum EBrowser {
  BRAVE = 'brave',
  CHROME = 'chrome',
  EDGE = 'edge',
  DUCKDUCKGO = 'duckduckgo',
  FIREFOX = 'firefox',
  OPERA = 'opera',
  SAMSUNG = 'samsung',
  SAFARI = 'safari',
}

export enum EDevice {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  TABLET = 'tablet',
}

export enum EOperatingSystem {
  ANDROID = 'android',
  CHROMEOS = 'chromeos',
  IOS = 'ios',
  LINUX = 'linux',
  MACOS = 'macos',
  WINDOWS = 'windows',
}

export interface IOptions {
  /**
   * Enable debug mode
   */
  debug: boolean;

  /**
   * Disables all tracking. By default, this options is detected from the user's settings: `navigator.doNotTrack === '1'`
   */
  doNotTrack: boolean;

  /**
   * Whether to include search parameters (?param=x) in the URL. (default: false)
   */
  enableSearchParams: boolean;

  /**
   * Whether to include hash (#some-anchor) in the URL. (default: false)
   */
  enableHash: boolean;

  /**
   * The offset from the top of the window in pixels when the 'exit intent' triggers. (default: 20)
   */
  exitIntentOffset: number;

  /**
   * Whether to enable the 'exit intent' detection on mobile devices based on the scroll behaviour. (default: true)
   */
  exitIntentMobileScroll: boolean;

  /**
   * Submit the collected data after this timeout (in milliseconds) when the page remains hidden (i.e. `document.hidden`). (defaul: 5 min)
   */
  hiddenSubmitTimeout: number;

  /**
   * Submit mode: `fetch | beacon`. (default: beacon)
   */
  mode: TMode;

  /**
   * Whether to track clicks as custom `$click:x` events. Enabling this also enables detection of the 'exit intent' when clicking on a link with an external URL.
   * Can be a CSS selector to track only specific elements.
   */
  trackClicks: boolean | string;

  /**
   * Whether to track form submissions as custom `$form:x` events.
   * Can be a CSS selector to track only specific elements.
   */
  trackForms: boolean | string;

  /**
   * Required. Your unique site ID.
   */
  siteId: string | null;

  /**
   * A custom URL where to send data.
   */
  submitUrl: string | null;
}

export interface IPageview {
  /**
   * Whether the page was en 'entry page' (landing page).
   */
  enter?: boolean;

  /**
   * Whether the page was an 'exit page'.
   */
  exit?: boolean;

  /**
   * Pathname (URL) of the page.
   */
  path: string;
}
