// SPDX-License-Identifier: MIT

import { definePraxElement } from "@praxity/runtime-core";
import { type CompareConfig, parseCompareConfig } from "@praxity/schemas";
import {
  Component,
  createElement,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

import { CompareBlock } from "./react.js";

const COMPARE_DOCS_HREF = "https://praxity.io/docs/compare";

interface CompareErrorBoundaryProps {
  children: ReactNode;
}

interface CompareErrorBoundaryState {
  error: Error | undefined;
}

class CompareErrorBoundary extends Component<
  CompareErrorBoundaryProps,
  CompareErrorBoundaryState
> {
  override state: CompareErrorBoundaryState = {
    error: undefined,
  };

  static getDerivedStateFromError(error: unknown): CompareErrorBoundaryState {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Prax compare render failed.", error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return createElement(
        "article",
        {
          className: "prax-error-card",
          role: "region",
          "aria-label": "compare block error",
        },
        createElement("h2", null, "compare block could not load"),
        createElement("p", null, "This block could not be rendered."),
        createElement(
          "details",
          null,
          createElement("summary", null, "Technical details"),
          createElement("pre", null, this.state.error.message),
        ),
        createElement("a", { href: COMPARE_DOCS_HREF }, "Troubleshooting"),
      );
    }

    return this.props.children;
  }
}

export function defineCompareElement(): void {
  definePraxElement<CompareConfig>("prax-compare", {
    block: "compare",
    docsHref: COMPARE_DOCS_HREF,
    parseConfig: parseCompareConfig,
    mount: (config, host) => {
      const hydrated = document.createElement("div");
      hydrated.className = "prax-compare-shell";
      hydrated.dataset.praxHydrated = "true";
      host.append(hydrated);

      const root = createRoot(hydrated);
      root.render(
        createElement(
          CompareErrorBoundary,
          null,
          createElement(CompareBlock, { config }),
        ),
      );

      return () => {
        root.unmount();
        hydrated.remove();
      };
    },
  });
}

defineCompareElement();
