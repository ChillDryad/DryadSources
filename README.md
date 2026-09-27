# Dryad Sources

Suwatte v7 source catalogue for the reader sources maintained here.

## Toolchain

This project uses `@suwatte/toolchain` and Node.js 22 or newer.

```sh
npm install
npm test
npm run build
npm run serve
```

- `npm test` runs the source delegates with Suwatte's built-in emulator and validates the returned public payloads.
- `npm run build` writes a v7 catalogue to `dist/`, including `sources.json` (`catalogVersion: 2`) and one `.stt` bundle per source.
- `npm run serve` builds and serves that catalogue on the local network. In Suwatte, add the printed address from **Settings → Sources → Manage Sources**.

## Sources

The generated catalogue contains these v7 reader delegates:

- Atsumaru
- Comix
- DynastyScans
- Hiperdex / Hipertoon (`pt-BR`)
- Manga18FX
- MangaBall
- MangaGo
- nHentai
- OmegaScans
- ReadComicsOnline
- XoxoComic

AniList remains outside this catalogue because it is a tracker/auth integration, rather than a readable content source. It needs a separate migration to v7's auth and progress-sync capabilities.

## Cloudflare-backed sources

Comix, MangaGo, nHentai, and ReadComicsOnline are intentionally tested for Suwatte's `CloudflareError` path in the emulator. Their delegates report the challenge to the app; install them through `npm run serve`, complete the site's verification in Suwatte, and then verify cookie continuity and image loading on-device.

## Current source layout

- `src/sources/*/index.ts` — v7 default-export delegate entries with static `SourceInfo`.
- `src/shared/legacy-adapter.ts` — v7 boundary that converts the existing per-site parsers to the current delegate contract while retaining their site-specific request and parsing logic.
- `src/runners/` — retained v6 parser implementations used by the compatibility boundary during the staged rewrite.
- `tests/` — Node tests using `@suwatte/toolchain/emulator` and `@suwatte/toolchain/validate`.

The staged adapter keeps each source installable in Suwatte v7 now; site-specific parsers can be replaced one at a time without changing the catalogue identifiers.
