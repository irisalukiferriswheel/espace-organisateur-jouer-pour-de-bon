# Organizer frontend preview

Open `preview.html`. This standalone frontend uses fictional names and temporary
in-memory selections only. It supports a local participant picker, capacity,
single-elimination bracket preview with byes, editing/reset, FR/EN and a bottom
QR/download/copy/native-share section. Nothing is saved or sent to players.

The QR deliberately encodes `https://example.org/jpdb-demo`. The destination is
illustrative, not an event or signup page. Sharing and copying explicitly say demo.

The preview is isolated from `index.html`, `app.js`, existing organizer workflows
and Wix bridge files. It loads only its own local assets, including the MIT-licensed
QR library. No external fonts, API requests, identity access, storage or messages
to Wix are used. Refresh resets the demo.

## Optional publication, after review

Branch: `codex/organizer-frontend-preview` in
`irisalukiferriswheel/espace-organisateur-jouer-pour-de-bon`, based on live commit
`047aefeb7022d52ee7c600308fddfa1cf630c78e`.

Publishing these additive files through the existing Pages workflow exposes:
`https://irisalukiferriswheel.github.io/espace-organisateur-jouer-pour-de-bon/preview.html`

The existing `/` organizer page remains unchanged. Review the separate preview
URL first. Using this demo in a Wix iframe would require explicitly choosing that
preview URL; no live iframe changes have been made. This frontend delivery has no
service prerequisites. No publication has been performed.

## Verification

Run `node preview-tests/preview.cjs` with Playwright, pngjs and jsqr available.
The test checks fictional selections, capacity, state during language changes,
three-player byes, editing, demo QR decoding, downloads, mobile layout, reload
reset and absence of external requests. Screenshots can be written by setting
`SCREENSHOT_DIR`.
