# Contributing to Prax

Contributions are welcome. This project uses the [Developer Certificate of Origin](https://developercertificate.org/) (DCO) instead of a CLA — sign off your commits with `git commit -s`.

## Requirements

- Node.js 20+
- pnpm 9+

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Before submitting a PR

- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm lint` passes
- New blocks pass the accessibility gate (axe-core zero violations, keyboard tests, contrast checks)

## Accessibility is a merge requirement

Every block must pass WCAG 2.2 AA. This is enforced in CI via axe-core, keyboard interaction tests, contrast verification, and reflow checks. PRs that regress accessibility will not be merged.

## Code of conduct

Be respectful. This is a small project; treat contributors the way you'd want to be treated.
