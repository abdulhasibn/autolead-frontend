# E2E regression log

A running record of changes to the Playwright suite and what the latest runs found. Add an entry at the top for each suite change or notable run, and ship it in the same PR as the suite change. Fixes for failures go in their own PRs. Link the fixing PR back here, then mark the failure resolved.

Status values: **open** (failing, not yet picked up) · **in progress** (fix PR open) · **resolved** (fix merged, passes again).

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
