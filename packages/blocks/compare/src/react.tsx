// SPDX-License-Identifier: MIT

import type { CompareConfig } from "@praxity/schemas";

export interface CompareBlockProps {
  config: CompareConfig;
}

export function CompareBlock({ config }: CompareBlockProps): React.JSX.Element {
  return (
    <section className="prax-compare" lang={config.meta.lang}>
      <h2>{config.meta.title || "Image comparison"}</h2>
      <p>{config.content.prompt}</p>
      <section
        className="prax-compare__media"
        aria-label={config.meta.title || "Image comparison"}
      >
        <figure className="prax-compare__figure">
          <img
            src={config.content.before.href}
            alt={config.content.before.alt}
          />
          <figcaption>Before</figcaption>
        </figure>
        <figure className="prax-compare__figure">
          <img src={config.content.after.href} alt={config.content.after.alt} />
          <figcaption>After</figcaption>
        </figure>
      </section>
    </section>
  );
}

export { CompareBlock as Compare };
