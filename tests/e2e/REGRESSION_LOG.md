# E2E regression log

A running record of changes to the Playwright suite and what the latest runs found. Add an entry at the top for each suite change or notable run, and ship it in the same PR as the suite change. Fixes for failures go in their own PRs. Link the fixing PR back here, then mark the failure resolved.

Status values: **open** (failing, not yet picked up) · **in progress** (fix PR open) · **resolved** (fix merged, passes again).

---

## 2026-11-24: money invariants across write paths (exploratory session)

### Suite changes
- `finance.e2e.ts`: FIN-22 to FIN-28. Seller payments are now checked through every write path, not just the car's Money tab (FIN-21): Ledger add (car first: FIN-22; Purchase tag first: FIN-23), edit above or at the rate (FIN-24), move to another car (FIN-25), delete (FIN-26), lowering the rate (FIN-27). Each asserts the car's money and the Dues report as well as the screen acted on. FIN-28 covers a token from a buyer who backed out.
- `leads.e2e.ts`: LEAD-27 (Mark as sold from the car to a new lead: link + book + convert) and LEAD-28 (a salesperson can't sell through someone else's lead). `/leads/:id/sell` had no E2E coverage.
- `support/bugs.ts`: NEW-2 (fe#106) and NEW-3 (be#77) added to BUGS.

### Results (local, `--repeat-each 2`)
- FIN-22, 24, 25, 26, 27 and LEAD-27, 28: passed 2/2.
- **FIN-23: open** (NEW-2, [fe#106](https://github.com/abdulhasibn/autolead-frontend/issues/106)). Ledger: picking the Purchase tag before the car leaves Purpose on "Car cost", so the payment counts as a cost and the seller shows as unpaid.
- **FIN-28: open** (NEW-3, [be#77](https://github.com/abdulhasibn/autoLeadBackend/issues/77)). Product decision: a lost buyer's token is a refund owed to them and never counts towards the next buyer. A booked buyer's token stays on the car after they're marked lost; the next buyer's sale form counts it as already received.
- Details and repro steps are in the issues (from the exploratory session notes, 2026-11-24).
- Review follow-ups: car picker is searched by plate (it lists only the 10 newest cars); FIN-23 also saves and checks paidToSeller; FIN-28 checks the positive "will be recorded" line. Not covered: LEAD-27's "awaiting sale price" in Finance (leads project runs in parallel; kept out of the shared vault); LEAD-28 covers a lead not assigned to the salesperson only.

## 2026-11-23: WEB-07 alert check and FIN-08b row uniqueness

### Suite changes
- WEB-07 (`site.e2e.ts`): "no error alert" now only counts alerts with text. Next.js always renders an empty `role=alert` route announcer, so `toHaveCount(0)` failed even on success. No other spec used the pattern (`api-down` already filters by text).
- FIN-08b (`finance.e2e.ts`): the note now has a random suffix and the test waits for exactly one matching row before clicking. The prefix is per run, so `--repeat-each` (or a re-run in the same run) left several rows with the same note and tripped strict mode. Not an app bug.

### Results
- WEB-07: 1 passed. FIN-08b `--repeat-each=3`: 3 passed (was 3 failed before the fix).

## 2026-11-22 (night): leftover-run cleanup command

### Suite changes
- New `pnpm test:e2e:cleanup` (`tests/e2e/cleanup.ts`): lists E2E runs whose staff users still exist (interrupted runs, or runs copied by a database dump mid-run) and what each left behind. Dry run by default; `--apply` deletes, `--older-than <min>` and `--prefix <run>` narrow it. It uses the same `cleanupRun()` as teardown, refuses production, and re-audits after deleting (exit 1 if anything is left).
- `support/db.ts`:
  - `cleanupRun()` now also deletes the run's vehicle photo/document **files** from storage, and notifications about its vehicles or with `lead_id` set.
  - Runs are grouped by their real prefix (`support/run-prefix.ts`, unit-tested), so a run's extra staff (`-u01`, `-u04`, …) are cleaned together with its admin. Before, they were treated as separate runs.
  - Added `findLeftoverRuns()` and a read-only `auditRun()`. `sweepStaleRuns()` (global setup, runs older than 60 min) uses them.
- Dev dependency `tsx` to run the command.

### Why
The Sydney → Mumbai dev database dump was taken during run `e2e-mws0fybp-81262e`; teardown cleaned Sydney but not the copy. Deleting it through the Supabase MCP failed: its `execute_sql` declines destructive SQL here (the repo guard hook allows dev; the decline comes from the connector). Earlier flushes had worked around this with one-off scripts that weren't committed. This command is the tracked replacement.

### Run
- 2026-11-22, `lms_dev01`: `--apply --prefix e2e-mws0fybp-81262e` removed 5 test accounts, 78 owners, 35 vehicles, 45 leads, 44 contacts, 11 follow-ups, 13 notifications, 4 audit entries and 2 photos (rows and files). UAT data untouched (2 users, 1 owner, 2 vehicles, 3 leads remain). Dry run afterwards: no leftover runs. Logged in the backend's `docs/MIGRATIONS_LOG.md` → Data operations log.

---

## 2026-11-22 (evening): finance key guard and stale locators

### Suite changes
- **Finance key guard** (`support/provision.ts`): the configured `E2E_FINANCE_KEY` is tried once in global setup. If it's refused (wrong key or lockout), finance tests skip with a warning instead of failing and locking the shared vault. `E2E_SKIP_FINANCE=1` skips finance without sending any key. FIN-01 and FIN-18 (locked state) run without a key.
- **Env loader** (`support/env.ts`): a variable set to `""` is no longer refilled from `.env.e2e.local`. Workers re-run the loader. Before, they refilled `E2E_FINANCE_KEY` with the file's (stale) key after global setup had cleared it, so the "no key → skip" path never worked locally.
- **Dev overlays** (`fixtures.ts`): also hide the TanStack Query devtools button, which covered dialog Save buttons (USER-04).
- **Locators brought up to date with the app:**
  - leads list: exact lead-name match (the run's other leads share the prefix).
  - USER-04/07 seed: send the phone as +91 E.164 (`POST /users` rejects 10 digits; `showroomId: null` was not the cause).
  - FU-01/03: exact "Time" combobox (a loose match hit the "Date and time" trigger and closed the picker).
  - NUM-05, VEH-01, VEH-03: "Commission sale" is a radio; owner search results are buttons.
  - VEH-09/10/10b: empty photo slots read "Add front" since the drag-and-swap change (#69).
  - VEH-11/12: target the documents tab's file input, not the photos one.
  - VEH-17/18/19: match the plate in the visible list (the page renders a hidden phone list first).
  - VEH-20 and FIN-14: `api.createLead()` returns `fullName`/`phone` (the API sends `contactFullName`/`contactPhone`; `undefined` crashed one test and matched anything in the other).
- **Expectations updated:** LEAD-05 ("-5", "abc"), LEAD-21 (Max km) and VEH-05 (Km "-5", "12.5") now check that the number fields keep digits only. The fields strip other characters as you type, so there's nothing to mark invalid.
- **Known-bug tags:** dropped for closed issues FN-1 (FIN-08), DI-2 (FIN-13b) and DI-3 (FIN-15).

### Latest run
- **When:** 2026-11-22, locally, with `E2E_SKIP_FINANCE=1`.
- **Against:** CRM on `next dev`, backend `pnpm dev` on `dev`.
- **Scope:** leads, users, follow-ups, vehicles, drafts, owners, navigation, finance.
- **Result:** all 26 targeted test-side failures now pass except USER-03/04 (below). Finance: FIN-01 and FIN-18 pass, the rest skip. Remaining failures are known bugs plus the items below.
- **Incident:** the first run of this change still sent the stale key (the env-loader bug above), which locked the `lms_dev` finance vault for about 15 minutes, around 21:30–21:55 IST. Fixed before the second run, which sent no key.

### Failures

| ID | Test | Symptom | Suspected cause | Status | Fix PR |
|---|---|---|---|---|---|
| USER-03, USER-04 | role checkboxes in Add/Edit staff | Add staff: the Salesperson untick didn't register. Edit staff: toast says "updated" but `user_roles` still showed Admin | **Test problems, not an app bug.** Removing a role soft-deletes the row (`deleted_at`, `save_staff_user`), and `roleIds()` read it without `deleted_at=is.null`. The Add staff click landed while the sheet was still animating open (the same checkbox unticks fine in Edit staff) | in progress: fixed in the triage PR (`test/e2e-triage-fixes`) | #85 |
| NAV-03 | `/leads/<random uuid>` shows not found | `next dev` error overlay instead of "Lead not found" | **Real app bug.** The lead page fetched the lead and its open follow-ups in one `Promise.all`; for an unknown id both answer 404, and when the follow-ups call rejected first its raw `ApiError` skipped `notFound()` | in progress: fixed in `fix/lead-detail-not-found` (frontend) | #84 |
| OWN-06 | Unicode owner name stored intact | No "Owner created" toast for `Zoë 😀 ராஜ் …` | **Test problem, not an API rejection** (the API only checks the name is non-empty). The first half left a bad-email draft in the create form's IndexedDB draft; after the reload it was restored over the second fill and the browser blocked the submit. The Unicode create now goes first | in progress: fixed in the triage PR | #85 |
| (flaky) | VEH-05 year, VEH-20 | Random `401 Authentication is required` mid-run | Not explained. The backend gap is real (`SupabaseAuthAdapter.verify()` turned any Auth error, including outages and rate limits, into 401), but this run's backend was still on the old Sydney project, so the lms_dev01 Auth logs can neither confirm nor rule it out. Also possible: a worker's one login outliving its token. The helper now signs in again once on a 401 | backend hardening in `fix/auth-verify-provider-errors`; retry in the triage PR | abdulhasibn/autoLeadBackend#65, #85 |
| WEB-07 | test-drive request | Not rerun, to avoid adding to the public rate limit | **Not the rate limit** (a 429 shows a different message, and `public_request_log` held no burst). The dev backend's `.env` had no `PUBLIC_SITE_ORIGINS`, so the browser blocked the site's call (CORS). Config only; restart the backend after adding it | config, no code change | |
| LEAD-18, FIN-* | finance flows | Skipped: no working key | Add the new key to `tests/e2e/.env.e2e.local`, then run `--project=finance` | open | |

---

## 2026-11-22: drafts, follow-ups, navigation, notifications, site and users specs

### Suite changes
- New specs: `drafts.e2e.ts`, `followups.e2e.ts`, `navigation.e2e.ts`, `notifications.e2e.ts`, `site.e2e.ts`, `users.e2e.ts` (66 tests in total across these files plus setup).
- `fixtures.ts`:
  - `signIn` accepts landing on `/leads` (salespeople) as well as `/dashboard`.
  - Test visits no longer reach the public site's visitor analytics: the `/public/events` beacon is dropped.
- `support/db.ts`: run cleanup also deletes notifications about the run's leads. Website test-drive leads notify every admin, real ones included.
- `eslint.config.mjs`: `no-explicit-any` is off for `tests/e2e/**`, since the helpers read untyped JSON.

### Latest run
- **When:** 2026-11-22, locally
- **Against:** CRM on `next dev` (:3001), site on `pnpm dev` (:3002), backend `pnpm dev` (:4000) on `feat/vehicle-photo-reorder` @ `b7a371b`. Not on `dev`, so rerun against the backend's `dev` branch before treating backend-side failures as real.
- **Scope:** the six new spec files only.
- **Result:** 58 passed · 7 failed · 1 skipped.

### Failures

| ID | Test | Symptom | Suspected cause | Status | Fix PR |
|---|---|---|---|---|---|
| USER-04 | promote a salesperson to admin and back | Seeding `POST /users` → 422 `VALIDATION_ERROR` | `/users` request schema changed; `support/provision.ts` sends `showroomId: null` | open | |
| USER-07 | deactivate a salesperson; they can no longer sign in | Same 422 while seeding | Same as USER-04 | open | |
| USER-03 | required fields, short password and no role are caught | Unticking the Salesperson checkbox in "Add staff" doesn't change it ("element is not stable") | Clicked during the dialog's opening animation; wait for it to settle, or click the label | open | |
| FU-01 | schedule a call for tomorrow 10:00 IST | Option `10:00 AM` never appears (timeout) | Picker does list `h:mm a` slots; test likely opens the wrong control or the list needs scrolling | open | |
| FU-03 | complete with an outcome and schedule the next one | Option `11:00 AM` never appears (timeout) | Same as FU-01 | open | |
| NUM-05 | vehicle km driven is grouped and saved as a number | No "Commission sale" button in Add vehicle (timeout) | The label exists (`ACQUISITION_TYPE_LABELS.consignment`) but is probably a select option, not a button; use `pick()` | open | |
| WEB-07 | a test-drive request becomes a website lead; car linked; admins told | Site shows "We couldn't send that just now…" | Public lead endpoint failed. **Possibly a real bug**: check the backend log before changing the test | open | |

### Skipped
- One test skipped by its own guard (date or time-of-day condition, or existing data). Expected; not a failure.
