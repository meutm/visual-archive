# MEU Timisoara 2026 Visual Archive

Static GitHub Pages gallery for public Google Drive photo folders.

No Google Cloud, no API key, no billing.

## How it works

`tools/generate-photos-manifest.mjs` reads the public Drive folder pages and generates `photos-data.js`.

The public site uses `photos-data.js` to render a native masonry gallery, album filters, and a lightbox.

## Update photos

Run:

```bash
node tools/generate-photos-manifest.mjs
node tools/cache-photos-locally.mjs
```

Commit the updated `photos-data.js` and `assets/photos`.

## Publish

Create a repository named `meu-timisoara-gallery`, push these files, then enable GitHub Pages:

`Settings -> Pages -> Deploy from branch -> main`

Final URL:

`https://meutm.github.io/meu-timisoara-gallery/`
