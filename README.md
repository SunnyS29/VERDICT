# VERDICT

VERDICT is a small browser tool for making a hard choice when you are stuck comparing options.

I built it for the kind of buying decision where every option has tradeoffs, the reviews blur together, and you keep reopening the same tabs instead of choosing.

It does not use AI, accounts, APIs, or a backend. Everything runs in the browser.

## What It Helps With

Use VERDICT when you are choosing between things like:

- headphones
- monitors
- laptops
- e-readers
- bikes
- board games
- any purchase where the answer depends on what you personally care about

The goal is not to tell you what is objectively best. The goal is to help you pick what best matches your priorities.

## How It Works

VERDICT walks you through a decision in a few simple steps.

1. Add the options you are comparing.
2. Add the things that matter to you.
3. Compare those priorities two at a time.
4. Score each option against those priorities.
5. Get a ranked result with an explanation.

Instead of asking you to guess importance percentages upfront, VERDICT asks easier either-or questions like:

```text
Which matters more: price or build quality?
```

That makes the weighting feel more natural, especially when you are not sure how to quantify what matters.

## What The Result Shows

The final result gives you:

- the recommended option
- why it won
- what came second
- why the other options fell behind
- how much each priority mattered
- whether the result stayed stable when the priorities were nudged

That last part is useful because close decisions can be misleading. If a tiny change in priorities flips the result, VERDICT tells you the decision is close instead of pretending the answer is obvious.

## The Logic Behind It

Under the hood, VERDICT uses a few decision-making methods:

- AHP to work out how important each priority is
- TOPSIS to rank the options
- minimax regret to check which option is least likely to feel like a mistake later
- sensitivity analysis to test whether the winner is stable

You do not need to know those methods to use the app. They are there to make the decision more structured and less vibes-based.

## Live Demo

[Open VERDICT](https://sunnysangar.com/VERDICT/index)

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The GitHub Pages workflow builds the app and publishes the generated static files.
