import {
  debounce,
  getBrowser,
  getDevice,
  getOperatingSystem,
  isMobile,
  readScriptAttributes,
} from './helpers';
import type { IOptions, IPageview } from './types';

class PrivianWebAnalytics {
  static readonly ATTRS_OPTIONS = readScriptAttributes();

  static readonly LOAD_TIME = Date.now();

  readonly browser = getBrowser();

  readonly device = getDevice();

  readonly eventListeners: [EventTarget, string, (...args: any[]) => void][] =
    [];

  readonly emitter: HTMLElement = document.createElement('div');

  readonly mobile = isMobile();

  readonly options: IOptions;

  readonly os = getOperatingSystem();

  ctrlKey: boolean = false;

  destroyed: boolean = false;

  events: string[] = [];

  pageviews: IPageview[] = [];

  exit: boolean = false;

  maxScrollYPercent: number = 0;

  scrollY: number = 0;

  hiddenSubmitTimeout?: NodeJS.Timeout;

  submissions: number = 0;

  constructor(options?: Partial<IOptions>) {
    this.options = {
      ...this.defaultOptions(),
      ...PrivianWebAnalytics.ATTRS_OPTIONS,
      ...options,
    };
    this.bindEvents();
    if (this.options.mode === 'fetch') {
      this.reportPageview();
      this.submit(false);
    }
  }

  destroy() {
    this.eventListeners.forEach(([target, eventName, handler]) => {
      target.removeEventListener(eventName, handler);
    });
    this.events = [];
    this.pageviews = [];
    this.destroyed = true;
  }

  defaultOptions(): IOptions {
    return {
      debug: false,
      doNotTrack: navigator.doNotTrack === '1',
      enableSearchParams: false,
      enableHash: false,
      exitIntentOffset: 20,
      exitIntentMobileScroll: true,
      hiddenSubmitTimeout: 5 * 60 * 1000, // 5 min
      mode: 'beacon',
      trackClicks: true,
      trackForms: true,
      siteId: null,
      submitUrl: null,
    };
  }

  get bounce() {
    return (
      this.submissions === 0 &&
      this.pageviews[0]?.enter &&
      this.pageviews[0]?.exit
    );
  }

  get duration() {
    return this.exit
      ? Math.max(
          0,
          Math.floor((Date.now() - PrivianWebAnalytics.LOAD_TIME) / 1000) * 1000
        )
      : void 0;
  }

  get enter() {
    return this.unique && this.pageviews.length === 0 && this.submissions === 0;
  }

  get path() {
    let path = location.pathname;
    if (this.options.enableSearchParams) {
      path += location.search;
    }
    if (this.options.enableHash) {
      path += location.hash;
    }
    return path.replace(/([^\/])\/+$/, '$1');
  }

  get queryParams(): Record<string, string> {
    if ('URLSearchParams' in window) {
      return [...(new URLSearchParams(location.search) as any)].reduce(
        (acc, [k, v]) => {
          acc[k] = v;
          return acc;
        },
        {}
      );
    }
    return {};
  }

  get referrer() {
    return document.referrer || void 0;
  }

  get submitUrl() {
    const siteId = this.options.siteId || '';
    return (
      this.options.submitUrl ||
      `https://${siteId.slice(0, 2).toLowerCase()}.privian.net/submit/${siteId}`
    );
  }

  get unique() {
    if (this.submissions > 0) {
      return false;
    }
    // if the referrer is set and differs from the current origin, it is considered a unique pageview
    return (
      !document.referrer ||
      document.referrer.indexOf(location.origin.replace(/\/$/, '')) !== 0
    );
  }

  get utm() {
    const params = this.queryParams;
    if (params.utm_medium || params.utm_source || params.utm_campaign) {
      return [
        params.utm_medium || '?',
        params.utm_source || '?',
        params.utm_campaign || '?',
        params.utm_term || '?',
        params.utm_content,
      ]
        .filter((s) => s !== void 0)
        .map(encodeURIComponent)
        .join('/');
    }
    return void 0;
  }

  get info() {
    if (this.unique) {
      return {
        bounce: this.bounce || void 0,
        browser: this.browser,
        device: this.device,
        duration: this.duration,
        mode: this.options.mode,
        os: this.os,
        referrer: this.referrer,
        unique: true,
        utm: this.utm,
      };
    }
    return null;
  }

  reportPageview(pageview?: IPageview) {
    pageview = {
      enter: this.enter,
      exit: this.exit,
      path: this.path,
      ...pageview,
    };
    this.log('reportPageview', { pageview });
    if (!this.options.doNotTrack) {
      this.pageviews.push({
        enter: pageview.enter || void 0,
        exit: pageview.exit || void 0,
        path: pageview.path,
      });
    }
  }

  reportEvent(eventName: string, params?: Record<string, string>) {
    const event =
      eventName + (params ? '?' + new URLSearchParams(params).toString() : '');
    this.log('reportEvent', event);
    if (!this.options.doNotTrack) {
      this.events.push(event);
    }
  }

  async submit(beacon: boolean = true): Promise<any> {
    if (this.options.mode === 'fetch' && beacon) {
      this.log(`submit: ignoring due to fetch mode.`);
      return false;
    }
    if (this.events.length === 0 && this.pageviews.length === 0) {
      this.log(`submit: no data to report (DNT=${this.options.doNotTrack})`);
      return false;
    }
    this.log('submit');
    const supportsBecons = 'sendBeacon' in navigator;
    if (beacon && !supportsBecons) {
      this.log('submit error: browser does not support beacons');
      return false;
    }
    const events = this.events;
    const pageviews = this.pageviews;
    const payload = {
      ...this.info,
      events: events.length ? events : void 0,
      pageviews: pageviews.length ? pageviews : void 0,
    };
    this.events = [];
    this.pageviews = [];
    try {
      if (beacon) {
        navigator.sendBeacon(this.submitUrl, JSON.stringify(payload));
      } else {
        await fetch(this.submitUrl, {
          body: JSON.stringify(payload),
          method: 'POST',
          mode: 'cors',
        });
      }
    } catch (err) {
      this.log('submit error:', err);
      this.events = events.concat(this.events);
      this.pageviews = pageviews.concat(this.pageviews);
      throw err;
    }
    this.submissions += 1;
  }

  log(...args: any[]) {
    if (this.options.debug) {
      console.group('[privian]');
      console.log(...args);
      console.groupEnd();
    }
  }

  addEventListener(
    target: EventTarget,
    eventName: string,
    handler: (...args: any[]) => void,
    options?: AddEventListenerOptions
  ) {
    target.addEventListener(eventName, handler, options);
    this.eventListeners.push([target, eventName, handler]);
  }

  emit(eventName: string) {
    this.log('emit', eventName);
    const ev = new CustomEvent(eventName);
    this.emitter.dispatchEvent(ev);
  }

  bindEvents() {
    this.addEventListener(
      window,
      'onpagehide' in window ? 'pagehide' : 'unload',
      (ev) => {
        this.exit = !!(this.exit || this.ctrlKey || document.hidden);
        this.reportPageview();
        this.submit();
      }
    );

    this.addEventListener(document, 'visibilitychange', () => {
      if (this.mobile) {
        this.exit = !!document.hidden;
      }
      if (document.hidden) {
        if (this.mobile) {
          this.reportPageview();
          this.submit();
        } else if (this.options.hiddenSubmitTimeout) {
          this.hiddenSubmitTimeout = setTimeout(() => {
            this.reportPageview();
            this.submit();
          }, this.options.hiddenSubmitTimeout);
        }
      } else {
        if (this.hiddenSubmitTimeout) {
          clearTimeout(this.hiddenSubmitTimeout);
          this.hiddenSubmitTimeout = void 0;
        }
      }
    });

    // Exit intent detection using the mouseleave event
    this.addEventListener(document.documentElement, 'mouseleave', (ev) => {
      if (!this.exit && ev.clientY < this.options.exitIntentOffset) {
        this.exit = true;
        this.emit('exit');
      }
    });

    // Detect 'reenter' after an 'exit' event
    this.addEventListener(document.documentElement, 'mouseenter', (ev) => {
      if (this.exit && ev.clientY > 0) {
        this.exit = false;
        this.emit('reenter');
      }
    });

    // CTRL/Meta key helps detect the exit intent (i.e. holding CTRL while unloading the page suggests the tab is being closed)
    this.addEventListener(document.documentElement, 'keyup', () => {
      if (this.ctrlKey) {
        requestAnimationFrame(() => {
          this.ctrlKey = false;
        });
      }
    });

    this.addEventListener(document.documentElement, 'keydown', (ev) => {
      this.ctrlKey = !!(ev.metaKey || ev.ctrlKey) && ev.code !== 'KeyR';
    });

    // Track form submissions
    if (this.options.trackForms) {
      this.addEventListener(document, 'submit', (ev) => {
        const target = ev.target as Element;
        if (
          target &&
          target.id &&
          (this.options.trackForms === true ||
            (typeof this.options.trackForms === 'string' &&
              this.elementOrParentMatches(target, this.options.trackForms)))
        ) {
          const name = target.getAttribute('name');
          this.reportEvent(`$form${name ? ':' + name : ''}`, {
            id: target.id,
            path: this.path,
          });
        }
      });
    }

    // Track clicks
    if (this.options.trackClicks) {
      this.addEventListener(document, 'click', (ev) => {
        const target = ev.target as HTMLElement;
        if (this.options.trackClicks === true && target) {
          if (target.tagName === 'A') {
            const href = target.getAttribute('href');
            if (
              href &&
              /^https?:\/\//.test(href) &&
              href.indexOf(location.origin) < 0
            ) {
              this.exit = true;
            }
          }
          if (
            target.tagName === 'BUTTON' ||
            (typeof this.options.trackClicks === 'string' &&
              this.elementOrParentMatches(target, this.options.trackClicks))
          ) {
            const text = target.innerText.slice(0, 50);
            if (text) {
              this.reportEvent(`$click:${encodeURIComponent(text)}`, {
                id: target.id,
                path: this.path,
              });
            }
          }
        }
      });
    }

    // Tracking scroll event helps with exit intent detection on mobile
    this.addEventListener(
      window,
      'scroll',
      debounce(() => {
        const scrollY = Math.max(0, window.scrollY);
        if (
          scrollY !== Infinity &&
          !Number.isNaN(scrollY) &&
          this.scrollY !== scrollY
        ) {
          this.scrollY = scrollY;
          this.maxScrollYPercent = Math.max(
            0,
            Math.min(
              1,
              Math.max(
                this.maxScrollYPercent,
                Math.round(
                  (scrollY / (window.outerHeight - window.innerHeight)) * 10
                ) / 10
              )
            )
          );

          // Scrolling back to the top on mobile suggests exit intent
          if (
            this.mobile &&
            this.options.exitIntentMobileScroll &&
            this.maxScrollYPercent > 0
          ) {
            if (!this.exit && scrollY < this.options.exitIntentOffset) {
              this.exit = true;
              this.emit('exit');
            } else if (this.exit && scrollY > this.options.exitIntentOffset) {
              this.exit = false;
              this.emit('reenter');
            }
          }
        }
      }, 150)
    );

    const onUriChange = () => {
      if (this.options.mode === 'fetch') {
        requestAnimationFrame(() => {
          this.reportPageview();
          this.submit(false);
        });
      } else {
        this.reportPageview();
      }
    };

    this.addEventListener(document, 'popstate', (ev) => {
      if (ev.state) {
        onUriChange();
      }
    });

    // hook into the pushState function to detect URI changes
    const pushState = window.history.pushState;
    window.history.pushState = function () {
      onUriChange();
      return pushState.apply(window.history, arguments as any);
    };
  }

  elementOrParentMatches(el: Element, selector: string) {
    return !!el.closest(selector);
  }
}

Object.assign(window, {
  PrivianWebAnalytics,
});

if (PrivianWebAnalytics.ATTRS_OPTIONS.init !== false) {
  const PrivianWebAnalyticsInstance = new PrivianWebAnalytics();
  Object.assign(window, {
    PrivianWebAnalyticsInstance,
  });
}
