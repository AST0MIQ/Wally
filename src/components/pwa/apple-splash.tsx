/**
 * iOS PWA launch images. iOS only uses a `<link rel="apple-touch-startup-image">`
 * whose media query matches the device exactly, so each entry is device-specific.
 * (Android / Chrome use manifest `background_color` + icon instead.)
 */
const SPLASHES: Array<{ w: number; h: number; dpr: number; href: string }> = [
  { w: 375, h: 667, dpr: 2, href: "/splash/iphone-8.png" },
  { w: 414, h: 896, dpr: 2, href: "/splash/iphone-xr.png" },
  { w: 375, h: 812, dpr: 3, href: "/splash/iphone-x.png" },
  { w: 390, h: 844, dpr: 3, href: "/splash/iphone-13.png" },
  { w: 428, h: 926, dpr: 3, href: "/splash/iphone-13-pro-max.png" },
  { w: 393, h: 852, dpr: 3, href: "/splash/iphone-15.png" },
  { w: 430, h: 932, dpr: 3, href: "/splash/iphone-15-pro-max.png" },
  { w: 768, h: 1024, dpr: 2, href: "/splash/ipad.png" },
  { w: 834, h: 1194, dpr: 2, href: "/splash/ipad-pro-11.png" },
  { w: 1024, h: 1366, dpr: 2, href: "/splash/ipad-pro-12.png" },
];

export function AppleSplash() {
  return (
    <>
      {SPLASHES.map((s) => (
        <link
          key={s.href}
          rel="apple-touch-startup-image"
          href={s.href}
          media={`screen and (device-width: ${s.w}px) and (device-height: ${s.h}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: portrait)`}
        />
      ))}
    </>
  );
}
