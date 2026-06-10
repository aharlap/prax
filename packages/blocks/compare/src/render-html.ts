// SPDX-License-Identifier: MIT

import {
  escapeAttribute,
  escapeHtml,
  registerRenderer,
} from "@praxity/html-render";
import {
  type CompareConfig,
  parseCompareConfig,
  type UrlMediaSource,
} from "@praxity/schemas";

export function renderHtml(config: CompareConfig | unknown): string {
  const parsed = parseCompareConfig(config);
  const title = parsed.meta.title || "Image comparison";

  return `<section class="prax-compare" lang="${escapeAttribute(parsed.meta.lang)}">
  <h2>${escapeHtml(title)}</h2>
  <p>${escapeHtml(parsed.content.prompt)}</p>
  <section class="prax-compare__media" aria-label="${escapeAttribute(title)}">
    ${renderImageFigure("Before", parsed.content.before)}
    ${renderImageFigure("After", parsed.content.after)}
  </section>
</section>`;
}

function renderImageFigure(label: string, media: UrlMediaSource): string {
  return `<figure class="prax-compare__figure">
    <img src="${escapeAttribute(media.href)}" alt="${escapeAttribute(media.alt)}">
    <figcaption>${escapeHtml(label)}</figcaption>
  </figure>`;
}

export function registerCompareRenderer(): void {
  registerRenderer("compare", renderHtml);
}

registerCompareRenderer();
