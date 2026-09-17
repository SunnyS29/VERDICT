# VERDICT

A browser tool for putting numbers to a decision. Enter the values of each option's
features, weigh how much those features matter to you, and compare the results.

[Open VERDICT](https://sunnysangar.com/VERDICT/index)

## Using it

1. Add 2–8 options and 3–6 priorities, such as price, comfort, and battery life.
2. Compare the priorities two at a time to work out their weights.
3. Enter a value for each option: a number, a 0–10 rating, or a yes/no answer.
4. Compare the rankings and see how they change when the weights are adjusted.

For numbers, choose whether lower or higher is better. For yes/no features, yes is
preferred. Ratings start at 5 and can be changed. A yes/no answer must be selected
explicitly; an unanswered question is not treated as No.

The result shows the leading option, its tradeoffs, your priority weights, and two
alternative ways of comparing the same inputs. Equal top scores are shown as a
tie. Use **Edit ratings**, **Redo the weighting**, or **Edit decision** to explore
changes without clearing everything.

The ereader example contains practice prices and ratings, not current product
information. It is there to demonstrate the workflow.

## How the numbers work

- **Weights:** pairwise comparisons use ratios of 1, 3, or 5 in either direction.
  AHP's row geometric mean method converts these into weights that sum to 100%.
  An approximate consistency ratio flags conflicting comparisons above 0.1.
- **Feature values:** numerical inputs are rescaled from 0 to 10 within the current
  option set, reversing the scale for costs. An equal-value column gets 5 for every
  option. Yes/no becomes 10/0, and rating sliders already use 0–10.
- **Main ranking:** TOPSIS applies vector normalization and the weights, then scores
  each option by its distance from the best and worst feature combinations.
- **Cross-checks:** weighted sum adds the weighted scores; minimax regret finds the
  smallest worst weighted shortfall on any one feature.
- **Sensitivity:** each weight is multiplied by 0.75 and 1.25, one at a time, and
  all weights are rescaled to sum to 100%. A shared lead is recorded separately
  from keeping a sole lead.

A relative score of 80 is not an 80% chance of being satisfied. The numbers describe
the options and inputs you supplied. Adding or removing an option can change the
normalization and rankings. Preferred features are weighted tradeoffs, not hard
requirements that automatically exclude an option.

Weights and ratings are processed in your browser, with no accounts or decision
API. The app loads Google Fonts, but does not send decision inputs to a server.
Decisions are held in memory: reloading or closing the tab clears them.

## Development and checks

Use Node.js 24 and pnpm 11.19.0 (recorded in `package.json`).

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open the local `/VERDICT/` URL printed by Vite. To check a production build:

```bash
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
```

The tests cover known calculation examples, ties, missing answers, numeric edge
cases, editing decisions, keyboard navigation, and mobile layout. The lockfile
records the tested dependency versions.

## Publishing to the portfolio

This repository contains the source. The live app is served from the `VERDICT/`
directory of [the portfolio repository](https://github.com/SunnyS29/SunnyS29.github.io).
Its HTML and JavaScript should come from the production build, not a hand-maintained
copy of the React source.

After the checks pass:

```bash
pnpm sync:website /path/to/SunnyS29.github.io
```

The script builds VERDICT and copies the output into that checkout. Review and
commit the `VERDICT/` changes there, then push the portfolio repository to publish.
Keep prior hashed JavaScript files so cached pages can still load them.

GitHub Actions checks this source repository on pushes and pull requests. Publishing
uses the portfolio's existing Pages deployment; VERDICT does not need a second
Pages site enabled on this repository.

See [the audit notes](AUDIT.md) for the September 2026 fixes and verification scope.
