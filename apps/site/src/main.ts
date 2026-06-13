// SPDX-License-Identifier: MIT

import "@praxity/tokens/tokens.css";
import "@praxity/compare/style.css";
import "@praxity/compare/element";
import "./site.css";

import { renderDesignWorkbench } from "./tools/design/index.js";

if (window.location.pathname.replace(/\/$/, "") === "/tools/design") {
  renderDesignWorkbench();
}
