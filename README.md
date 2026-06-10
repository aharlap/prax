# Prax

Free, accessible, open-format building blocks for eLearning.

Each block is a single-purpose interactive learning component — an image comparison slider, an interactive video player, a branching scenario — that embeds anywhere via an HTML tag, installs as a React component, or exports as a standalone HTML page or LMS package.

## Packages

| Package | Description |
|---------|-------------|
| `@praxity/schemas` | JSON Schemas, TypeScript types, config migrations |
| `@praxity/tokens` | Design tokens (CSS custom properties, JSON, design.md) |
| `@praxity/runtime-core` | Custom element base class, config loader, hydration |
| `@praxity/html-render` | Block config → semantic HTML renderer |
| `@praxity/scorm` | SCORM 2004, xAPI, and local tracking facades for exports |
| `@praxity/compare` | Image comparison block |
| `@praxity/ivideo` | Interactive video block |

## Embed a block

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@praxity/compare@1/dist/element.js"></script>

<prax-compare>
  <script type="application/json">
    {
      "$schema": "https://praxity.io/schemas/compare/v1.json",
      "block": "compare",
      "v": 1,
      "meta": { "title": "Before and after", "lang": "en" },
      "content": {
        "prompt": "Compare the two images.",
        "before": {
          "kind": "url",
          "href": "https://praxity.io/examples/compare/before.jpg",
          "alt": "Before state"
        },
        "after": {
          "kind": "url",
          "href": "https://praxity.io/examples/compare/after.jpg",
          "alt": "After state"
        }
      }
    }
  </script>
</prax-compare>
```

Or in React:

```tsx
import { Compare } from '@praxity/compare/react';

<Compare config={myConfig} />
```

## Accessibility

Every block passes WCAG 2.2 AA: axe-core zero violations, full keyboard navigation, screen reader support, 200% zoom at 320px, and contrast-verified token pairs. The accessibility gate is enforced by local verification during Phase 0, not left as a best-effort goal.

## License

MIT. See [LICENSE](./LICENSE).

## Contributing

Contributions welcome under [DCO sign-off](https://developercertificate.org/). See [CONTRIBUTING.md](./CONTRIBUTING.md).
