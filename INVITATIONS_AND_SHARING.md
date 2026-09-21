# Invitations and event sharing

This frontend builds on draft lifecycle PR 8. Release only together with the
matching shared API and Wix bridge, coordinated by the registration/payment task.
It does not grant event access or determine payment eligibility.

## Publication and sharing

`JPDB_ORGANIZER_DRAFT_SAVED` must echo `requestId` and return `payload.event.id`.
A publication acknowledgment must contain `visibility: "published"`; otherwise
the editor and entered values remain and no success message or QR is shown.
The confirmed event is inserted into My Events immediately and a refresh is requested.
`JPDB_ORGANIZER_EVENTS` must echo its list request's `requestId`; stale list
responses are ignored. Legacy uncorrelated lists are accepted only before the first
save, so an older bridge cannot erase a just-confirmed event with an outdated list.

A shareable event must have `visibility: "published"`, a `competitionId`, and
server-provided `registrationUrl`. Its permitted form is:

`https://www.jouerpourdebon.ca/competitions?jpdbEvent=<event id>`

The UI does not invent a URL for a draft or an event missing its competition.
QR generation runs locally; no event data goes to an external QR service.
The share panel provides a copyable link, open link, and downloadable SVG QR.
The server retains all current visibility, invitation, eligibility and payment rules.
The unresolved public-versus-invitation-only QR policy is not changed here.

## Organizer message contract

All requests use `source: "jpdb-organizer"`, `requestId`, and `payload`.
Replies use `source: "jpdb-wix"` and the same `requestId`. The immediate Wix
parent window is the only accepted sender. The Wix backend derives the organizer
from its session; frontend identity or role claims must never grant access.

| Request | Payload | Reply | Reply payload |
| --- | --- | --- | --- |
| `JPDB_ORGANIZER_SEARCH_PLAYERS` | `{eventId,query,cursor}` | `JPDB_ORGANIZER_PLAYERS` | `{players:[{id,alias,city}],nextCursor}` |
| `JPDB_ORGANIZER_REQUEST_INVITATIONS` | `{eventId}` | `JPDB_ORGANIZER_INVITATIONS` | `{invitations:[{playerId,alias,status}]}` |
| `JPDB_ORGANIZER_SEND_INVITATIONS` | `{eventId,playerIds}` | `JPDB_ORGANIZER_INVITATIONS_SENT` | `{sentCount,invitations:[{playerId,alias,status}]}` |

Errors use `JPDB_ORGANIZER_ERROR`, matching `requestId`, and a user-safe `message`.
Search uses public aliases/cities only. Invitation management is available only
for owned published events with linked competitions. Search is explicit, paginated,
and requires two characters. Selection persists across searches, at most 50 per send.
Sending requires an explicit click; viewing/opening/searching never sends invitations.

Backend requirements: enforce ownership, recipient eligibility and batch limits;
atomically deduplicate repeated sends; do not reset an accepted or declined response;
never register or charge on send/accept. Statuses displayed are created, sent,
accepted, declined, revoked. Previously invited players cannot be resent from this UI.
Player profiles own Accept/Decline. Only acceptance unlocks their registration action,
subject to server checks, capacity and payment requirements.

## Verification

Run `node tests/draft-workflow.cjs` and `node tests/invitations-sharing.cjs` with
Playwright available, and `node --test tests/share-url.cjs` for URL boundary checks.
`PLAYWRIGHT_MODULE` and `BROWSER_CHANNEL` can select local
installations (Edge by default). For an independent QR decode assertion, provide
`QR_DECODER_MODULE` pointing to jsQR 1.4.0 and `SHARP_MODULE` pointing to sharp.
All browser requests use intercepted synthetic fixtures; no live invitations,
registrations, events or payments are created.

QR library: vendored qrcode-generator 1.4.4 from the npm registry, MIT license.
Tarball integrity: `sha512-HM7yY8O2ilqhmULxGMpcHSF1EhJJ9yBj8gvDEuZ6M+KGJ0YY2hKpnXvRD+hZPLrDVck3ExIGhmPtSdcjC+guuw==`.
Keep `vendor/qrcode-LICENSE.txt` with the library.

Production is not changed by preparing this frontend. GitHub Actions budget remains $0.
