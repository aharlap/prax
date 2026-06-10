// SPDX-License-Identifier: MIT

import { escapeAttribute, escapeHtml } from "@praxity/html-render";

export interface ErrorCardOptions {
  block: string;
  reason: string;
  detail?: string;
  docsHref?: string;
}

export function createErrorCard(options: ErrorCardOptions): HTMLElement {
  const article = document.createElement("article");
  article.className = "prax-error-card";
  article.setAttribute("role", "region");
  article.setAttribute("aria-label", `${options.block} block error`);

  const heading = document.createElement("h2");
  heading.textContent = `${options.block} block could not load`;

  const reason = document.createElement("p");
  reason.textContent = options.reason;

  article.append(heading, reason);

  if (options.detail) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const pre = document.createElement("pre");

    summary.textContent = "Technical details";
    pre.textContent = options.detail;
    details.append(summary, pre);
    article.append(details);
  }

  if (options.docsHref) {
    const link = document.createElement("a");
    link.href = options.docsHref;
    link.textContent = "Troubleshooting";
    article.append(link);
  }

  return article;
}

export function renderErrorCard(options: ErrorCardOptions): string {
  const detail = options.detail
    ? `<details><summary>Technical details</summary><pre>${escapeHtml(options.detail)}</pre></details>`
    : "";
  const docs = options.docsHref
    ? `<a href="${escapeAttribute(options.docsHref)}">Troubleshooting</a>`
    : "";

  return `<article class="prax-error-card" role="region" aria-label="${escapeAttribute(
    `${options.block} block error`,
  )}"><h2>${escapeHtml(options.block)} block could not load</h2><p>${escapeHtml(
    options.reason,
  )}</p>${detail}${docs}</article>`;
}
