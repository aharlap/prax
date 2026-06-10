<!-- SPDX-License-Identifier: MIT -->

# Prax Design Tokens

Prax blocks use a restrained, readable interface vocabulary for learning content.
Runtime-facing CSS variables use the `--prax-*` prefix and are safe for host pages
to override.

Use `--prax-color-canvas` for page backgrounds, `--prax-color-surface` for quiet
panels, `--prax-color-text` for primary copy, and `--prax-color-muted` for
secondary labels. Interactive controls use `--prax-color-accent` with
`--prax-color-accent-text`.

Keep radii modest, spacing predictable, and motion short. All animation must
respect `prefers-reduced-motion`.
