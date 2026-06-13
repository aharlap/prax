// SPDX-License-Identifier: MIT

export const praxTokenFiles = {
  css: "tokens.css",
  json: "tokens.json",
  design: "design.md",
} as const;

export {
  type ApcaAdvisory,
  type ApcaPairCheck,
  auditTokenApcaPairs,
  auditTokenColorPairs,
  auditTokenDocument,
  checkApcaColorPair,
  checkWcagColorPair,
  type ContrastFailure,
  defaultOklchRepairHook,
  getApcaAdvisories,
  getContrastRatio,
  type OklchRepairHook,
  type OklchRepairSuggestion,
  type TokenAuditResult,
  type TokenColorPair,
  parseHexColor,
  type TokenDocument,
  type TokenValue,
  validateTokenContrast,
  type WcagPairCheck,
} from "./contrast.js";
