// SPDX-License-Identifier: MIT

export interface TokenValue {
  value: string;
}

export interface TokenDocument {
  color: Record<string, TokenValue>;
  semanticPairs: Array<{
    name: string;
    foreground: string;
    background: string;
    required?: number;
  }>;
}

export interface ContrastFailure {
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
}

export function parseHexColor(hex: string): [number, number, number] | null {
  const cleaned = hex.replace(/^#/, "");

  if (cleaned.length === 3) {
    const [r, g, b] = cleaned;
    if (!r || !g || !b) {
      return null;
    }
    return [
      Number.parseInt(r + r, 16),
      Number.parseInt(g + g, 16),
      Number.parseInt(b + b, 16),
    ];
  }

  if (cleaned.length === 6 || cleaned.length === 8) {
    const red = Number.parseInt(cleaned.slice(0, 2), 16);
    const green = Number.parseInt(cleaned.slice(2, 4), 16);
    const blue = Number.parseInt(cleaned.slice(4, 6), 16);
    return Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)
      ? null
      : [red, green, blue];
  }

  return null;
}

export function getContrastRatio(
  foreground: string,
  background: string,
): number | null {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) {
    return null;
  }

  const fgLuminance = relativeLuminance(fg);
  const bgLuminance = relativeLuminance(bg);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateTokenContrast(
  tokens: TokenDocument,
): ContrastFailure[] {
  const failures: ContrastFailure[] = [];

  for (const pair of tokens.semanticPairs) {
    const foreground = resolveColor(tokens, pair.foreground);
    const background = resolveColor(tokens, pair.background);
    const required = pair.required ?? 4.5;
    const ratio = getContrastRatio(foreground, background);

    if (ratio === null || ratio < required) {
      failures.push({
        name: pair.name,
        foreground,
        background,
        ratio: ratio === null ? 0 : Math.round(ratio * 100) / 100,
        required,
      });
    }
  }

  return failures;
}

function resolveColor(tokens: TokenDocument, reference: string): string {
  const [, name] = reference.split(".");
  if (!name || !tokens.color[name]) {
    throw new Error(`Unknown color token reference: ${reference}`);
  }

  return tokens.color[name].value;
}

function relativeLuminance([red, green, blue]: [
  number,
  number,
  number,
]): number {
  return (
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)
  );
}

function linearize(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}
