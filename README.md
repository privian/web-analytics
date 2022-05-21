<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/privian/web-analytics/master/assets/logo.svg" alt="Privian Web Analytics" width="200">
  <br>
  Privian.io Web Analytics Script
  <br>
</h1>

<h4 align="center">Web analytics without cookies.</h4>

<p align="center">
  <a href="#what">What</a> •
  <a href="#features">Features</a> •
  <a href="#usage">Usage</a> •
  <a href="#configuration-options">Options</a> •
  <a href="#license">License</a>
</p>

## What

[Privian.io](https://about.privian.io) cookie-less web analytics is a better, privacy-friendly alternative to Google Analytics. It's without cookies, so you don't need to ask for consent (goodbye cookie banners!). Fully compliant with GDPR, CCPA.

This repo contains the analytics script for websites. Using this script with [Privian.io](https://about.privian.io) requires a paid subscription. But you can also send data to your own server.

## Features

- Cookie-less web analytics
- Respects DoNotTrack settings
- Auto-tracking of button clicks and form submissions
- Exit intent detection
- Custom events
- Supports single-page apps (SPA)
- Lightweight (< 4kB gziped)

## Usage

Insert the following script to every page of your website (to the bottom, before the closing `</body>` tag).

```html
<script
  defer
  src="https://cdn.privian.io/script.min.js"
  data-site-id="XXXXXXXXX"
></script>
```

If you want to send data to your own server:

```html
<script
  defer
  src="https://cdn.privian.io/script.min.js"
  data-site-id="XXXXXXXXX"
  data-submit-url="http://127.0.0.1/api/submit"
></script>
```

## Configuration options

All options can be passed as HTML data-\* attributes (e.g. `data-mode="fetch"` or `data-submit-url="..."`).

```ts
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
```

## License

MIT
