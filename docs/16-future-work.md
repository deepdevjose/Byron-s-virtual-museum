# Future Work

## Media And Artwork Content

- Standardize Cloudinary video delivery URLs for all animated artworks.
- Add optimized transformations such as `q_auto,f_auto,w_1280`.
- Add dedicated poster fields where video posters should differ from artwork images.
- Improve artwork metadata with curatorial text, dimensions, collection context, and rights notes.
- Add captions and transcripts for videos.
- Expand the audio guide beyond the current audio-capable artwork record.

## Experience And Accessibility

- Add multilingual support.
- Improve mobile controls after device testing.
- Add keyboard-only support review and focus management.
- Add WebXR exploration as an experimental track.
- Add a mini-map if it improves orientation without distracting from artwork.
- Add guided tour narration, pause, resume, previous, and next controls.

## Engineering And Performance

- Add a package manifest if the project adopts a test runner, formatter, or bundler.
- Add formal browser compatibility testing.
- Measure FPS, load time, GPU memory, and video startup time.
- Harden modal media cleanup by removing sources and calling `load()`.
- Add analytics or telemetry only if privacy, consent, and cultural context are handled responsibly.

## Documentation And Article Work

- Capture figures listed in `docs/figures/README.md`.
- Fill in performance tables after measurement.
- Convert the article plan into a full article draft.
- Add deployment notes after a live URL is available.
