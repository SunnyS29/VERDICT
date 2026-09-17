# VERDICT audit — 17 September 2026

Scope: the decision calculations, input handling, result explanations, desktop and
mobile flows, dependencies, and the copy hosted in the portfolio. This was a code
and browser review, not an independent certification of the decision methods.

## Findings and fixes

| Finding | Effect | Fix |
|---|---|---|
| Equal TOPSIS scores selected the first option | Identical options were presented as a winner with 100% steadiness | Report all tied leaders; use a neutral 0.5 closeness when every distance is zero; record ties separately in sensitivity checks |
| Missing yes/no values defaulted to false | An unanswered feature could change the ranking | Require an explicit Yes or No and expose its selected state to assistive technology |
| Explanation templates treated equal features as advantages and overstated certainty | Results claimed superiority, future satisfaction, or interchangeable options without evidence | Explain actual feature differences and method results; identify the weight changes tested |
| Subtracting extreme finite inputs could overflow | Valid numeric input could produce NaN scores | Scale values before min–max normalization; validate answers before evaluating |
| Limited routes back to inputs | Revising options or scores required unnecessary restarts | Add Edit decision and Edit ratings; retain valid inputs and require values for newly added options |
| Long names and result controls could exceed narrow layouts | Mobile text and controls could overflow | Wrap long text and controls; test desktop and phone sizes |
| Website contained a separate React/Babel copy loaded from a CDN | The website could drift from the source and depended on runtime compilation and external scripts | Publish the same bundled production build and provide a repeatable portfolio sync command |
| No dependency lockfile or regression suite | Builds could vary and calculation regressions were unchecked | Pin tested packages, add a lockfile, calculation tests, and browser tests |
| Source repository Pages workflow failed with HTTP 404 | Each source push attempted to deploy to an unenabled Pages site | Run checks in this repository and publish through the portfolio's existing Pages setup |

## Verification

- 16 calculation tests: known AHP ratios and TOPSIS results, consistency, cost and
  benefit directions, equal and zero scores, tied leaders, sensitivity counts,
  missing answers, large finite numbers, and explanations.
- 12 browser checks: six workflows each at desktop and phone widths, covering the
  example, ties, explicit feature answers, zero/decimal inputs, edited ratings and
  options, keyboard focus, long names, and HTML displayed as text.
- Production build and dependency audit. The advisory service reported no known
  vulnerabilities in the installed dependency set at the time of this audit.

The feature weighting and ranking approach is retained. Scores still depend on the
values supplied, the selected priorities, and the current option set. Min–max and
vector normalization can change rankings when options are added or removed. The
sensitivity check covers one weight at a time, not every possible combination.

Decisions are not saved across reloads. Google Fonts is an external font request;
decision inputs are not sent to an API. The live portfolio also injects a Cloudflare
analytics script, which is outside this app source. No new account, storage service,
or licence change was introduced.
