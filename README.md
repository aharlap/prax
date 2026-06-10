# Prax

Free, accessible, open-format building blocks for eLearning.

Each block is a single-purpose interactive learning component — an image comparison slider, an interactive video player, a branching scenario — that embeds anywhere via an HTML tag, installs as a React component, or exports as a standalone HTML page or SCORM 1.2 package.

## Packages

| Package | Description |
|---------|-------------|
| `@prax/schemas` | JSON Schemas, TypeScript types, config migrations |
| `@prax/tokens` | Design tokens (CSS custom properties, JSON, design.md) |
| `@prax/runtime-core` | Custom element base class, config loader, hydration |
| `@prax/html-render` | Block config → semantic HTML renderer |
| `@prax/scorm` | SCORM 1.2 API wrapper for exports |
| `@prax/compare` | Image comparison block |
| `@prax/ivideo` | Interactive video block |

## Embed a block

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@prax/compare@1/dist/element.js"></script>

<prax-compare>
  <script type="application/json">
    { "$schema": "https://prax.dev/schemas/compare/v1.json",
      "block": "compare", "v": 1,
      "meta": { "title": "Before and after", "lang": "en" },
      "content": { } }
  </script>
</prax-compare>
```

Or in React:

```tsx
import { Compare } from '@prax/compare/react';

<Compare config={myConfig} />
```

## Accessibility

Every block passes WCAG 2.2 AA: axe-core zero violations, full keyboard navigation, screen reader support, 200% zoom at 320px, and contrast-verified token pairs. The accessibility gate is a CI merge requirement, not a best-effort goal.

## License

MIT. See [LICENSE](./LICENSE).

## Contributing

Contributions welcome under [DCO sign-off](https://developercertificate.org/). See [CONTRIBUTING.md](./CONTRIBUTING.md).
