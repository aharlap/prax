// SPDX-License-Identifier: MIT

import type {
  AssetMediaSource,
  CompareConfig,
  MediaSource,
  PlatformMediaSource,
  UrlMediaSource,
} from "./types.js";

export const CURRENT_COMPARE_SCHEMA_URL =
  "https://praxity.io/schemas/compare/v1.json";

export const compareV1Schema = {
  $comment: "SPDX-License-Identifier: MIT",
  $id: CURRENT_COMPARE_SCHEMA_URL,
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Prax Compare block config v1",
  type: "object",
  required: ["block", "v", "meta", "content"],
  properties: {
    $schema: {
      const: CURRENT_COMPARE_SCHEMA_URL,
    },
    block: {
      const: "compare",
    },
    v: {
      const: 1,
    },
    meta: {
      type: "object",
      required: ["lang"],
      properties: {
        title: {
          type: "string",
        },
        lang: {
          type: "string",
          minLength: 1,
        },
      },
      additionalProperties: false,
    },
    content: {
      type: "object",
      required: ["prompt", "before", "after"],
      properties: {
        prompt: {
          type: "string",
        },
        before: {
          $ref: "#/$defs/urlMedia",
        },
        after: {
          $ref: "#/$defs/urlMedia",
        },
      },
      additionalProperties: false,
    },
  },
  $defs: {
    urlMedia: {
      type: "object",
      required: ["kind", "href", "alt"],
      properties: {
        kind: {
          const: "url",
        },
        href: {
          type: "string",
          not: {
            pattern: "^[dD][aA][tT][aA]:",
          },
        },
        alt: {
          type: "string",
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export function migrateCompareConfig(config: unknown): unknown {
  return config;
}

export function parseCompareConfig(config: unknown): CompareConfig {
  const migrated = migrateCompareConfig(config);

  if (isUnsupportedCompareVersion(migrated)) {
    throw new Error(
      `Prax compare config v${migrated.v} requires a newer @praxity/compare runtime.`,
    );
  }

  if (!isCompareConfig(migrated)) {
    throw new Error("Expected a Prax compare v1 config.");
  }

  return migrated;
}

export function isCompareConfig(value: unknown): value is CompareConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.block === "compare" &&
    value.v === 1 &&
    isRecord(value.meta) &&
    typeof value.meta.lang === "string" &&
    isRecord(value.content) &&
    typeof value.content.prompt === "string" &&
    isUrlMediaSource(value.content.before) &&
    isUrlMediaSource(value.content.after)
  );
}

function isUnsupportedCompareVersion(
  value: unknown,
): value is { block: "compare"; v: number } {
  return (
    isRecord(value) &&
    value.block === "compare" &&
    typeof value.v === "number" &&
    value.v > 1
  );
}

export function isMediaSource(value: unknown): value is MediaSource {
  return (
    isUrlMediaSource(value) ||
    isAssetMediaSource(value) ||
    isPlatformMediaSource(value)
  );
}

export function isUrlMediaSource(value: unknown): value is UrlMediaSource {
  return (
    isRecord(value) &&
    value.kind === "url" &&
    typeof value.href === "string" &&
    !isDataUri(value.href) &&
    typeof value.alt === "string"
  );
}

function isDataUri(value: string): boolean {
  return /^data:/i.test(value.trim());
}

export function isAssetMediaSource(value: unknown): value is AssetMediaSource {
  return (
    isRecord(value) &&
    value.kind === "asset" &&
    typeof value.assetId === "string" &&
    typeof value.name === "string" &&
    typeof value.mime === "string" &&
    typeof value.alt === "string"
  );
}

export function isPlatformMediaSource(
  value: unknown,
): value is PlatformMediaSource {
  return (
    isRecord(value) &&
    value.kind === "platform" &&
    (value.provider === "youtube" || value.provider === "vimeo") &&
    typeof value.id === "string" &&
    typeof value.title === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
