# Organizer frontend preview

Open `preview.html`. The default mode reads the existing public directory at
`https://jouer-pour-de-bon-api.onrender.com/v1/public/players`. The server filters
for `is_public=true`; the UI only retains display names from the ID/alias projection.
No private registry, credentials, identity, or write endpoint is used. Loading,
empty, invalid-response and error states never silently substitute fictional data.
The separate demo mode uses fictional names. Both modes use temporary in-memory
selections only. It supports a local participant picker, capacity,
single-elimination bracket preview with byes, editing/reset, FR/EN and a bottom
QR/download/copy/native-share section. Nothing is saved or sent to players.

The QR deliberately encodes `https://example.org/jpdb-demo`. The destination is
illustrative, not an event or signup page. Sharing and copying explicitly say demo.

The preview is isolated from `index.html`, `app.js`, existing organizer workflows
and Wix bridge files. It loads only its own local assets, including the MIT-licensed
QR library. No external fonts, identity access, storage or messages to Wix are used. The only
network data request is a credential-free GET to the public directory. Switching
modes or refreshing the directory clears the selection. Refresh resets the demo.

## Optional publication, after review

Branch: `codex/organizer-frontend-preview` in
`irisalukiferriswheel/espace-organisateur-jouer-pour-de-bon`, based on live commit
`047aefeb7022d52ee7c600308fddfa1cf630c78e`.

Publishing these additive files through the existing Pages workflow exposes:
`https://irisalukiferriswheel.github.io/espace-organisateur-jouer-pour-de-bon/preview.html`

The existing `/` organizer page remains unchanged. Review the separate preview
URL first. Using this demo in a Wix iframe would require explicitly choosing that
preview URL; no live iframe changes have been made. This frontend delivery has no
service prerequisites. Publication is authorized for this additive preview only. The existing organizer
entrypoint and Wix embed remain unchanged.

## Verification

Run `node preview-tests/preview.cjs` with Playwright, pngjs and jsqr available.
The test checks fictional selections, capacity, state during language changes,
three-player byes, editing, demo QR decoding, downloads, mobile layout, reload
reset and absence of unexpected external requests. Run `node preview-tests/public-directory.cjs`
for real-data contract, privacy projection, loading/empty/error/retry and stale
response regressions. Screenshots can be written by setting
`SCREENSHOT_DIR`.

Live read verified on 2026-10-18: HTTP 200, success=true, 12 public profiles,
GitHub Pages origin permitted by CORS. No real names are stored in test fixtures.

## Complete original organizer composition

The revised preview.html preserves the complete original index.html form and uses
the unchanged app.js, styles.css and wix-sandbox-bridge.js. Its form opens by
default for review; the original create/close, preview and language interactions
remain. Original save/publish authorization is unchanged; standalone preview
does not gain Wix authorization. Tests never submit these actions.

New sections follow the complete original form in an automatically sized
preview-workflow.html iframe. Styling is isolated to prevent collisions. The
iframe receives only local title, capacity and language context from the same
origin parent; it does not receive identity or authorization. Its duplicate
intro and abbreviated event fields are hidden in composed mode. New selection,
bracket and illustrative QR behavior remain local and explicitly labeled.

Run preview-tests/composition.cjs to compare every original field's name, type,
required state, options and order, and verify original behaviors, FR/EN context,
appended section order, mobile layout and zero write requests.

## Separate fictional test pages

- preview.html: complete original organizer form, appended public picker, local bracket and share tools; fictional mode includes an explicit publication simulation.
- player-space-preview.html: separate test personal-space page with invitation accept/decline, joined test events and provisional bracket access.
- calendar-preview.html: separate test calendar with event details and capacity-aware joining.

Use the in-page links in the same tab. Only fictional numeric character IDs,
invitation statuses, registrations, capacity and public-access flag are stored
under sessionStorage key jpdb-fictional-journey-v1. No real public-directory
identities, entered event title, profile data or secrets are saved or put in URLs.
The test uses a fixed fictional event title. Reset clears this state; the browser
session retains it across page navigation/reloads. It is not shared with other
users/devices or production. New tabs can have separate/copy-on-open sessions.

Invitations do not reserve capacity. The free fictional scenario supports accept,
decline, outsider join, duplicate/full/restricted checks and provisional brackets.
No payment or eligibility check is represented as a real success. Browser-local
checks are not evidence of database concurrency guarantees.

Existing player-profile PR2 remains open and was inspected for invitation,
joined-event/schedule and response concepts. No production profile availability
is claimed and that repository is untouched. This implementation is additive to
the organizer preview repository only.

Run preview-tests/journey.cjs for actual cross-page navigation, acceptance,
decline, calendar joining, duplicate/full/restricted handling, invitation
capacity, profile bracket access, session consistency, privacy and zero writes.

## Invitation eligibility (frontend only)

The public picker requires BOTH event city and event game. The existing public
API exposes city labels and game slug/nameFr/nameEn, not a canonical city ID.
Comparison uses Unicode NFKC, trimmed/collapsed whitespace and case folding;
accents remain significant. It uses exact equality, never fuzzy/substring matching.
The event game must equal one of a profile's game slug or localized game names.
Missing city, event game or game interests fails closed. Multiple interests work.

Changing event city/game refilters immediately, removes newly ineligible selected
profiles with a visible explanation, and invalidates their bracket preview. A
late directory response is evaluated against the latest criteria. Only public
names are shown; city/interests are read for filtering, not rendered as a profile.
No extra restriction is applied to the fictional calendar self-join scenario.
Fictional demo identities remain an explicit separate scenario. This frontend
filter is not authoritative server enforcement; no production invitation write
endpoint, database policy, schema or backend behavior was changed.
