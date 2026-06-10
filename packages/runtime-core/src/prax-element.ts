// SPDX-License-Identifier: MIT

import type { PraxConfigEnvelope } from "@praxity/schemas";

import { createErrorCard } from "./error-card.js";
import { dispatchPraxEvent, PRAX_EVENTS } from "./events.js";

type AnyConfig = PraxConfigEnvelope<string, number, unknown>;

export interface PraxElementOptions<TConfig extends AnyConfig> {
  block: TConfig["block"];
  docsHref?: string;
  parseConfig: (config: unknown) => TConfig;
  mount: (config: TConfig, host: HTMLElement) => (() => void) | undefined;
}

export class PraxElementBase<TConfig extends AnyConfig> extends HTMLElement {
  readonly #options: PraxElementOptions<TConfig>;
  #cleanup: (() => void) | undefined;
  #connectionId = 0;

  constructor(options: PraxElementOptions<TConfig>) {
    super();
    this.#options = options;
  }

  connectedCallback(): void {
    void this.#connect();
  }

  disconnectedCallback(): void {
    this.#connectionId += 1;
    this.#cleanup?.();
    this.#cleanup = undefined;
  }

  async #connect(): Promise<void> {
    this.#connectionId += 1;
    const connectionId = this.#connectionId;

    try {
      const rawConfig = await resolveConfig(this);
      if (!this.isConnected || connectionId !== this.#connectionId) {
        return;
      }
      const config = this.#options.parseConfig(rawConfig);
      if (!this.isConnected || connectionId !== this.#connectionId) {
        return;
      }
      this.#cleanup = this.#options.mount(config, this);
      this.querySelectorAll("[data-prax-ssr]").forEach((node) => {
        node.remove();
      });
      dispatchPraxEvent(this, PRAX_EVENTS.ready, {
        block: config.block,
        v: config.v,
      });
    } catch (error) {
      const errorOptions = {
        block: String(this.#options.block),
        reason: "This block's settings file could not be read.",
        detail: error instanceof Error ? error.message : String(error),
        ...(this.#options.docsHref ? { docsHref: this.#options.docsHref } : {}),
      };
      this.prepend(createErrorCard(errorOptions));
    }
  }
}

export function definePraxElement<TConfig extends AnyConfig>(
  tagName: string,
  options: PraxElementOptions<TConfig>,
): void {
  if (customElements.get(tagName)) {
    return;
  }

  customElements.define(
    tagName,
    class extends PraxElementBase<TConfig> {
      constructor() {
        super(options);
      }
    },
  );
}

async function resolveConfig(element: HTMLElement): Promise<unknown> {
  const inline = element.querySelector('script[type="application/json"]');
  const inlineText = inline?.textContent?.trim() ?? "";
  const attributeConfig = element.getAttribute("config")?.trim() ?? "";
  const sources = {
    src: element.getAttribute("src"),
    inline: inlineText ? inline : null,
    attribute: attributeConfig || null,
  };
  const present = Object.entries(sources)
    .filter(([, value]) => value)
    .map(([name]) => name);

  if (present.length > 1) {
    const ignored = present.slice(1).join(", ");
    console.warn(`Prax config source precedence ignored: ${ignored}`);
  }

  if (sources.src) {
    const response = await fetch(sources.src);
    if (!response.ok) {
      throw new Error(`Config request failed with ${response.status}.`);
    }
    return response.json();
  }

  if (sources.inline) {
    return JSON.parse(inlineText);
  }

  if (sources.attribute) {
    return JSON.parse(attributeConfig);
  }

  throw new Error("No Prax config source found.");
}
