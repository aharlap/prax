// SPDX-License-Identifier: MIT

import Color from "colorjs.io";

export interface TokenValue {
  value: string;
}

export interface TokenDocument {
  color: Record<string, TokenValue>;
  font?: Record<string, TokenValue>;
  typeScale?: Record<string, TokenValue>;
  space?: Record<string, TokenValue>;
  radius?: Record<string, TokenValue>;
  elevation?: Record<string, TokenValue>;
  motion?: Record<string, TokenValue>;
  semanticPairs: Array<{
    name: string;
    foreground: string;
    background: string;
    required?: number;
  }>;
}

export interface TokenColorPair {
  name: string;
  foreground: string;
  background: string;
  required?: number;
}

export interface WcagPairCheck {
  name: string;
  foreground: string;
  background: string;
  ratio: number | null;
  required: number;
  passes: boolean;
}

export interface ApcaPairCheck {
  name: string;
  foreground: string;
  background: string;
  lc: number | null;
}

export interface ContrastFailure {
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
}

export interface ApcaAdvisory {
  name: string;
  foreground: string;
  background: string;
  lc: number | null;
  summary: string;
}

export interface OklchRepairSuggestion {
  name: string;
  status: "placeholder";
  message: string;
}

export type OklchRepairHook = (
  check: WcagPairCheck,
) => OklchRepairSuggestion | null;

export interface TokenAuditResult {
  wcagPairs: WcagPairCheck[];
  apcaAdvisories: ApcaAdvisory[];
  repairSuggestions: OklchRepairSuggestion[];
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

export function checkWcagColorPair(pair: TokenColorPair): WcagPairCheck {
  const required = pair.required ?? 4.5;
  const ratio = getContrastRatio(pair.foreground, pair.background);

  return {
    name: pair.name,
    foreground: pair.foreground,
    background: pair.background,
    ratio: ratio === null ? null : roundRatio(ratio),
    required,
    passes: ratio !== null && ratio >= required,
  };
}

export function auditTokenColorPairs(tokens: TokenDocument): WcagPairCheck[] {
  return resolveTokenColorPairs(tokens).map(checkWcagColorPair);
}

export function checkApcaColorPair(pair: TokenColorPair): ApcaPairCheck {
  try {
    return {
      name: pair.name,
      foreground: pair.foreground,
      background: pair.background,
      lc: roundRatio(
        new Color(pair.background).contrast(pair.foreground, "APCA"),
      ),
    };
  } catch {
    return {
      name: pair.name,
      foreground: pair.foreground,
      background: pair.background,
      lc: null,
    };
  }
}

export function auditTokenApcaPairs(tokens: TokenDocument): ApcaPairCheck[] {
  return resolveTokenColorPairs(tokens).map(checkApcaColorPair);
}

export function getApcaAdvisories(tokens: TokenDocument): ApcaAdvisory[] {
  return auditTokenApcaPairs(tokens).map((check) => ({
    ...check,
    summary: summarizeApca(check.lc),
  }));
}

export function defaultOklchRepairHook(
  check: WcagPairCheck,
): OklchRepairSuggestion | null {
  if (check.passes) {
    return null;
  }

  return {
    name: check.name,
    status: "placeholder",
    message:
      "OKLCH repair is not automatic yet; adjust lightness/chroma while preserving the token role.",
  };
}

export function auditTokenDocument(
  tokens: TokenDocument,
  repairHook: OklchRepairHook = defaultOklchRepairHook,
): TokenAuditResult {
  const wcagPairs = auditTokenColorPairs(tokens);

  return {
    wcagPairs,
    apcaAdvisories: getApcaAdvisories(tokens),
    repairSuggestions: wcagPairs
      .map((check) => repairHook(check))
      .filter((suggestion): suggestion is OklchRepairSuggestion =>
        Boolean(suggestion),
      ),
  };
}

export function validateTokenContrast(
  tokens: TokenDocument,
): ContrastFailure[] {
  return auditTokenColorPairs(tokens)
    .filter((check) => !check.passes)
    .map((check) => ({
      name: check.name,
      foreground: check.foreground,
      background: check.background,
      ratio: check.ratio ?? 0,
      required: check.required,
    }));
}

function resolveTokenColorPairs(tokens: TokenDocument): TokenColorPair[] {
  return tokens.semanticPairs.map((pair) => {
    const resolvedPair: TokenColorPair = {
      name: pair.name,
      foreground: resolveColor(tokens, pair.foreground),
      background: resolveColor(tokens, pair.background),
    };

    if (pair.required !== undefined) {
      resolvedPair.required = pair.required;
    }

    return resolvedPair;
  });
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

function roundRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100;
}

function summarizeApca(lc: number | null): string {
  if (lc === null) {
    return "Unable to score";
  }

  const absoluteLc = Math.abs(lc);
  if (absoluteLc >= 75) {
    return "Body text";
  }
  if (absoluteLc >= 60) {
    return "Normal text";
  }
  if (absoluteLc >= 45) {
    return "Large text";
  }
  return "Weak";
}
