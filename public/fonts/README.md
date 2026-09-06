# Fonts — LINE Seed Sans TH

Wally's primary typeface. Licensed by LINE Corporation
(LINE Seed — free for commercial use). Installed distribution:

```
public/fonts/
├── Web/WOFF2/   ← used by the app (LINESeedSansTH_W_{Th,Rg,Bd,XBd,He}.woff2)
├── Web/WOFF/    ← legacy fallback src
├── Desktop/…    ← OTF/TTF (not used by the web app)
├── App/…
└── Game/…
```

`@font-face` declarations live in `src/styles/globals.css`, mapping:

| CSS weight | File |
| ---------- | ---- |
| 400–500 | `Web/WOFF2/LINESeedSansTH_W_Rg.woff2` |
| 600–700 | `Web/WOFF2/LINESeedSansTH_W_Bd.woff2` |
| 800–900 | `Web/WOFF2/LINESeedSansTH_W_XBd.woff2` |

Fallback stack: `"Noto Sans Thai", system-ui, sans-serif`.
