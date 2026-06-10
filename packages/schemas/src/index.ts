// SPDX-License-Identifier: MIT

export type {
  AssetMediaSource,
  CompareConfig,
  CompareContent,
  MediaSource,
  PlatformMediaSource,
  PraxConfigEnvelope,
  PraxConfigMeta,
  UrlMediaSource,
  VisualMediaSource,
} from "./types.js";

export {
  CURRENT_COMPARE_SCHEMA_URL,
  compareV1Schema,
  isAssetMediaSource,
  isCompareConfig,
  isMediaSource,
  isPlatformMediaSource,
  isUrlMediaSource,
  migrateCompareConfig,
  parseCompareConfig,
} from "./validation.js";
