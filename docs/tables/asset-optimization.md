# Asset Optimization

## Current Asset Inventory

| Asset class | Count | Payload | Location |
|---|---:|---:|---|
| Artwork/visual images | 27 | 9.96 MB | `src/assets/images/` |
| Local audio files | 2 | 4.51 MB | `src/assets/audio/` |
| Credits image | 1 | 0.93 MB | `src/assets/credits/jose.png` |
| Local committed videos | 0 | 0 MB | Videos are remote |
| Cloudinary video URLs | 29 | External | `src/data/artworks.json` |

## Optimization Policy

| Asset type | Current behavior | Recommended target | Rationale |
|---|---|---|---|
| Artwork images | Loaded locally and used as WebGL textures plus modal images | Normalize long edge to practical display size, compress visually, consider WebP fallback | Reduces startup and texture memory |
| Artwork posters | Reuses `image` field | Optional dedicated poster if video frame differs | Avoids extra field until needed |
| Artwork videos | Cloudinary MP4 URLs created lazily in modal | Standardize `q_auto,f_auto,w_1280` and mobile variants | Reduces bandwidth/decode cost |
| Audio guide | Local MP3 | Keep speech/music bitrate balanced; document duration/bitrate | Controls payload |
| Ambient audio | Local MP3 loop | Consider shorter loop if size becomes issue | 3.38 MB currently |
| Procedural textures | Generated at runtime with canvas | Keep generated texture dimensions bounded | Avoids repository payload but costs startup CPU |
| Documentation figures | PNG/JPEG in `docs/figures/` | Crop, compress, keep meaningful | Keeps docs useful without bloating repo |

## Largest Local Visual Assets

| File | Size |
|---|---:|
| `src/assets/images/Byron2.png` | 1.75 MB |
| `src/assets/credits/jose.png` | 0.93 MB |
| `src/assets/images/Naturaleza Muerta - Byron.jpg` | 0.85 MB |
| `src/assets/images/Rocas y Cielo - Byron.jpg` | 0.84 MB |
| `src/assets/images/Mosaico Homenaje a la Mujer - Byron .jpg` | 0.44 MB |
| `src/assets/images/Amanecer - Byron.jpeg` | 0.43 MB |

## Image Acceptance Criteria

Before committing new artwork images:

1. Confirm the image is referenced by `artworks.json`.
2. Confirm file name has no accidental duplicates or trailing spaces.
3. Confirm visual quality in both gallery texture and modal detail.
4. Keep individual image size below 1 MB unless justified.
5. Prefer JPEG/WebP for photographic or painterly images; PNG only when transparency or lossless quality is required.
6. Run `node scripts/validate-artworks.js`.

## Video Acceptance Criteria

Before adding or changing a video URL:

1. Do not commit MP4 files to the repository.
2. Confirm URL is HTTPS.
3. Confirm Cloudinary delivery works in browser.
4. Prefer documented transformation policy.
5. Test modal open, playback, pause, seek, and close.
6. Record metadata load time when doing performance QA.

