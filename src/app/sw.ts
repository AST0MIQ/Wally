/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  Serwist,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Cosmetic artwork served from Wally's Vercel Blob store.
 *
 * This MUST come before `defaultCache`, whose last-but-one rule sweeps up every
 * cross-origin GET into a `NetworkFirst`. A decorative `<img>` is a no-cors
 * request, so that strategy sees an opaque response, cannot store it, and the
 * image fails outright — which is why an uploaded background rendered in dev
 * (where the service worker is disabled) and on the machine that uploaded it
 * (already in the HTTP cache) but nowhere else.
 *
 * `statuses: [0, 200]` is what makes an opaque response cacheable. CacheFirst
 * suits the content: a blob URL is immutable — a re-upload gets a new path —
 * and the store already sends `cache-control: public, max-age=2592000`. It also
 * means an equipped theme keeps rendering offline.
 */
const cosmeticMedia: RuntimeCaching = {
  matcher: ({ url }) => url.hostname.endsWith(".public.blob.vercel-storage.com"),
  handler: new CacheFirst({
    cacheName: "cosmetic-media",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // update is applied only when the user taps the toast
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [cosmeticMedia, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

serwist.addEventListeners();
