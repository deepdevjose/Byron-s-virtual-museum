# Asset Optimization

| Asset type | Recommended format | Recommended optimization | Notes |
|---|---|---|---|
| Artwork image | JPEG or WebP | Resize to practical display dimensions, compress visually, preserve color quality | Current gallery loads local image paths from `src/assets/images/`. |
| Artwork poster | JPEG or WebP | Use a dedicated poster image when video thumbnail differs from artwork image | Current code uses `image` as the video poster. |
| Artwork video | MP4 via Cloudinary delivery URL | Use `q_auto,f_auto,w_1280` transformation where appropriate | Do not commit video files to Git. |
| Audio guide | MP3 | Compress speech/music at a reasonable bitrate | Current audio files live in `src/assets/audio/`. |
| Procedural textures | CanvasTexture | Keep generated sizes appropriate for target hardware | Environment textures are generated in JavaScript. |
| Credits image | JPEG or PNG | Compress and size for modal display | Current credits image is `src/assets/credits/jose.png`. |
| Documentation figures | PNG or JPEG | Keep under practical Git size, crop browser chrome when possible | Place in `docs/figures/`. |
