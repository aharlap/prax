// SPDX-License-Identifier: MIT

export const praxTokenFiles = {
  css: "tokens.css",
  json: "tokens.json",
  design: "design.md",
} as const;

export {
  type ContrastFailure,
  getContrastRatio,
  parseHexColor,
  type TokenDocument,
  type TokenValue,
  validateTokenContrast,
} from "./contrast.js";
