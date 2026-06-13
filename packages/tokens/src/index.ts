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
  type ContrastFailure,
  checkApcaColorPair,
  checkWcagColorPair,
  defaultOklchRepairHook,
  getApcaAdvisories,
  getContrastRatio,
  type OklchRepairHook,
  type OklchRepairSuggestion,
  parseHexColor,
  type TokenAuditResult,
  type TokenColorPair,
  type TokenDocument,
  type TokenValue,
  validateTokenContrast,
  type WcagPairCheck,
} from "./contrast.js";
