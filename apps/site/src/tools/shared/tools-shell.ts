// SPDX-License-Identifier: MIT

import { praxityTools } from "./routes.js";

export interface ToolsShellOptions {
  activeToolId: string;
  ariaLabel: string;
  title: string;
  actions?: string;
  children: string;
}

export function renderToolsShell({
  activeToolId,
  ariaLabel,
  title,
  actions = "",
  children,
}: ToolsShellOptions): string {
  return `
    <main class="design-workbench praxity-tools-shell" aria-label="${escapeHtml(ariaLabel)}" data-tool-title="${escapeHtml(title)}">
      <header class="design-topbar">
        <a class="design-brand" href="/" aria-label="Praxity home">Praxity</a>
        <label class="design-tool-switch">
          <span class="visually-hidden">Tool</span>
          <select aria-label="Praxity tool" data-praxity-tool-switch>
            ${renderToolOptions(activeToolId)}
          </select>
        </label>
        <nav class="design-topbar__nav" aria-label="Site">
          <a href="/">Docs</a>
        </nav>
        <div class="design-topbar__spacer"></div>
        ${actions}
      </header>
      ${children}
    </main>
  `;
}

export function bindToolsShell(): void {
  const switcher = document.querySelector<HTMLSelectElement>(
    "[data-praxity-tool-switch]",
  );

  switcher?.addEventListener("change", () => {
    const route = praxityTools.find((tool) => tool.href === switcher.value);
    if (route?.status !== "ready") {
      return;
    }

    window.location.assign(route.href);
  });
}

function renderToolOptions(activeToolId: string): string {
  return praxityTools
    .map((tool) => {
      const selected = tool.id === activeToolId ? " selected" : "";
      const disabled = tool.status === "planned" ? " disabled" : "";

      return `<option value="${escapeHtml(tool.href)}"${selected}${disabled}>${escapeHtml(tool.label)}</option>`;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
