// SPDX-License-Identifier: MIT

export type RenderHtml<TConfig = unknown> = (config: TConfig) => string;

const renderers = new Map<string, RenderHtml>();

export function registerRenderer<TConfig>(
  block: string,
  renderHtml: RenderHtml<TConfig>,
): void {
  renderers.set(block, renderHtml as RenderHtml);
}

export function renderBlockHtml(block: string, config: unknown): string {
  const renderer = renderers.get(block);
  if (!renderer) {
    throw new Error(`No Prax HTML renderer registered for ${block}.`);
  }

  return renderer(config);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

export function htmlAttribute(
  name: string,
  value: string | number | boolean | undefined,
): string {
  if (value === undefined || value === false) {
    return "";
  }

  if (value === true) {
    return ` ${name}`;
  }

  return ` ${name}="${escapeAttribute(String(value))}"`;
}
