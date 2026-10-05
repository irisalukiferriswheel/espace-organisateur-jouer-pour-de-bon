# Organizer invitations and QR sharing

The creation form selects up to 50 players using public aliases and cities.
Saving a draft persists the selection and public-registration option; it does
not send invitations. Reopening loads the saved selection. A load failure blocks
saving until an explicit reload succeeds, preventing accidental loss of invitees.
New forms are invitation-only by default. The organizer can explicitly open
remaining places to other players.

Publication saves the draft, links the approved cause, saves its invitation plan,
then invokes the API publication transaction. Publication and dispatch are atomic
and retry-safe. Only a correlated success response containing a published event,
linked competition, and canonical registration URL shows the completion QR.

The QR encodes only the public event URL:
`https://www.jouerpourdebon.ca/competitions?jpdbEvent=<event UUID>`.
It contains no identity, session token, or invitation credential. Eligibility is
enforced by the server and database regardless of who shares it. The completion
panel supports copy/open, downloadable SVG QR, device sharing, Facebook, and
WhatsApp. Sharing is initiated by the organizer.

Players accept or decline in their private profile. Acceptance atomically adds a
registration, subject to profile, age, deadline, cause, and capacity checks.
Free registrations confirm immediately. Paid registrations reserve a place for
at most 30 minutes, bounded by the deadline/start; no payment is charged on
acceptance. Expired holds release their place. Declining does not register.

The participant panel shows confirmed registrations and active payment holds
with authoritative remaining places. It refreshes on request and every 15 seconds
while open. Only public aliases are exposed; contact data stays private.

## Integration contracts

Requests retain `source: "jpdb-organizer"`, a unique `requestId`, and `payload`.
Replies retain `source: "jpdb-wix"` and the matching ID. The immediate Wix parent
and expected origin are required. Wix resolves the member server-side.

| Request | Reply | Purpose |
| --- | --- | --- |
| JPDB_ORGANIZER_SEARCH_PLAYERS | JPDB_ORGANIZER_PLAYERS | Search public players before or after first save |
| JPDB_ORGANIZER_REQUEST_INVITATION_PLAN | JPDB_ORGANIZER_INVITATION_PLAN | Reload draft selections and access option |
| JPDB_ORGANIZER_REQUEST_INVITATIONS | JPDB_ORGANIZER_INVITATIONS | Published event invitation status |
| JPDB_ORGANIZER_SEND_INVITATIONS | JPDB_ORGANIZER_INVITATIONS_SENT | Explicit additional invitations |
| JPDB_ORGANIZER_REQUEST_PARTICIPANTS | JPDB_ORGANIZER_PARTICIPANTS | Participants and remaining places |

Draft payloads include `invitedPlayerIds` and `publicRegistration`. Old clients
omitting both retain the saved policy. Errors echo request IDs and safe messages.
Cause or plan save failures preserve the draft ID and prevent publication.

## Release and verification

Requires matching API migrations/routes, Wix bridge, player dashboard, and event
signup frontend. Deploy database/API first; then clients; enable both member
registration flags only after the complete flow is verified. Paid events also
require verified Zeffy setup. Preparing source does not publish or send invitations.

Browser tests: `tests/draft-workflow.cjs`, `tests/invitations-sharing.cjs`, and
`tests/creation-invitations.cjs`. URL tests: `node --test tests/share-url.cjs`.
Set `PLAYWRIGHT_MODULE`, optionally `BROWSER_CHANNEL` (Edge default). Independent
QR decoding uses `QR_DECODER_MODULE` (jsQR) and `SHARP_MODULE`. Tests intercept
synthetic data and create no live events, invitations, registrations, or payments.

QR library: vendored qrcode-generator 1.4.4, MIT. Retain its bundled license.
No external QR service receives event data. Actions spending settings unchanged.
