// SPDX-License-Identifier: MIT

export interface PraxConfigMeta {
  title?: string;
  lang: string;
}

export interface PraxConfigEnvelope<
  TBlock extends string,
  TVersion extends number,
  TContent,
> {
  $schema?: string;
  block: TBlock;
  v: TVersion;
  meta: PraxConfigMeta;
  content: TContent;
}

export interface UrlMediaSource {
  kind: "url";
  href: string;
  alt: string;
}

export interface AssetMediaSource {
  kind: "asset";
  assetId: string;
  name: string;
  mime: string;
  alt: string;
}

export interface PlatformMediaSource {
  kind: "platform";
  provider: "youtube" | "vimeo";
  id: string;
  title: string;
  description?: string;
}

export type VisualMediaSource = UrlMediaSource | AssetMediaSource;
export type MediaSource = VisualMediaSource | PlatformMediaSource;

export interface CompareContent {
  prompt: string;
  before: UrlMediaSource;
  after: UrlMediaSource;
}

export type CompareConfig = PraxConfigEnvelope<"compare", 1, CompareContent>;
