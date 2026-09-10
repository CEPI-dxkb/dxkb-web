## Summary

<!-- What changes and why. Link the Jira ticket, e.g. DXKBCORE-000. -->

## Root cause

<!-- For bug fixes: what was actually wrong, not just what you changed.
     Delete this section for features/chores. -->

## Changes

<!-- One bullet per file or logical change. -->

-

## How to test

<!-- Concrete steps a reviewer can follow. Assume a fresh pull of this branch. -->

1. Pull this branch and restart the server (`npm start`).
2.

### Reviewer notes

- **No build step is required.** `public/js/release/` is gitignored and is not
  updated by PRs. In dev mode (`production: false` in your local `p3-web.conf`,
  which is also gitignored) the server serves `public/js/` source directly, so a
  restart is enough.
- **Hard-refresh if you touched frontend files.** Dev mode sets a 1-hour
  `Expires` header on `/js/`, so use Ctrl+Shift+R (Cmd+Shift+R) to avoid testing
  a cached copy of a changed file.

## Checklist

- [ ] `npm test` passes
- [ ] No new lint errors on the lines I touched (`npm run lint`)
- [ ] Tested in a browser, not just via tests
