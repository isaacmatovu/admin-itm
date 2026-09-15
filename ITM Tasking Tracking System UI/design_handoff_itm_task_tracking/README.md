# Handoff: ITM Africa — Task Tracking System (Staff app + Admin app)

## Overview

An internal task tracking system for ITM Africa. Staff create tasks for themselves and
track their own work; Admins approve or send back those tasks, assign work to others, and
oversee the company. It ships as **two independent frontend applications** that share a
backend, a design language, and an authentication flow — not one app with a role switch.

The governing product idea, which the UI encodes throughout: **a task has two independent
status tracks.** *Approval status* is the Admin's track (Pending Approval → Needs Changes →
Approved). *Work status* is the assignee's track (Not Started → In Progress → Done). Neither
gates the other. A staff member can be working — even finished — on a task that has not been
approved. Do not add validation that couples them.

The second idea: **overdue is quiet.** Overdue state is surfaced on screens the user chooses
to open, plus a single weekly digest email. There are no push notifications, no red badges
in chrome, no interruptions. Resist the urge to add them.

## About the design files

The two `.dc.html` files in this bundle are **design references authored in HTML** —
prototypes that show intended layout, states, copy and behaviour. They are **not production
code to copy**. Your task is to recreate these designs in the target codebase's existing
environment (React, Vue, Svelte, whatever is established), using its routing, data-fetching,
form and component conventions. If no frontend exists yet, choose an appropriate stack and
implement there.

**Data:** all data in the design files is fixture data, hardcoded for review purposes. The
real implementation fetches everything from the backend API. Treat the fixture arrays
(`TASKS`, `QUEUE_PENDING`, `QUEUE_CHANGES`, `USERS`, `AUDIT`, `WORKLOAD`) as
**shape hints and realistic content examples only** — not as a schema and not as seed data.
Field names in this README describe what each screen needs to render; map them onto the
actual API contract.

**Reading the design files:** each file contains *every* screen of that app in one document,
with two review-only control bars at the top — an app label + light/dark toggle, and a row
of state chips. **Those bars are scaffolding for design review and must not be built.** The
real app has the sidebar and the main content area only. To enumerate what to build, read:

- the `SCREENS` map at the top of the logic class — screen id, title, route, and the full
  list of states each screen must support;
- the per-screen blocks in `renderVals()` — each computes exactly what that screen renders
  in each state.

## Fidelity

**High fidelity.** Colors, type, spacing, component structure and copy are final and come
from a bound design system (see *Design tokens*). Recreate faithfully. Copy in the designs is
production copy — use it verbatim unless a stakeholder changes it.

## The two applications

| | Staff app | Admin app |
|---|---|---|
| Users | Everyone with role `Staff` | Everyone with role `Admin` |
| Landing route | `/` (My Tasks) | `/admin` (Company Overview) |
| Screens | TT-01, TT-02, TT-03, TT-04, TT-05, TT-06 | all of the above **plus** TT-07 … TT-11 |
| Sidebar groups | My work | My work · Administration |
| Task creation | For self only; assignee field is locked | Assign to any active user; auto-approved |
| Approval powers | None | Approve, send back, reassign, delete |

**Shared, not duplicated.** Auth (TT-01, TT-02), the task list/detail/create surfaces
(TT-03 … TT-06), the sidebar shell, the status badges, the two-track status controls and the
whole token layer should live in a shared package consumed by both apps. What differs is
route composition, the sidebar's Administration group, and role-conditional affordances
inside TT-05 and TT-06 (documented per screen below).

An Admin is also a working person: TT-03 through TT-06 in the Admin app show **that admin's
own tasks**, exactly like a staff member's, with an added link across to TT-07. Do not turn
TT-03 into a company view for admins — that is TT-07's job.

## Routes

| ID | Screen | Route | App |
|---|---|---|---|
| TT-01 | Login | `/login` | both |
| TT-02 | Two-factor verification | `/verify-2fa` | both |
| TT-03 | My Tasks (landing) | `/` | both |
| TT-04 | Task List | `/tasks` | both |
| TT-05 | Create Task | `/tasks/new` | both |
| TT-06 | Task Detail | `/tasks/:id` | both |
| TT-07 | Company Overview | `/admin` | admin |
| TT-08 | Approval Queue | `/admin/approvals` | admin |
| TT-09 | Approve / Send Back | overlay on `/admin/approvals` | admin |
| TT-10 | User Management | `/admin/users` | admin |
| TT-11 | Login Audit Log | `/admin/login-audit` | admin |

Every route except `/login` and `/verify-2fa` requires an authenticated session that has
cleared 2FA. Admin routes additionally require role `Admin`; a staff user hitting one gets a
404, not a "no access" page — the admin app is not part of their world.

## Application shell

A fixed left sidebar, main content to its right.

- **Sidebar**: 244px max / 190px min, `flex: 1 1 200px`. Background `var(--color-surface)`,
  1px right border `var(--color-divider)`. Padding `20px 0 30px`, 22px gap between groups.
- **Brand**, top: a 26px accent-filled square with "IT" in `--font-heading` 13px, beside the
  app name in `--font-heading` 15px, uppercase, `.08em` tracking. Staff app: "Task
  Tracking". Admin app: "Task Tracking · Admin".
- **Nav groups**: a 10px uppercase `.16em` label at 45% opacity, then items. Item = 13.5px,
  min-height 38px, padding `7px 18px`, 2px transparent left border, hover
  `color-mix(in srgb, var(--color-text) 6%, transparent)`. **Active** item: left border
  `var(--color-accent)` and background `color-mix(in srgb, var(--color-accent) 16%, transparent)`.
  (The screen-id prefix shown in the design's nav is review metadata — drop it, keep the label.)
- **User block**, pinned bottom with a top divider: 30px hairline-bordered initials square,
  name at 13px, role at 10px uppercase `.14em` at 50% opacity. Needs a sign-out affordance,
  which the design does not show — add it here per codebase convention.
- **Page header** in main: a 10px uppercase `.18em` kicker in `--color-accent-700`, then an
  `<h2>` at 30px, with a 1px bottom divider. Main padding `26px 22px 60px`, 22px gap.
  (The design also prints the route and a spec note here — review-only, drop both.)
- **Responsive**: the shell is a wrapping flex row, so the sidebar drops above content on
  narrow viewports. Every table is wrapped in `overflow-x: auto` with a `min-width`; filter
  bars and card grids wrap via `flex-wrap` and `repeat(auto-fit, minmax(…, 1fr))`. No fixed
  heights on text containers.
- **Theme**: light and dark are both designed and both must ship, with a persisted user
  preference. Implementation in the design is a `data-itm-theme="dark"` attribute on
  `<html>` that overrides the token block — mirror that approach (attribute or class on root,
  tokens redefined, nothing else changes).

## Screens

---

### TT-01 · Login — `/login`

**Purpose:** the single entry point. Google OAuth 2.0 only.

**Layout:** the card centred in the viewport, `min-height: 440px`, `max-width: 400px`,
padding `40px 34px`, contents centred in a 20px-gap column. It is a blueprint frame with all
four corner marks.

**Contents, in order:** 46px accent square with "IT"; "ITM AFRICA" in `--font-heading` 24px
uppercase `.1em`; "TASK TRACKING" at 13px uppercase `.18em`, 55% opacity; the error banner
when present; the sign-in button (`.btn-secondary`, full width, min-height 46px, 14px, with
a 17px Lucide icon at stroke 1.5, label "Sign in with Google"); helper text "Use your ITM
Africa Google account to continue." at 12.5px, 60% opacity, max 28ch.

**States**
- `idle` — as above.
- `redirecting` — button label becomes "Signing in…"; a pulsing 60×3px bar plus "Redirecting
  to Google…" at 12px appears below it.
- `error` — a banner above the button: background `--st-changes-bg`, text `--st-changes`,
  2px left border in the same, 13px, a 15px alert icon, copy "Sign-in failed, please try
  again." Deliberately non-specific — never reveal whether an account exists.

**Build notes:** no ITM password field, no self-registration, no forgot-password link ever.
A successful Google login creates the local account if absent, or matches it if present.
Every attempt — success or failure — writes a row to the TT-11 audit log.

---

### TT-02 · Two-factor verification — `/verify-2fa`

**Purpose:** a hard, unskippable TOTP gate on **every** login. There is no "remember this
device for 30 days".

**Layout:** centred card, `max-width: 430px`, padding `34px 30px`, 20px column gap,
blueprint frame with corner marks. Header row: 18px accent lock icon + heading in
`--font-heading` 20px uppercase `.06em`. Helper paragraph at 13px, 70% opacity.

**Code input:** label "6-DIGIT CODE" at 11px uppercase `.14em`, then six equal boxes in an
8px-gap flex row — each `flex: 1`, 48px tall, `--font-heading` 22px, centred, 1px border
`--color-divider`, darkening to `color-mix(in srgb, var(--color-text) 45%, transparent)`
when filled. Then the primary verify button, full width, min-height 44px. Footnote: "Required
on every login — no exceptions." Implement as a real segmented code input: autofocus, one
digit per box, paste-a-whole-code support, arrow/backspace navigation, auto-submit on the
sixth digit, `autocomplete="one-time-code"`.

**States**
- `enroll` (first login) — heading "Set up your authenticator", helper explains the one-time
  setup, and a setup panel appears above the input: `--color-surface` background, 1px
  divider border, 16px padding; a 122px QR square on `--color-bg` with a hairline border,
  beside instructions plus the secret in a `<code>` block on `--color-bg`, 12.5px, `.1em`
  tracking, grouped in fours for manual entry.
- `entry` — heading "Two-factor verification", helper "Enter the 6-digit code from your
  authenticator app."
- `verifying` — button reads "Verifying…" and is disabled.
- `incorrect` — all six boxes take a `--st-changes` border; a 12.5px message in
  `--st-changes` below reads "Incorrect code, please try again. N attempts remaining." with a
  live count.
- `locked` — boxes drop to 45% opacity, button disabled, and a banner (`--st-changes-bg`,
  `--st-changes` text, 2px left border, clock icon) reads "Too many attempts. Try again in
  15 minutes." Lockout is 3 failed attempts → 15 minutes, enforced server-side.
- `stepup` — heading "Verify this device", helper "We noticed a new device — please verify
  again." Triggered by a device-fingerprint mismatch; the audit log records the fingerprint
  result.

---

### TT-03 · My Tasks — `/`

**Purpose:** the personal landing page. Everything you are working on, both tracks at a
glance. Identical in both apps, save one extra card for admins.

**Layout, top to bottom** (22px gaps):
1. **Greeting row** — "Good morning, {firstName}" as an `<h3>` at 26px (time-of-day aware),
   the date beneath at 13px, 60% opacity; a primary **Create Task** button on the right
   (blueprint frame, square corners, min-height 40px, 15px plus-icon) → TT-05.
2. **Needs-changes banner**, only when ≥1 of your tasks was sent back. Blueprint frame, 2px
   left border `--st-changes`, padding `15px 17px`. Title row in `--font-heading` 15px
   uppercase `.06em` in `--st-changes` with a reply-arrow icon: "N task(s) sent back for
   changes". Then the task id + title at 14px, then the reviewer's note italicised at 13px,
   75% opacity, attributed "— {reviewer}, {date}". Actions right: **Open** (secondary) →
   TT-06, and **Resubmit** (primary), which resubmits without leaving the page. This banner is
   the whole notification system for send-backs — nothing is emailed.
3. **Stat grid** — `repeat(auto-fit, minmax(140px, 1fr))`, 12px gap. Four blueprint cards,
   padding `15px 16px`: a 10px uppercase `.16em` label at 55% opacity, the number in
   `--font-heading` 38px, and a 11.5px sub-line at 55%. Cards: **Not started** ("N awaiting
   approval"), **In progress**, **Done** ("Closed this month"), **Overdue**. The Overdue number
   turns `--st-over` when non-zero, sub-line "Past due, not yet done" / "All clear" at zero.
4. **Task list** — an "MY TASKS" `<h4>` at 17px uppercase `.08em` with a "Full list →" link
   to TT-04, then the rows.
5. **Admin-only card** (admin app) — blueprint frame on a
   `color-mix(in srgb, var(--color-accent) 8%, transparent)` ground: kicker "ADMIN", title
   "Company Overview" in `--font-heading` 18px, a live one-line summary ("7 overdue · 5
   pending approval · 2 need changes"), and a secondary button "Open overview →" → TT-07.

**The task row** (used here and echoed in TT-04) is the system's core object. Blueprint frame,
padding `13px 15px`, a wrapping flex row, 12/16px gaps, space-between. Left: the task id at
10.5px tabular at 50% opacity, then the title as a link at 15.5px in `--color-text` turning
`--color-accent` on hover → TT-06; beneath it a wrapping badge row — approval badge, work
badge, and a date chip. Right: the label "WORK STATUS" at 10px uppercase `.14em` at 45%,
then a 3-option segmented control (Not started / In progress / Done) at 11.5px, padding
`5px 9px`. **The segmented control writes immediately on change — optimistically, no save
button, no confirmation, and no dependence on approval status.** When the task is overdue the
row gains a 2px `--st-over` left border.

**Date chip logic** — one of exactly three renderings:
- overdue → bordered chip in `--st-over`: "Overdue · due {date}"
- approved, not overdue → plain 12px text at 60%: "Due {date}"
- not yet approved → plain 12px text at 60%: "Awaiting approval · {duration} requested"

**States:** `loaded`; `empty`; `overdue` (≥1 overdue row, banner sorting them first);
`changes` (send-back banner present); `loading`.

**Empty state:** a blueprint panel, padding `54px 26px`, centred — 34px accent list icon,
"NO TASKS YET" in `--font-heading` 21px uppercase, body "Everything you're working on will
live here. Create your first task to get started." at 13.5px/65% max 40ch, and a primary
"Create your first task" button. Stat cards still render, all zeroes, uncolored.

**Loading state:** skeletons, not a spinner — a 34×260px title bar, four 86px stat blocks in
the same grid, then four 66px row blocks. Skeleton = `--color-text` fill, 2px radius,
opacity pulsing .28 → .12 over 1.6s ease-in-out.

---

### TT-04 · Task List — `/tasks`

**Purpose:** a working list for scanning and triaging **your own** tasks. Not a company view.

**Filter bar:** a blueprint frame, padding `14px 16px`, wrapping flex row of `.field`
groups, 12px gap, bottom-aligned. Search title (`flex: 2 1 210px`, placeholder "e.g.
payroll"); Work status (`flex: 1 1 140px`, "Any work status" + the three values); Approval
status (`flex: 1 1 140px`, "Any approval status" + the three values); Date range
(`flex: 1 1 150px`, "Any date"). A ghost **Clear filters** button appears only once a filter
is set. Search should debounce; filter state belongs in the URL query so a filtered list is
shareable and survives reload.

**Table:** `.table`, full width, `min-width: 720px` inside `overflow-x: auto`, 13.5px.
Columns: **Task** (id at 10.5px tabular/50% + title link), **Approval** (badge), **Work
status** (badge), **Due / duration** (the same three-way date chip as TT-03), **Quick
action** (right-aligned select, min-width 128px, 12.5px, writing work status inline).
Task and Due are sortable — the design shows Task ascending by default.

**Footer:** row count left ("Showing 8 of 8 tasks", or "Showing 2 of 8 tasks · filters
applied"); right, a per-page select (25 / 50) and prev/1 of N/next buttons, disabled at the
ends.

**States:** `loaded`; `filtered` (inputs show their values, count reflects the subset,
Clear visible); `empty`; `loading` (a 38px header skeleton over five 44px row skeletons).

**Empty state:** blueprint panel, padding `48px 26px`, centred — 30px accent search icon,
"NO TASKS MATCH THESE FILTERS" in `--font-heading` 19px uppercase, and a secondary "Clear
all filters" button. Distinct from TT-03's empty state: this one means the filters are too
narrow, not that you have no work.

---

### TT-05 · Create Task — `/tasks/new`

**Purpose:** create a task. **This screen differs by app more than any other.**

**Layout:** two wrapping columns — the form at `flex: 2 1 380px` in a blueprint frame
(padding `22px 22px 24px`, 16px gaps), and a `flex: 1 1 250px` side column.

**Fields**
1. **Task title *** — text input, placeholder "Short, specific — what needs doing". Required.
2. **Description (optional)** — textarea, min-height 96px, plain text (no rich text),
   placeholder "Plain text. Context, links, anything the reviewer needs."
3. **Assignee** — *the app-specific field.*
   - **Staff app:** locked. A bordered read-only row on a
     `color-mix(in srgb, var(--color-text) 4%, transparent)` ground: 26px initials square,
     "{Full Name} (you)" at 14px, and a lock icon at 50% opacity on the right. Helper beneath:
     "Staff can only create tasks for themselves." Enforce server-side too.
   - **Admin app:** a select of active users, showing "{Name} — {Team}, {City}". Beneath it an
     info panel (`--st-progress-bg` ground, `--st-progress` text, 2px `--color-accent` left
     border, 12.5px, info icon): "Assigned tasks you create are approved automatically — the
     assignee will never see a pending state, and the due date is set the moment you save."
4. **Requested duration *** — a 78px number input beside a Days/Weeks segmented control.
   Helper: "An estimate, not a fixed date — the due date is set once this is approved."

**Actions:** primary submit, min-height 42px — labelled **"Submit for Approval"** in the staff
app, **"Create Task"** in the admin app — plus a secondary Cancel.

**Side column:** a blueprint "WHAT HAPPENS NEXT" card (10px accent-700 kicker, 13px body at
78%) whose copy differs by app:
- Staff: "This starts as Pending Approval with no due date. Admin confirms or adjusts the
  duration; the due date is set from the moment of approval. You can move the work status at
  any time, approved or not."
- Admin: "Tasks you assign skip approval entirely. The due date is computed the moment you
  save (today + duration) and the assignee sees it as Approved."

**States**
- `empty` — pristine, placeholders showing.
- `invalid` — offending inputs take a `--st-changes` border with a 12px message beneath
  ("A title is required." / "Enter a duration."). Validate on submit, then live per field.
- `submitting` — button reads "Submitting…" and is disabled; a pulsing bar sits beside it.
- `success` — a banner at the top of the form (`--st-approved-bg`, `--st-approved` text, 2px
  left border, check icon). Staff: "Submitted for approval. You can start work straight away —
  approval only sets the due date." Admin: "Task created and approved automatically. Due
  {date}. Opening the task…" Then route to TT-06.
- `discard` — leaving with unsaved input raises a confirm: a blueprint card with a 2px
  `--st-pending` left border, "DISCARD CHANGES?" in `--font-heading` 16px uppercase, body
  "You've started this task but haven't submitted it. Leaving now discards it.", and Keep
  editing / Discard buttons. (Shown inline in the side column in the design; build it as a
  modal or a route-guard prompt per codebase convention.)

**Rules:** a staff-created task is born `Pending Approval` with **no due date** — the field
does not exist yet, so never render a placeholder date. An admin-assigned task is born
`Approved` with `due = created_at + duration`. Both are born `Not Started`.

---

### TT-06 · Task Detail — `/tasks/:id`

**Purpose:** one task in full — both tracks, the complete history, and every action open to
your role. The clearest expression of the two-track model; get this screen right and the rest
follows.

**Layout:** main column `flex: 2 1 400px`, history sidebar `flex: 1 1 270px`, both blueprint
frames.

**Header:** task id at 10.5px `.12em` tabular at 50%, title as an `<h3>` at 26px, and an
**Edit** button (secondary, pencil icon) on the right — shown to admins always, and to the
owner only while the task is unapproved. Description beneath at 14px/80%, max 68ch.

**The status trio** — the heart of the screen. A `repeat(auto-fit, minmax(170px, 1fr))` grid
with 1px gaps over a `--color-divider` ground, so hairlines separate three
`--color-bg` cells (padding `12px 14px`). Each cell: a 10px uppercase `.16em` label at 55%,
the value, then an 11.5px note at 55%.
1. **Approval status** — the badge, plus provenance: "Submitted {date}" / "Sent back {date}" /
   "Approved {date} by {admin}".
2. **Work status** — the live segmented control, note "Editable regardless of approval."
   Always enabled for the assignee, in every approval state.
3. **Due date** *or* **Requested duration** — the label itself changes. Approved: "Due date",
   the date in `--font-heading` 19px (in `--st-over` when overdue), note "approved_at +
   {duration}" or "Overdue by N days". Unapproved: "Requested duration", the duration, note
   "Awaiting approval — no due date exists yet."

**Overdue notice** (approved + past due): a bordered row, 1px `--st-over`, text
`--st-over`, 13px, clock icon — "Overdue by N days. Visible here and on dashboards only — a
weekly email starts at day 7." That sentence is the notification policy; keep it.

**Send-back panel** (needs-changes state): `--st-changes-bg` ground, 2px `--st-changes` left
border, padding `14px 16px`. Header "SENT BACK — NOTE FROM ADMIN" in `--font-heading` 14px
uppercase `.1em`; the note quoted at 14px; attribution at 11.5px/60%. For the owner, a
primary **Resubmit for approval** button beneath.

**Actions**
- *Staff app:* the work-status control, Edit and Delete while unapproved. Delete sits below a
  divider as a ghost button in `--st-changes`, with the note "Available to you until it's
  approved." Once approved, the owner can change only work status.
- *Admin app:* an actions bar below a divider, prefixed "ADMIN ACTIONS" — **Approve…** and
  **Send back…** (both open TT-09, both disabled once the task is approved), **Reassign**, and
  a right-aligned ghost **Delete task** in `--st-changes`. Deletion always confirms first.

**History sidebar:** an "HISTORY" `<h4>` at 16px uppercase `.08em` with the right-aligned
note "APPEND-ONLY" at 10.5px/50%. Entries are a vertical timeline: a 7px square dot in the
event's color with a 1px `--color-divider` connector below it, 12px from the text; each entry
has the event type in `--font-heading` 12px uppercase `.12em` in its color, the detail at
13px/85%, and "{actor} · {timestamp}" at 11px/50% tabular. Event colors: created →
`--color-accent`; status change → `--st-progress`; sent back → `--st-changes`; resubmitted →
`--st-pending`; approved → `--st-approved`. Every state change, note and reassignment appends
an immutable row — nothing is ever edited or removed. Newest last, as the design shows;
paginate if it grows long.

**States:** `pending`, `changes`, `approved`, `overdue` (approved + past due), `done`.
Also handle not-found and no-access (a staff user opening someone else's task id).

---

### TT-07 · Company Overview — `/admin` *(admin only)*

**Purpose:** the admin landing page. Designed to be **checked voluntarily and reward a
glance** — nothing here is ever pushed.

**Stat grid:** `repeat(auto-fit, minmax(170px, 1fr))`, 12px gap. Three blueprint cards,
padding `17px 18px`: 10px uppercase `.16em` label at 55%, the number in `--font-heading`
44px, a 12px sub-line at 60%. **Total overdue** in `--st-over` ("Across N people"); **Pending
approval** in `--st-pending` ("Oldest submitted {date}"); **Needs changes** in
`--st-changes` ("Waiting on staff to resubmit"). Each should link into the matching filtered
list.

**High-overdue banner** (above a threshold): blueprint frame, 2px `--st-over` left border —
"N TASKS OVERDUE" in `--font-heading` 16px uppercase in `--st-over`, a 13px/75% line naming
where they cluster ("Concentrated in Payroll (11) and Onboarding (5). Nothing has been pushed
to anyone — this is here when you choose to look."), and a secondary "View overdue →" button.

**Workload chart:** a blueprint card at `flex: 2 1 340px` — "OPEN WORKLOAD PER PERSON"
`<h4>` at 16px uppercase `.08em` with the right-aligned qualifier "NOT STARTED + IN
PROGRESS" at 10.5px/50%. One 10px-gap row per person: name at 13px in a fixed 122px column
(ellipsised), then a 14px-tall bar track on
`color-mix(in srgb, var(--color-text) 7%, transparent)` with an accent fill scaled to the
highest count, then the count in `--font-heading` 16px in a 26px right-aligned tabular
column, then an "N overdue" chip bordered in `--st-over` at 10px when non-zero. Sorted
descending. Sourced from an aggregate endpoint, not by counting fetched tasks client-side.

**Shortcut column** (`flex: 1 1 230px`): two blueprint cards as buttons (hover border →
`--color-accent`), each with a 10px accent-700 "GO TO" kicker, a `--font-heading` 19px title,
and a live sub-line — **Approval Queue** ("5 pending · 2 need changes") → TT-08, and **User
Management** ("14 active · 2 admins") → TT-10. Beneath, an 11.5px/55% note: "The only thing
that reaches your inbox is the weekly overdue email. Everything else lives on this screen."

**States:** `loaded`; `zero` (all three cards read 0, uncolored, with reassuring sub-lines,
and the chart is replaced by "No open tasks anywhere. Nothing to balance." at 13.5px/60%);
`high`; `loading` (three 100px card skeletons over a 230px chart skeleton).

---

### TT-08 · Approval Queue — `/admin/approvals` *(admin only)*

**Purpose:** the admin's primary action list — dense enough to clear in one sitting.

**Tabs:** two tabs over a 1px `--color-divider` bottom rule, each `--font-heading` 15px
uppercase `.08em`, padding `9px 4px`, with a live count in the label. Inactive at 55%
opacity; active in full `--color-text` with a 2px `--color-accent` bottom border overlapping
the rule. **Pending Approval** and **Needs Changes** — the second tab tracks what admins are
waiting on staff to resubmit, so send-backs do not vanish.

**Table:** `.table`, `min-width: 760px` inside `overflow-x: auto`, 13.5px. Columns: Task
(id + title link, opens TT-09), Assignee, Requested (duration), Submitted (date, tabular),
Approval (badge), and a right-aligned secondary **Review** button (min-height 30px, 12px)
that opens TT-09. Default sort: oldest submission first — the thing waiting longest is at the
top. Bulk approve is deliberately absent; each task gets a decision.

**States:** `pending`; `changes`; `empty`; `loading` (a 38px header skeleton over four 44px
rows).

**Empty state:** blueprint panel, padding `52px 26px`, centred — 30px accent check icon,
"NOTHING WAITING ON YOU RIGHT NOW" in `--font-heading` 20px uppercase, "Both tabs are clear."
at 13px/60%. Both tab counts show 0 and neither reads as active.

---

### TT-09 · Approve / Send Back — overlay on `/admin/approvals` *(admin only)*

**Purpose:** the decision moment. **The one screen where a due date comes into existence.**

**Presentation:** a modal over the queue. Backdrop
`color-mix(in srgb, var(--color-accent-900) 55%, transparent)`; the dialog is a blueprint
frame on `--color-bg` with `--shadow-lg`, `max-width: 520px`, padding `22px 24px`, 16px
gaps, scrolling internally when tall. Needs a focus trap, Escape to close, and focus returned
to the invoking row.

**Header:** a 10px uppercase `.16em` accent-700 kicker "REVIEW · {taskId}", the title as an
`<h4>` at 21px, and a ghost icon-button close. Then the description at 13.5px/80%. Then a
meta row between 1px divider rules, 18px gaps: Assignee, Requested, Submitted — each a 55%
label over a 14px value.

**Work-status note** (when the assignee has already started): `--st-idle-bg` ground,
`--st-idle` text, 12.5px, info icon — "{Name} already marked this In Progress. That's
expected — work status runs independently of approval." This exists to stop admins reading
early work as a mistake.

**Duration and the due-date preview** — the critical interaction. A 78px number input beside a
Days/Weeks segmented control, both prefilled with what the staff member requested, and a ghost
adjust affordance. Below them, a panel bordered 1px in `--color-accent`: the kicker "DUE DATE
IF APPROVED NOW" at 10px uppercase `.16em` in accent-700, the date in `--font-heading` 21px,
and the formula "approved_at + {duration}" at 11.5px/55%. **This recomputes live on every
duration change, before anything is committed** — an admin must never approve without seeing
the date they are creating.

**Send-back note:** a textarea, min-height 78px, label "Send-back note (required to send
back)", placeholder "What needs fixing before this can be approved?". **Send back** stays
disabled until it is non-empty; attempting it empty puts a `--st-changes` border on the field
and the message "A note is required before a task can be sent back." beneath. A send-back
without a reason is not a valid action.

**Actions:** primary **"Approve · due {date}"** (min-height 42px, the date live in the label),
secondary **Send back**, right-aligned ghost Cancel.

**States**
- `idle` — duration as requested, preview computed from it.
- `adjusted` — admin has changed the duration; preview and the approve label both update.
- `notereq` — the empty-note error.
- `approved` — the dialog replaces its body with a confirmation: a 34px check-in-circle icon
  in `--st-approved`, "APPROVED" in `--font-heading` 22px uppercase in the same, body "Due
  {date}. The task is now Approved and off your queue — work status stays wherever {Name} left
  it." at 13.5px/75% max 42ch, and a secondary "Back to queue" button.
- `sentback` — the same layout in `--st-changes`, titled "SENT BACK", body "{Name} will see
  your note on his dashboard with a one-tap resubmit. Nothing was emailed."

**Rules:** `due_date = approved_at + duration` — computed from the moment of approval, never
from submission or creation. The admin may adjust the duration before approving; the adjusted
value is what the formula uses. Approving writes an `approved` history event including the
final duration; sending back writes a `sent_back` event including the note verbatim. Neither
action touches work status.

---

### TT-10 · User Management — `/admin/users` *(admin only)*

**Purpose:** promote, demote, deactivate.

**Filter row:** search name or email (`flex: 2 1 220px`, placeholder "e.g. Chiamaka"), a Role
select (All roles / Admin / Staff), and a 12.5px/60% count ("8 accounts · 7 active · 1 admin",
or "1 of 8 accounts" when filtered).

**Table:** `.table`, `min-width: 780px` inside `overflow-x: auto`, 13.5px. Columns: Name;
Email (70% opacity); Role (a bordered chip — accent-700 for Admin, `--st-idle` for Staff);
2FA (plain 12.5px "Enrolled", or a `--st-pending` bordered chip "Not enrolled" — the exception
is what needs attention); Account (plain "Active", or a `--st-idle` bordered chip
"Inactive"); Actions, right-aligned — a secondary **Promote to Admin** / **Demote to Staff**
and a ghost **Deactivate** / **Reactivate**. Deactivated rows render at 45% opacity and stay
in the table: the account is never deleted and its task history stays intact.

**States**
- `loaded`, `filtered`.
- `blocked` — **the last-Admin guard, a designed state rather than an edge case.** A
  blueprint banner with a 2px `--st-changes` left border: a 17px alert icon, "CAN'T DEMOTE THE
  LAST ADMIN" in `--font-heading` 16px uppercase in `--st-changes`, and body "{Name} is the
  only active Admin. Promote someone else to Admin first, then demote this account — the
  system will never leave zero active Admins." at 13.5px/80% max 62ch. The same guard blocks
  *deactivating* the last active admin. Enforce server-side; the UI explains rather than
  silently disabling.
- `deactivated` — a confirmation banner (`--st-approved-bg`, `--st-approved`, 2px left
  border, check icon): "{Name} deactivated. Her account stays visible below, greyed out, with
  her task history intact."

**Footnote,** 11.5px/55%: "Every role change and deactivation is confirmed in a dialog first.
The initial Admin is set in environment configuration, not here." Both destructive actions
open a confirm dialog before firing.

---

### TT-11 · Login Audit Log — `/admin/login-audit` *(admin only)*

**Purpose:** a low-frequency, read-only security record. A dense table is the right pattern —
no cards, no charts.

**Filter row:** User or email (`flex: 1 1 190px`, placeholder "Any user"), Outcome select
(Any outcome / Success / Failure), Date range (default "Last 30 days"), and an attempt count
at 12.5px/60%.

**Table:** `.table`, `min-width: 820px` inside `overflow-x: auto`, 13px, padding
`8px 10px` — tighter than the other tables on purpose. Columns: **Timestamp** (tabular);
**Account attempted** (the string typed, which may not be a real account); **IP address**
(tabular, 75%); **Result** (bordered chip — `--st-approved` "Success", `--st-changes`
"Failure"); **MFA** (plain 12.5px "Passed", a `--st-changes` chip "Failed", or "—" when login
failed before the 2FA step); **Fingerprint** (plain "Match", or a `--st-pending` chip for
"New device" / "Unknown").

**Footer:** "Read-only. Retained for security review." left; prev / "1 / N" / next right.
Server-side pagination — this table grows without bound. No row actions, no editing, no
deletion, no export in this version.

**States:** `loaded`, `filtered`, `empty` ("NO LOGIN ATTEMPTS RECORDED YET" in a centred
blueprint panel).

---

## Cross-cutting behaviour

**Status badge.** One component, six variants. `display: inline-flex`, 5px gap, padding
`2px 8px`, 11px, `.09em` tracking, uppercase, `--font-heading`, `white-space: nowrap`, a
tinted background, colored text, and a 1px border at
`color-mix(in srgb, {fg} 40%, transparent)`. Never rounded.

| Variant | Label | Text | Background |
|---|---|---|---|
| pending | Pending Approval | `--st-pending` | `--st-pending-bg` |
| changes | Needs Changes | `--st-changes` | `--st-changes-bg` |
| approved | Approved | `--st-approved` | `--st-approved-bg` |
| not_started | Not Started | `--st-idle` | `--st-idle-bg` |
| in_progress | In Progress | `--st-progress` | `--st-progress-bg` |
| done | Done | `--st-approved` | `--st-approved-bg` |

A second, lighter form appears throughout for metadata (overdue, roles, 2FA, audit results):
the same geometry, transparent background, colored text, hairline border. Use it when the
value is an exception worth noticing rather than a primary status.

**Loading.** Skeletons shaped like the content that will replace them, never spinners, on
TT-03, TT-04, TT-07 and TT-08. `--color-text` fill at 2px radius, opacity pulsing .28 → .12
over 1.6s ease-in-out. Respect `prefers-reduced-motion`.

**Optimistic writes.** Work-status changes apply immediately in the UI and reconcile with the
server after; on failure, revert and surface a non-blocking error. There is no save button
anywhere in the work-status flow.

**Errors.** Every screen needs a fetch-failure state, which the designs do not show. Follow
the banner grammar already established: `--st-changes-bg` ground, `--st-changes` text, a 2px
left border, an alert icon, 13px, plain-language copy plus a retry.

**Notifications.** In scope: the TT-03 send-back banner, the in-app overdue surfacing, and one
weekly overdue digest email starting at day 7. Out of scope, deliberately: push
notifications, per-event emails, chrome badges, unread counts.

**Accessibility.** `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`
comes from the design system — do not remove it. Status must never be conveyed by color alone;
every badge carries its text label. The status trio, the segmented controls and the code input
all need proper labels and keyboard operation. Icons are Lucide at stroke-width 1.5 and are
decorative — label the control, not the glyph. Body text meets 4.5:1 in both themes; keep it
that way.

## State model

**Per task**
- `approval_status`: `pending` | `changes` | `approved`
- `work_status`: `not_started` | `in_progress` | `done`
- `requested_duration`: { value, unit: days | weeks }
- `approved_duration`: set at approval; may differ from requested
- `approved_at`: null until approved
- `due_date`: null until approved, then `approved_at + approved_duration`
- `is_overdue`: derived — `due_date < today && work_status !== 'done'`. Never store it.
- `history[]`: append-only { event, detail, actor, timestamp }

**Transitions**
- staff creates → `pending` + `not_started`, no due date
- admin assigns → `approved` + `not_started`, due date set at save
- admin approves → `approved`, `approved_at = now`, due date computed, history appended
- admin sends back → `changes` + a required note, no due date, history appended
- staff resubmits → `pending`, history appended
- assignee changes work status → any value, any time, independent of approval

**Session:** authenticated + `mfa_verified` + role. 2FA is required on every login; a device
fingerprint mismatch forces the step-up variant of TT-02. Every login attempt writes an audit
row.

**Client-side:** current theme (persisted); TT-04 / TT-10 / TT-11 filter state (in the URL);
TT-08's active tab; TT-09's dialog state including the live duration and its computed preview;
optimistic work-status overlays pending confirmation.

## Data the screens need

Not a schema — this is what each surface has to render, to map onto the real API.

- **Task**: id, title, description, assignee (id, name, initials, team, city), approval status,
  work status, requested duration, approved duration, approved_at, approved_by, due date,
  created_at, history[]
- **User**: id, name, initials, email, role, team, city, mfa_enrolled, is_active
- **Audit row**: timestamp, attempted account string, IP, success, MFA outcome, fingerprint
  outcome
- **Aggregates** (server-computed, not derived client-side): my task counts by status; my
  overdue count; company overdue / pending / needs-changes counts; overdue clustering by team;
  open workload per person with per-person overdue counts; queue counts per tab; user counts.

Paginate TT-04, TT-08, TT-10 and TT-11 server-side; TT-11 especially, since it grows without
bound.

## Design tokens

**Do not hardcode values.** Everything comes from the bound **Industry** design system in
`_ds/industry-65f549d4-fc9f-45f3-b3d4-20783b24575b/`, included in this bundle. Port
`styles.css` — its `:root` block is the source of truth for color, type, spacing, radius and
shadow, and it carries the component classes the designs use (`.btn`, `.btn-primary`,
`.btn-secondary`, `.btn-ghost`, `.btn-icon`, `.field`, `.input`, `.seg`, `.seg-opt`,
`.table`, `.card`, `.blueprint`, `.tag`, `.dialog`). Read `readme.md` in that folder
before writing any UI — it explains the wireframe idiom the whole system depends on.

**Core tokens:** `--color-bg` #f2f2f3 · `--color-surface` #e9e9ea · `--color-text` #1d1f20
· `--color-accent` #5980a6, with 100–900 ramps for every role (`--color-accent-600/700/900`
are used heavily) · `--color-divider` · `--shadow-sm/md/lg` · `--space-*` · `--radius-*`.
**Type:** `--font-heading` Barlow Condensed (500/600/700) for headings, labels, numerals and
badges; `--font-body` Barlow (400/500/600) for everything else. Base 15px.

**Status tokens** are additions this product needs, defined on top of the system in the design
files' `<style>` block — port them as-is, in both themes:

```
light:  --st-pending #8a6410 / bg #f6ecd6   --st-changes #9c3f26 / bg #f8e2da
        --st-approved #2f6b45 / bg #dceee2  --st-idle #5d5d60 / bg #e4e4e7
        --st-progress #2c455d / bg #dbe8f4  --st-over #9c3f26
dark:   --st-pending #e8c274 / bg #3a3018   --st-changes #e8a189 / bg #3d2620
        --st-approved #93cfa9 / bg #1e3227  --st-idle #b7b7ba / bg #2c2f33
        --st-progress #a9c8e6 / bg #22303d  --st-over #e8a189
```

Dark mode also overrides `--color-bg` #17191b, `--color-surface` #1f2226, `--color-text`
#e6e7e9, `--color-accent` #7fa6cc, and the divider and shadow tokens. See the
`[data-itm-theme="dark"]` block in either design file.

**The Industry idiom, in short:** square corners everywhere — no border radius on cards,
figures or buttons. Cards and panels are transparent line drawings with hairline borders and
"+" registration marks at their corners (the `.blueprint` class plus four
`<i class="corner tl|tr|bl|br">` children); **never drop the marks from a framed element, and
never give a card a surface fill.** The solid accent primary button is the single deliberate
exception. Condensed headings over regular body text. Lucide icons at stroke-width 1.5. No
decorative color beyond the steel accent and the status tokens above.

## Assets

None. No images, and no icon files — every icon in the designs is an inline SVG traced from
Lucide; install Lucide in the target codebase and use the named icons rather than porting the
inline paths. Fonts load from Google Fonts (Barlow, Barlow Condensed); self-host if the
codebase does.

## Files in this bundle

- `ITM Staff App.dc.html` — the staff app: TT-01 … TT-06, all states, light and dark.
- `ITM Admin App.dc.html` — the admin app: TT-01 … TT-11, all states, light and dark.
- `_ds/industry-.../` — the Industry design system. `styles.css` is the token and component
  source of truth; `readme.md` explains the idiom; `components/` holds reference markup for
  every class.
- `support.js` — the runtime that lets the two `.dc.html` files open in a browser. Needed to
  view the designs; **not** part of the app and not to be ported.
- `ITM_Task_Tracking_Frontend_Architecture.docx` — the original architecture specification.
  **Where this README and the spec disagree, the spec wins on behaviour and rules; this README
  wins on layout and visual detail.**

Open either `.dc.html` in a browser to click through it. Use the app label and light/dark
toggle in the top bar, and the state chips below, to reach every documented state — and
remember that both bars are review scaffolding, not part of the app.
