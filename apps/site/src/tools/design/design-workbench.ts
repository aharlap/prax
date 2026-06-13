// SPDX-License-Identifier: MIT

import {
  auditTokenDocument,
  getContrastRatio,
  type TokenAuditResult,
  type TokenValue,
  type WcagPairCheck,
} from "@praxity/tokens";
import { bindToolsShell, renderToolsShell } from "../shared/tools-shell.js";
import {
  type ColorRepairTarget,
  type ComponentSpec,
  cloneSections,
  componentDescriptions,
  componentOptions,
  componentSpecs,
  customPresetId,
  type DesignDiagnostic,
  type DesignPreset,
  type DesignTokenDocument,
  defaultFont,
  elevationFor,
  fontOptions,
  type ParsedAudit,
  presets,
  type RepairTarget,
  radiusFor,
  spacingFor,
  type TypeScaleRepairTarget,
  toTokens,
  type WorkbenchState,
} from "./design-workbench-model.js";
import "./styles/index.css";

const firstPreset = presets[0] as DesignPreset;
const state: WorkbenchState = {
  preset: firstPreset,
  systemName: firstPreset.systemName,
  description: firstPreset.description,
  sections: cloneSections(firstPreset.sections),
  tokensText: stringifyTokens(firstPreset.tokens),
  designText: "",
  activeMode: "preview",
  designDirty: false,
};
state.designText = buildDesignMarkdown(parseTokensOrPreset(), state);

const colorHelp: Record<string, string> = {
  primary: "Main brand action colour.",
  "on-primary": "Text or icons placed on primary.",
  secondary: "Lower-emphasis actions and secondary accents.",
  "on-secondary": "Text or icons placed on secondary.",
  tertiary: "Supplementary accent for diagrams or highlights.",
  neutral: "Captions, metadata, helper text, and low-emphasis labels.",
  surface: "Page and primary reading surface.",
  "surface-variant": "Cards, grouped areas, inputs, and quiet panels.",
  "on-surface": "Primary copy and headings on surfaces.",
  outline: "Dividers, input borders, and card outlines.",
  error: "Errors and blocking validation.",
  "error-container": "Background for error messages.",
};

export function renderDesignWorkbench(): void {
  document.title = "Praxity Design Tool";
  document.body.innerHTML = renderToolsShell({
    activeToolId: "design",
    ariaLabel: "Praxity Design Tool",
    title: "Praxity Design Tool",
    actions: `
      <details class="design-export-menu">
        <summary>Export</summary>
        <div>
          <button type="button" data-export="design">DESIGN.md</button>
          <button type="button" data-export="tokens">tokens.json</button>
          <button type="button" disabled>CSS variables</button>
        </div>
      </details>
    `,
    children: `
      <div id="design-live-region" class="visually-hidden" aria-live="polite"></div>

      <section class="design-app" aria-label="Design workbench">
        <aside class="design-rail" aria-label="Design system controls" tabindex="0">
          <section class="design-rail__section" aria-labelledby="design-source-title">
            <h2 id="design-source-title">Source</h2>
            ${fieldLabel("design-preset", "Preset", "Choose a starting point. You can change every value after this.")}
            <select id="design-preset" class="design-input"></select>
          </section>

          <section class="design-rail__section" aria-labelledby="design-overview-title">
            <h2 id="design-overview-title">Overview</h2>
            ${fieldLabel("design-system-name", "Name", "Names the design system in DESIGN.md.")}
            <input id="design-system-name" class="design-input" type="text">
            ${fieldLabel("design-system-description", "Style summary", "Describe the visual direction in one useful sentence.")}
            <textarea id="design-system-description" class="design-input design-textarea"></textarea>
            <div class="design-field-action">
              <button class="design-mini-button design-mini-button--icon" type="button" data-generate-summary>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6v5h-5"></path>
                  <path d="M4 18v-5h5"></path>
                  <path d="M18.5 9A7 7 0 0 0 6.8 5.8L4 8.5"></path>
                  <path d="M5.5 15A7 7 0 0 0 17.2 18.2L20 15.5"></path>
                </svg>
                <span>Update</span>
              </button>
            </div>
          </section>

          <section class="design-rail__section" aria-labelledby="design-color-title">
            <h2 id="design-color-title">Colours</h2>
            <div id="design-color-controls" class="design-token-list"></div>
          </section>

          <section class="design-rail__section" aria-labelledby="design-typography-title">
            <h2 id="design-typography-title">Typography</h2>
            <div id="design-typography-controls" class="design-control-list"></div>
          </section>

          <section class="design-rail__section" aria-labelledby="design-layout-title">
            <h2 id="design-layout-title">Layout</h2>
            <div id="design-layout-controls" class="design-control-list"></div>
          </section>

          <section class="design-rail__section" aria-labelledby="design-components-title">
            <h2 id="design-components-title">Components</h2>
            <div id="design-components-label" class="design-label">
              <span>UI coverage</span>
              ${tooltip("Select the visible UI pieces this design system must style for courses and knowledge bases.")}
            </div>
            <div id="design-components-controls" class="design-check-list" role="group" aria-labelledby="design-components-label"></div>
            ${fieldLabel("design-dos", "Do", "Write one UI design rule per line.")}
            <textarea id="design-dos" class="design-input design-textarea design-textarea--rules" rows="5"></textarea>
            ${fieldLabel("design-donts", "Don't", "Write one UI design constraint per line.")}
            <textarea id="design-donts" class="design-input design-textarea design-textarea--rules" rows="5"></textarea>
          </section>
        </aside>

        <section class="design-output" aria-label="Generated design system" tabindex="0">
          <section class="design-stage" aria-labelledby="design-preview-title">
            <div class="design-stage__header">
              <h1 id="design-preview-title">Result</h1>
              <div class="design-mode-tabs" role="tablist" aria-label="Result view">
                <button type="button" role="tab" data-mode="preview">Preview</button>
                <button type="button" role="tab" data-mode="elements">Elements</button>
                <button type="button" role="tab" data-mode="tokens">tokens.json</button>
                <button type="button" role="tab" data-mode="design">DESIGN.md</button>
              </div>
            </div>
            <div id="design-preview" class="design-preview"></div>
          </section>

          <section class="design-inspector" aria-label="Audit">
            <section class="design-inspector__section" aria-labelledby="design-audit-title">
              <div class="design-inspector__header">
                <h2 id="design-audit-title">Audit</h2>
                <span id="design-audit-badge" class="design-badge">Checking</span>
              </div>
              <div id="design-audit" class="design-audit" aria-live="polite"></div>
            </section>
          </section>
        </section>
      </section>
      <div id="design-tooltip" class="design-tooltip" role="tooltip" hidden></div>
    `,
  });

  bindToolsShell();
  populatePresetSelect();
  bindWorkbenchEvents();
  bindTooltipEvents();
  syncWorkbench();
}

function populatePresetSelect(): void {
  const select = getElement<HTMLSelectElement>("design-preset");
  select.replaceChildren(
    ...presets.map((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.name;
      return option;
    }),
  );
  const customOption = document.createElement("option");
  customOption.value = customPresetId;
  customOption.textContent = "Custom";
  select.append(customOption);
  select.value = state.preset.id;
}

function bindWorkbenchEvents(): void {
  getElement<HTMLSelectElement>("design-preset").addEventListener(
    "change",
    (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      if (target.value === customPresetId) {
        markCustom();
        syncWorkbench();
        return;
      }
      const preset = presets.find((item) => item.id === target.value);
      if (!preset) {
        return;
      }

      state.preset = preset;
      state.systemName = preset.systemName;
      state.description = preset.description;
      state.sections = cloneSections(preset.sections);
      state.tokensText = stringifyTokens(preset.tokens);
      state.designDirty = false;
      syncWorkbench();
    },
  );

  for (const id of [
    "design-system-name",
    "design-system-description",
    "design-dos",
    "design-donts",
  ]) {
    getElement<HTMLInputElement | HTMLTextAreaElement>(id).addEventListener(
      "input",
      () => {
        state.systemName =
          getElement<HTMLInputElement>("design-system-name").value;
        state.description = getElement<HTMLTextAreaElement>(
          "design-system-description",
        ).value;
        state.sections.dos = linesFromTextarea("design-dos");
        state.sections.donts = linesFromTextarea("design-donts");
        state.designDirty = false;
        markCustom();
        syncWorkbench();
      },
    );
  }

  document
    .querySelector<HTMLButtonElement>("[data-generate-summary]")
    ?.addEventListener("click", () => {
      const tokens = parseTokensOrPreset();
      const matchingPreset = findPresetByTokens(tokens);
      state.description =
        matchingPreset?.description ?? generateStyleSummary(tokens);
      state.designDirty = false;
      if (matchingPreset) {
        state.preset = matchingPreset;
      } else {
        markCustom();
      }
      syncWorkbench();
    });

  getElement("design-components-controls").addEventListener("change", () => {
    state.sections.components = selectedComponents().join("\n");
    state.designDirty = false;
    markCustom();
    syncWorkbench();
  });

  getElement("design-color-controls").addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const token = target.dataset.colorText;
    if (!token) {
      return;
    }

    if (!isHexColor(target.value)) {
      return;
    }

    updateToken("color", token, normalizeHexColor(target.value));
    markCustom();
    syncWorkbench();
  });

  getElement("design-color-controls").addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.dataset.colorToken) {
      return;
    }

    updateToken(
      "color",
      target.dataset.colorToken,
      normalizeHexColor(target.value),
    );
    markCustom();
    syncWorkbench();
  });

  getElement("design-typography-controls").addEventListener(
    "input",
    (event) => {
      const target = event.target;
      if (
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement ||
          target instanceof HTMLButtonElement
        )
      ) {
        return;
      }
      if (target.dataset.fontToken) {
        updateToken("font", target.dataset.fontToken, target.value);
      }
      if (target.dataset.typeToken) {
        updateToken("typeScale", target.dataset.typeToken, target.value);
      }
      if (target.dataset.typeNumber) {
        updateLengthToken(target.dataset.typeNumber);
      }
      if (target.dataset.typeUnit) {
        updateLengthToken(target.dataset.typeUnit);
      }
      markCustom();
      syncWorkbench();
    },
  );

  getElement("design-typography-controls").addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement) || !target.dataset.typeUnit) {
        return;
      }
      updateLengthToken(target.dataset.typeUnit);
      markCustom();
      syncWorkbench();
    },
  );

  getElement("design-layout-controls").addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.systemToken) {
      return;
    }
    applySystemChoice(target.dataset.systemToken, target.value);
    markCustom();
    syncWorkbench();
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-mode]",
  )) {
    button.addEventListener("click", () => {
      state.activeMode = parseMode(button.dataset.mode);
      syncWorkbench();
    });
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-export]",
  )) {
    button.addEventListener("click", () => {
      if (button.dataset.export === "design") {
        downloadTextFile("DESIGN.md", state.designText, "text/markdown");
        return;
      }

      downloadTextFile("tokens.json", state.tokensText, "application/json");
    });
  }

  getElement("design-preview").addEventListener("click", (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button[data-copy]")
        : null;
    if (!target?.dataset.copy) {
      return;
    }
    copyResultText(target);
  });

  getElement("design-audit").addEventListener("click", (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button[data-auto-repair]")
        : null;
    if (!target) {
      return;
    }

    applyAutoRepair();
    markCustom();
    syncWorkbench();
  });
}

function bindTooltipEvents(): void {
  const root = document.querySelector(".design-workbench");
  const tooltip = getElement("design-tooltip");
  if (!root) {
    return;
  }

  root.addEventListener("pointerover", (event) => {
    const trigger = findTooltipTrigger(event.target);
    if (trigger) {
      showTooltip(trigger, tooltip);
    }
  });
  root.addEventListener("pointerout", (event) => {
    if (findTooltipTrigger(event.target)) {
      hideTooltip(tooltip);
    }
  });
  root.addEventListener("focusin", (event) => {
    const trigger = findTooltipTrigger(event.target);
    if (trigger) {
      showTooltip(trigger, tooltip);
    }
  });
  root.addEventListener("focusout", (event) => {
    if (findTooltipTrigger(event.target)) {
      hideTooltip(tooltip);
    }
  });
  root.addEventListener("keydown", (event) => {
    if (event instanceof KeyboardEvent && event.key === "Escape") {
      hideTooltip(tooltip);
    }
  });
}

function findTooltipTrigger(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element
    ? target.closest<HTMLElement>(".design-tip")
    : null;
}

function showTooltip(trigger: HTMLElement, tooltip: HTMLElement): void {
  const message = trigger.dataset.tooltip;
  if (!message) {
    return;
  }

  tooltip.textContent = message;
  tooltip.hidden = false;

  const triggerRect = trigger.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const gap = 8;
  const left = Math.min(
    Math.max(triggerRect.left, gap),
    window.innerWidth - tooltipRect.width - gap,
  );
  const below = triggerRect.bottom + gap;
  const top =
    below + tooltipRect.height > window.innerHeight - gap
      ? Math.max(gap, triggerRect.top - tooltipRect.height - gap)
      : below;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip(tooltip: HTMLElement): void {
  tooltip.hidden = true;
}

function syncWorkbench(): void {
  const parsed = parseAndAuditTokens(state.tokensText);

  if (parsed.tokens && !state.designDirty) {
    state.designText = buildDesignMarkdown(parsed.tokens, state);
  }

  getElement<HTMLInputElement>("design-system-name").value = state.systemName;
  getElement<HTMLSelectElement>("design-preset").value = state.preset.id;
  getElement<HTMLTextAreaElement>("design-system-description").value =
    state.description;
  getElement<HTMLTextAreaElement>("design-dos").value =
    state.sections.dos.join("\n");
  getElement<HTMLTextAreaElement>("design-donts").value =
    state.sections.donts.join("\n");

  renderColorControls(parsed.tokens);
  renderTypographyControls(parsed.tokens);
  renderLayoutControls(parsed.tokens);
  renderComponentControls();
  syncModeTabs();
  renderStage(parsed.tokens);
  renderAudit(parsed);
}

function parseAndAuditTokens(tokensText: string): ParsedAudit {
  try {
    const tokens = JSON.parse(tokensText) as DesignTokenDocument;
    return {
      tokens,
      audit: auditTokenDocument(tokens),
      error: null,
    };
  } catch (error) {
    return {
      tokens: null,
      audit: null,
      error: error instanceof Error ? error.message : "Unable to parse tokens.",
    };
  }
}

function renderColorControls(tokens: DesignTokenDocument | null): void {
  const controls = getElement("design-color-controls");
  const colors = (tokens ?? state.preset.tokens).color;
  controls.innerHTML = Object.entries(colorHelp)
    .filter(([role]) => colors[role])
    .map(([role, help]) => {
      const value = colors[role]?.value ?? "#000000";
      return `
        <label class="design-token-row">
          <span class="design-token-row__name">${escapeHtml(role)} ${tooltip(help)}</span>
          <input type="color" value="${escapeHtml(value)}" data-color-token="${escapeHtml(role)}" aria-label="${escapeHtml(role)} colour">
          <input class="design-token-row__hex" type="text" inputmode="text" spellcheck="false" value="${escapeHtml(value)}" data-color-text="${escapeHtml(role)}" aria-label="${escapeHtml(role)} hex colour">
        </label>
      `;
    })
    .join("");
}

function renderTypographyControls(tokens: DesignTokenDocument | null): void {
  const active = tokens ?? state.preset.tokens;
  const bodyFontValue = active.font.body?.value ?? defaultFont;
  const headingFontValue = active.font.heading?.value ?? bodyFontValue;

  getElement("design-typography-controls").innerHTML = `
    <label class="design-field" for="design-font-body">
      <span>Body font ${tooltip("Sets the main reading typeface for generated pages and block previews.")}</span>
      <select id="design-font-body" class="design-input" data-font-token="body">
        ${renderFontOptions(bodyFontValue)}
      </select>
    </label>
    <label class="design-field" for="design-font-heading">
      <span>Heading font ${tooltip("Sets the typeface for section titles and lesson headings.")}</span>
      <select id="design-font-heading" class="design-input" data-font-token="heading">
        ${renderFontOptions(headingFontValue)}
      </select>
    </label>
    ${lengthControl("design-body-size", "Body size", "body", active.typeScale.body?.value ?? "1rem", "Sets the default reading size.")}
    ${lengthControl("design-heading-size", "Heading size", "heading", active.typeScale.heading?.value ?? "1.35rem", "Sets section and lesson heading size.")}
    ${weightControl("design-body-weight", "Body weight", "bodyWeight", active.typeScale.bodyWeight?.value ?? "400", "Sets the default reading font weight.")}
    ${weightControl("design-heading-weight", "Heading weight", "headingWeight", active.typeScale.headingWeight?.value ?? "700", "Sets heading emphasis.")}
    ${textControl("design-line-height", "Line height", "typeScale", "lineHeight", active.typeScale.lineHeight?.value ?? "1.55", "Sets vertical rhythm for readable paragraphs.")}
  `;
}

function renderFontOptions(selectedValue: string): string {
  return ["Sans serif", "Serif", "Monospace"]
    .map((group) => {
      const options = fontOptions
        .filter((font) => font.group === group)
        .sort((a, b) => a.label.localeCompare(b.label));
      return `
        <optgroup label="${escapeHtml(group)}">
          ${options
            .map(
              (font) =>
                `<option value="${escapeHtml(font.value)}" ${font.value === selectedValue ? "selected" : ""}>${escapeHtml(font.label)}</option>`,
            )
            .join("")}
        </optgroup>
      `;
    })
    .join("");
}

function renderLayoutControls(tokens: DesignTokenDocument | null): void {
  const active = tokens ?? state.preset.tokens;
  getElement("design-layout-controls").innerHTML = `
    ${segmentedControl("Spacing scale", "density", ["compact", "comfortable", "spacious"], densityName(active), "Sets the DESIGN.md spacing tokens.")}
    ${segmentedControl("Rounded scale", "radius", ["sharp", "modest", "soft"], radiusName(active), "Sets the DESIGN.md rounded tokens.")}
    ${segmentedControl("Elevation style", "elevation", ["flat", "subtle", "raised"], elevationName(active), "Sets panel and raised-surface shadow guidance.")}
  `;
}

function renderComponentControls(): void {
  const selected = new Set(componentListFromState());
  getElement("design-components-controls").innerHTML = componentOptions
    .map((component) => {
      const spec = componentSpecFor(component);
      const id = `design-component-${kebabCase(component.toLowerCase()).replace(/\s+/g, "-")}`;
      return `
        <label class="design-check-row" for="${escapeHtml(id)}">
          <input id="${escapeHtml(id)}" type="checkbox" value="${escapeHtml(component)}" ${selected.has(component) ? "checked" : ""}>
          <span class="design-check-row__label">
            <strong>${escapeHtml(spec?.label ?? component)}</strong>
            ${tooltip(spec?.description ?? componentDescriptions[component] ?? "Component token.")}
          </span>
        </label>
      `;
    })
    .join("");
}

function syncModeTabs(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-mode]",
  )) {
    const selected = button.dataset.mode === state.activeMode;
    button.setAttribute("aria-selected", selected ? "true" : "false");
  }
}

function renderStage(tokens: DesignTokenDocument | null): void {
  const preview = getElement("design-preview");
  const active = tokens ?? state.preset.tokens;
  preview.dataset.view = state.activeMode;
  applyPreviewVariables(preview, active);

  if (state.activeMode === "tokens") {
    preview.innerHTML = renderCodeView("tokens.json", state.tokensText);
    return;
  }
  if (state.activeMode === "design") {
    preview.innerHTML = renderCodeView("DESIGN.md", state.designText);
    return;
  }
  if (state.activeMode === "elements") {
    preview.innerHTML = renderElementsView(active);
    return;
  }

  preview.innerHTML = renderCoursePreview();
}

function renderCoursePreview(): string {
  return `
    <article class="design-course-visualizer" aria-label="Design preview specimens">
      <section class="design-hero-canvas" aria-labelledby="preview-course-home-title">
        <div class="design-course-home">
          <header class="design-course-home__bar">
            <strong>Practice Studio</strong>
            <nav aria-label="Course preview navigation">
              <a href="#preview-course-home-title">Outline</a>
              <a href="#preview-course-home-title">Practice</a>
              <a href="#preview-course-home-title">Progress</a>
            </nav>
          </header>
          <div class="design-course-home__body">
            <div>
              <p class="design-kicker">Interactive module</p>
              <h2 id="preview-course-home-title">Honing collaboration as a practice.</h2>
              <p>Compare team signals, then choose one concrete behaviour to practise.</p>
              <div class="design-course-home__actions">
                <button type="button">Start lesson</button>
                <button type="button">Review objectives</button>
              </div>
            </div>
            <figure class="design-illustration-figure">
              <div class="design-asset-scene">
                <img src="/assets/humaaans-standing-19.svg" alt="Humaaans illustration of a person in motion">
                <div class="design-asset-scene__note" aria-hidden="true">
                  <span>Practice loop</span>
                  <strong>Notice · Name · Try</strong>
                </div>
              </div>
              <figcaption>Illustration: Humaaans by Pablo Stanley, CC0.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section class="design-preview-stack" aria-label="Course page previews">
        <article class="design-lesson-frame">
          <header class="design-lesson-frame__header">
            <p class="design-kicker">Lesson page</p>
            <span>Notice · Compare · Choose · Apply</span>
          </header>
          <main>
            <h3>From quick agreement to shared understanding.</h3>
            <p>Compare two moments from the same team conversation.</p>
            <div class="design-objective-strip">
              <span>Objective</span>
              <strong>Identify one behaviour that makes critique easier to hear and act on.</strong>
            </div>
            <div class="design-learning-component-strip" aria-label="Learning component examples">
              <div class="design-progress-steps">
                <span class="is-complete">Notice</span>
                <span class="is-current">Compare</span>
                <span>Apply</span>
              </div>
              <div class="design-scenario-chip">
                <span>Scenario</span>
                <strong>"What criteria should we use before choosing?"</strong>
              </div>
              <div class="design-mini-callout">
                <span>Tip</span>
                Name the constraint before judging the output.
              </div>
              <div class="design-hotspot-strip">
                <span class="design-hotspot-dot">1</span>
                <strong>Hotspot found.</strong>
                <span>That point shows shared criteria.</span>
              </div>
              <div class="design-mini-callout design-mini-callout--warning">
                <span>Check</span>
                Feedback must include a next step.
              </div>
              <div class="design-reflection-mini">
                <strong>Reflection</strong>
                <span>What would you try next?</span>
                <button type="button">Download reflection</button>
              </div>
            </div>
            <div class="design-figure-row">
              <figure>
                <div class="design-figure-art design-figure-art--before"></div>
                <figcaption><strong>Before</strong> Fast consensus</figcaption>
              </figure>
              <figure>
                <div class="design-figure-art design-figure-art--after"></div>
                <figcaption><strong>After</strong> Shared criteria</figcaption>
              </figure>
            </div>
          </main>
        </article>

        <div class="design-preview-grid">
          <article class="design-video-card">
            <div class="design-video-card__screen" aria-hidden="true">
              <div class="design-video-poster">
                <img src="/assets/humaaans-standing-19.svg" alt="">
                <div>
                  <span>Clip</span>
                  <strong>Creative constraint review</strong>
                </div>
              </div>
              <span>02:18</span>
            </div>
            <div class="design-video-card__controls">
              <button type="button">Captions on</button>
              <button type="button">Transcript</button>
            </div>
          </article>

          <article class="design-quiz-card">
            <p class="design-kicker">Knowledge check</p>
            <h3>Nurturing your creativity in the age of quick vibes starts with what?</h3>
            <div class="design-choice-list">
              <button type="button">Moving faster through more outputs</button>
              <button type="button" class="is-selected">Naming the constraint before generating</button>
              <button type="button">Choosing the first polished direction</button>
            </div>
            <div class="design-inline-feedback">
              <strong>Correct.</strong>
              <span>A named constraint turns vibe into a practice criterion the group can discuss.</span>
            </div>
          </article>
        </div>
      </section>

      <section class="design-block-stage" aria-label="Responsive learning block preview">
        ${renderPraxBlockSpecimen("default")}
      </section>
    </article>
  `;
}

function renderElementsView(active: DesignTokenDocument): string {
  return `
    <section class="design-preview__section" aria-labelledby="preview-colors-title">
      <div class="design-preview__section-head">
        <h2 id="preview-colors-title">Colours</h2>
      </div>
      ${renderColourSemantics(active)}
    </section>
    <section class="design-preview__section" aria-labelledby="preview-type-title">
      <div class="design-preview__section-head">
        <h2 id="preview-type-title">Typography</h2>
      </div>
      <div class="design-type-specimen">
        <p class="design-type-specimen__label">Type scale</p>
        <h2>Module heading for collaborative practice</h2>
        <h3>Compare the two examples and identify what changed.</h3>
        <h4>Guided practice prompt</h4>
        <p>Body copy should stay readable inside generated course pages and embedded Prax blocks.</p>
        <dl class="design-type-metrics">
          <div>
            <dt>Body</dt>
            <dd>${escapeHtml(active.typeScale.body?.value ?? "1rem")}</dd>
          </div>
          <div>
            <dt>Heading</dt>
            <dd>${escapeHtml(active.typeScale.heading?.value ?? "1.35rem")}</dd>
          </div>
          <div>
            <dt>Line height</dt>
            <dd>${escapeHtml(active.typeScale.lineHeight?.value ?? "1.55")}</dd>
          </div>
          <div>
            <dt>Body weight</dt>
            <dd>${escapeHtml(active.typeScale.bodyWeight?.value ?? "400")}</dd>
          </div>
          <div>
            <dt>Heading weight</dt>
            <dd>${escapeHtml(active.typeScale.headingWeight?.value ?? "700")}</dd>
          </div>
        </dl>
      </div>
    </section>
    <section class="design-preview__section" aria-labelledby="preview-block-title">
      <div class="design-preview__section-head">
        <h2 id="preview-block-title">Learning Patterns</h2>
      </div>
      ${renderLearningPatternSpecimens()}
    </section>
    <section class="design-preview__section" aria-labelledby="preview-component-title">
      <div class="design-preview__section-head">
        <h2 id="preview-component-title">Component Tokens</h2>
      </div>
      ${renderComponentTokenSpecimens(active)}
    </section>
    <section class="design-preview__section" aria-labelledby="preview-states-title">
      <div class="design-preview__section-head">
        <h2 id="preview-states-title">States</h2>
      </div>
      ${renderStateSpecimens()}
    </section>
    <section class="design-preview__section" aria-labelledby="preview-layout-title">
      <div class="design-preview__section-head">
        <h2 id="preview-layout-title">Layout, Shapes, Elevation</h2>
      </div>
      <div class="design-ui-grid">
        <div class="design-ui-card">
          <h3>Action group</h3>
          <div class="design-preview__controls">
            <button type="button">Primary action</button>
            <button type="button" class="design-preview__ghost">Secondary</button>
          </div>
        </div>
        <div class="design-ui-card design-ui-card--raised">
          <h3>Raised panel</h3>
          <label>
            Learner answer
            <input class="design-preview__field" value="Name the constraint first" readonly>
          </label>
        </div>
      </div>
    </section>
  `;
}

function renderComponentTokenSpecimens(active: DesignTokenDocument): string {
  const components = componentListFromState()
    .map(componentSpecFor)
    .filter((component): component is ComponentSpec => Boolean(component));

  return `
    <div class="design-component-token-grid">
      ${components
        .map(
          (component) => `
            <article class="design-component-token-card">
              <div class="design-component-token-card__preview" style="${componentPreviewStyle(active)}">
                ${component.preview}
              </div>
              <div>
                <h3>${escapeHtml(component.key)}</h3>
                <p>${escapeHtml(component.description)}</p>
                <dl>
                  ${Object.entries(component.props)
                    .map(
                      ([property, value]) => `
                        <div>
                          <dt>${escapeHtml(property)}</dt>
                          <dd>${escapeHtml(value)}</dd>
                        </div>
                      `,
                    )
                    .join("")}
                </dl>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function componentPreviewStyle(active: DesignTokenDocument): string {
  return [
    `--component-primary: ${active.color.primary?.value ?? "#0f766e"}`,
    `--component-secondary: ${active.color.secondary?.value ?? "#255e50"}`,
    `--component-on-primary: ${active.color["on-primary"]?.value ?? "#ffffff"}`,
    `--component-surface: ${active.color.surface?.value ?? "#ffffff"}`,
    `--component-surface-variant: ${active.color["surface-variant"]?.value ?? "#f7f8fa"}`,
    `--component-on-surface: ${active.color["on-surface"]?.value ?? "#172033"}`,
    `--component-outline: ${active.color.outline?.value ?? "#c8d0dc"}`,
    `--component-error: ${active.color.error?.value ?? "#b42318"}`,
    `--component-error-container: ${active.color["error-container"]?.value ?? "#fff4f2"}`,
    `--component-radius: ${active.radius.md?.value ?? "0.5rem"}`,
  ]
    .map(escapeHtml)
    .join("; ");
}

function componentSpecFor(component: string): ComponentSpec | undefined {
  const normalized = component.toLowerCase();
  return componentSpecs.find(
    (spec) =>
      spec.key.toLowerCase() === normalized ||
      spec.label.toLowerCase() === normalized,
  );
}

function renderColourSemantics(active: DesignTokenDocument): string {
  const roles = [
    {
      name: "primary",
      value: active.color.primary?.value ?? "#0f766e",
      usage: "Primary actions, selected states, and focus emphasis",
    },
    {
      name: "secondary",
      value: active.color.secondary?.value ?? "#255e50",
      usage: "Secondary actions, links, and lower-emphasis controls",
    },
    {
      name: "tertiary",
      value: active.color.tertiary?.value ?? "#6d4c91",
      usage: "Supplementary accent for diagrams and highlights",
    },
    {
      name: "neutral",
      value: active.color.neutral?.value ?? "#5a6578",
      usage: "Captions, metadata, helper text, and quiet labels",
    },
    {
      name: "surface",
      value: active.color.surface?.value ?? "#f7f8fa",
      usage: "Page and main reading surface",
    },
    {
      name: "surface-variant",
      value: active.color["surface-variant"]?.value ?? "#f7f8fa",
      usage: "Cards, grouped areas, inputs, and quiet panels",
    },
    {
      name: "on-surface",
      value: active.color["on-surface"]?.value ?? "#172033",
      usage: "Headings and body copy placed on surfaces",
    },
    {
      name: "outline",
      value: active.color.outline?.value ?? "#c8d0dc",
      usage: "Dividers, input borders, and card outlines",
    },
    {
      name: "error",
      value: active.color.error?.value ?? "#b42318",
      usage: "Errors and blocking validation",
    },
  ];

  return `
    ${renderColourWireframes(active)}
    <div class="design-colour-roles">
      ${roles
        .map(
          (role) => `
            <article class="design-colour-role">
              <span class="design-colour-role__swatch" style="background: ${escapeHtml(role.value)}"></span>
              <div>
                <h3>${escapeHtml(role.name)}</h3>
                <p>${escapeHtml(role.usage)}</p>
              </div>
              <strong>${escapeHtml(role.value)}</strong>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderColourWireframes(active: DesignTokenDocument): string {
  const primary = active.color.primary?.value ?? "#0f766e";
  const secondary = active.color.secondary?.value ?? "#255e50";
  const tertiary = active.color.tertiary?.value ?? "#6d4c91";
  const neutral = active.color.neutral?.value ?? "#5a6578";
  const surface = active.color.surface?.value ?? "#ffffff";
  const surfaceVariant = active.color["surface-variant"]?.value ?? "#f7f8fa";
  const onSurface = active.color["on-surface"]?.value ?? "#172033";
  const outline = active.color.outline?.value ?? "#c8d0dc";
  const error = active.color.error?.value ?? "#b42318";
  const errorContainer = active.color["error-container"]?.value ?? "#fff4f2";

  return `
    <div class="design-colour-wireframes" aria-label="Colour role wireframes">
      <svg viewBox="0 0 320 210" role="img" aria-label="Course page wireframe using colour roles">
        <rect x="1" y="1" width="318" height="208" rx="13" fill="${escapeHtml(surface)}" stroke="${escapeHtml(outline)}" />
        <rect x="20" y="20" width="280" height="46" rx="10" fill="${escapeHtml(surfaceVariant)}" stroke="${escapeHtml(outline)}" />
        <rect x="36" y="34" width="112" height="8" rx="4" fill="${escapeHtml(onSurface)}" />
        <rect x="36" y="49" width="168" height="6" rx="3" fill="${escapeHtml(neutral)}" />
        <rect x="20" y="84" width="132" height="86" rx="10" fill="${escapeHtml(surfaceVariant)}" stroke="${escapeHtml(outline)}" />
        <rect x="36" y="104" width="74" height="7" rx="3.5" fill="${escapeHtml(onSurface)}" />
        <rect x="36" y="122" width="96" height="6" rx="3" fill="${escapeHtml(neutral)}" />
        <rect x="36" y="144" width="78" height="18" rx="9" fill="${escapeHtml(primary)}" />
        <rect x="168" y="84" width="132" height="86" rx="10" fill="${escapeHtml(surface)}" stroke="${escapeHtml(outline)}" />
        <circle cx="200" cy="126" r="24" fill="${escapeHtml(tertiary)}" opacity=".78" />
        <circle cx="238" cy="126" r="24" fill="${escapeHtml(secondary)}" opacity=".78" />
      </svg>
      <svg viewBox="0 0 320 210" role="img" aria-label="Form and validation wireframe using colour roles">
        <rect x="1" y="1" width="318" height="208" rx="13" fill="${escapeHtml(surface)}" stroke="${escapeHtml(outline)}" />
        <rect x="24" y="24" width="140" height="8" rx="4" fill="${escapeHtml(onSurface)}" />
        <rect x="24" y="48" width="272" height="34" rx="8" fill="${escapeHtml(surfaceVariant)}" stroke="${escapeHtml(outline)}" />
        <rect x="38" y="62" width="108" height="6" rx="3" fill="${escapeHtml(neutral)}" />
        <rect x="24" y="98" width="272" height="46" rx="8" fill="${escapeHtml(errorContainer)}" stroke="${escapeHtml(error)}" />
        <rect x="40" y="115" width="94" height="7" rx="3.5" fill="${escapeHtml(error)}" />
        <rect x="40" y="130" width="164" height="5" rx="2.5" fill="${escapeHtml(error)}" opacity=".72" />
        <rect x="24" y="164" width="86" height="24" rx="12" fill="${escapeHtml(primary)}" />
        <rect x="122" y="164" width="96" height="24" rx="12" fill="${escapeHtml(surface)}" stroke="${escapeHtml(secondary)}" />
      </svg>
    </div>
  `;
}

function renderLearningPatternSpecimens(): string {
  return `
    <div class="design-learning-grid">
      <article class="design-learning-card">
        <span>Objective</span>
        <h3>By the end, you can name one collaboration behaviour to practise this week.</h3>
        <p>Clear goals tell learners what output the activity expects.</p>
      </article>
      <article class="design-learning-card">
        <span>Knowledge check</span>
        <h3>Which move turns feedback into shared practice?</h3>
        <div class="design-choice-list">
          <button type="button">Move to the next idea</button>
          <button type="button" class="is-selected">Name the decision criteria</button>
        </div>
      </article>
      <article class="design-learning-card design-learning-card--feedback">
        <span>Feedback</span>
        <h3>Correct.</h3>
        <p>Criteria make the discussion specific enough for people to act on.</p>
      </article>
      <article class="design-learning-card">
        <span>Media support</span>
        <h3>Caption + transcript controls</h3>
        <div class="design-support-row">
          <button type="button">Captions on</button>
          <button type="button">Transcript</button>
        </div>
      </article>
    </div>
  `;
}

function renderCodeView(title: string, code: string): string {
  return `
    <section class="design-code-view" aria-labelledby="code-view-title">
      <div class="design-code-view__bar">
        <h2 id="code-view-title">${escapeHtml(title)}</h2>
        <button class="design-icon-button" type="button" data-copy="${title === "tokens.json" ? "tokens" : "design"}" aria-label="Copy ${escapeHtml(title)}">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="10" height="10" rx="2"></rect>
            <path d="M5 15V7a2 2 0 0 1 2-2h8"></path>
          </svg>
        </button>
      </div>
      <pre><code>${escapeHtml(code)}</code></pre>
    </section>
  `;
}

function renderPraxBlockSpecimen(
  stateName: "default" | "feedback" | "preflight",
): string {
  const feedback =
    stateName === "feedback"
      ? `
        <div class="design-block__feedback design-block__feedback--danger">
          <strong>Not quite.</strong>
          <span>Look again at who is naming the criteria before checking your answer.</span>
        </div>
        <div class="design-block__feedback design-block__feedback--success">
          <strong>Correct.</strong>
          <span>The group turns a quick vibe into a visible creative constraint.</span>
        </div>
      `
      : "";
  const preflight =
    stateName === "preflight"
      ? `
        <div class="design-block__feedback design-block__feedback--warn">
          <strong>Export check.</strong>
          <span>Caption text must pass AA before packaging this block.</span>
        </div>
      `
      : "";

  return `
    <article class="design-block" aria-label="Prax image comparison specimen">
      <header class="design-block__header">
        <p>Compare · Scenario block</p>
        <h3>Compare quick vibes with a shared creative constraint. What changes?</h3>
      </header>
      <div class="design-block__body">
        <div class="design-block__figures">
          <figure>
            <div class="design-block__image" aria-hidden="true">
              <span>figure · 4:3</span>
            </div>
            <figcaption><strong>Before</strong> Quick vibes</figcaption>
          </figure>
          <figure>
            <div class="design-block__image design-block__image--after" aria-hidden="true">
              <span>figure · 4:3</span>
            </div>
            <figcaption><strong>After</strong> Named constraint</figcaption>
          </figure>
        </div>
        ${feedback}
        ${preflight}
        ${
          stateName === "feedback"
            ? ""
            : `
              <div class="design-block__actions">
                <button type="button">Check answer</button>
                <button type="button">Show hint</button>
              </div>
            `
        }
      </div>
    </article>
  `;
}

function renderStateSpecimens(): string {
  return `
    <section class="design-state-section">
      <h3>Feedback</h3>
      <div class="design-state-grid">
        <div class="design-state-card design-state-card--success">
          <span>Correct</span>
          <strong>All required pairs pass AA.</strong>
        </div>
        <div class="design-state-card design-state-card--error">
          <span>Incorrect</span>
          <strong>Caption text needs more contrast.</strong>
        </div>
      </div>
    </section>
    <section class="design-state-section">
      <h3>Validation</h3>
      <div class="design-validation-stack">
        <label class="design-validation-field design-validation-field--valid">
          <span>Design name</span>
          <input value="Cinematic Learning UI" readonly>
          <small>Ready to export.</small>
        </label>
        <label class="design-validation-field design-validation-field--invalid">
          <span>Caption colour</span>
          <input value="#8a8a8a" readonly aria-invalid="true">
          <small>Needs 4.5:1 contrast on surface.</small>
        </label>
      </div>
    </section>
  `;
}

function renderAudit(parsed: ParsedAudit): void {
  const auditElement = getElement("design-audit");
  const badge = getElement("design-audit-badge");

  if (parsed.error) {
    badge.className = "design-badge design-badge--fail";
    badge.textContent = "Invalid";
    auditElement.innerHTML = `
      <div class="design-audit__status design-audit__status--fail">
        <strong>tokens.json error.</strong>
        <p>${escapeHtml(parsed.error)}</p>
      </div>
    `;
    return;
  }

  if (!parsed.audit) {
    badge.textContent = "No audit";
    auditElement.textContent = "No audit available.";
    return;
  }

  const failedPairs = parsed.audit.wcagPairs.filter((pair) => !pair.passes);
  const passedPairs = parsed.audit.wcagPairs.length - failedPairs.length;
  const diagnostics = parsed.tokens ? getDesignDiagnostics(parsed.tokens) : [];
  const failedDiagnostics = diagnostics.filter((check) => !check.passes);
  const repairTargets = parsed.tokens
    ? getRepairTargets(parsed.tokens, parsed.audit, diagnostics)
    : [];
  const apcaByName = new Map(
    parsed.audit.apcaAdvisories.map((pair) => [pair.name, pair]),
  );

  badge.className =
    failedPairs.length === 0 && failedDiagnostics.length === 0
      ? "design-badge design-badge--pass"
      : failedPairs.length === 0
        ? "design-badge design-badge--apca-warn"
        : "design-badge design-badge--fail";
  badge.textContent =
    failedPairs.length === 0 && failedDiagnostics.length === 0 ? "OK" : "Check";

  auditElement.innerHTML = `
    <div class="design-audit__overview">
      <div class="design-audit__overview-head">
        <strong>${repairTargets.length > 0 ? "Repair available" : "No repairs needed"}</strong>
        <div class="design-audit__badges" aria-label="Audit summary">
          <span class="design-badge ${failedPairs.length === 0 ? "design-badge--pass" : "design-badge--fail"}">${passedPairs}/${parsed.audit.wcagPairs.length} text pairs</span>
          <span class="design-badge ${failedDiagnostics.length === 0 ? "design-badge--pass" : "design-badge--apca-warn"}">${diagnostics.length - failedDiagnostics.length}/${diagnostics.length} diagnostics</span>
        </div>
      </div>
      <div class="design-audit__repair-row">
        <p>${repairTargets.length > 0 ? repairSummary(repairTargets) : "No repairs needed."}</p>
        <button class="design-mini-button design-mini-button--icon" type="button" data-auto-repair ${repairTargets.length === 0 ? "disabled" : ""}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z"></path>
            <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"></path>
          </svg>
          <span>Auto repair</span>
        </button>
      </div>
    </div>
    <p class="design-audit__note">WCAG 2.2 text contrast ratios decide text-pair pass/fail. Diagnostics cover token-level design checks. APCA is advisory.</p>
    <div class="design-audit__checks" aria-labelledby="design-contrast-title">
      <h3 id="design-contrast-title" class="design-audit__section-title">Colour Contrast</h3>
      ${parsed.audit.wcagPairs
        .map((pair) => renderAuditRow(pair, apcaByName.get(pair.name)))
        .join("")}
    </div>
    ${renderDesignDiagnostics(diagnostics)}
  `;
}

function renderDesignDiagnostics(checks: DesignDiagnostic[]): string {
  if (checks.length === 0) {
    return "";
  }
  return `
      <div class="design-audit__advisory">
      <h3>Diagnostics</h3>
      <div class="design-diagnostic-list">
        ${checks
          .map(
            (check) => `
              <div class="design-diagnostic-row">
                <span>${escapeHtml(check.name)}</span>
                <strong class="design-badge ${check.passes ? "design-badge--pass" : "design-badge--apca-warn"}">${check.passes ? "Pass" : "Check"}</strong>
                <small>${escapeHtml(check.detail)}</small>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function getDesignDiagnostics(tokens: DesignTokenDocument): DesignDiagnostic[] {
  const bodyPx = lengthToPx(tokens.typeScale.body?.value ?? "1rem");
  const headingPx = lengthToPx(tokens.typeScale.heading?.value ?? "1.35rem");
  const lineHeight = Number.parseFloat(
    tokens.typeScale.lineHeight?.value ?? "",
  );
  const headingRatio = headingPx / bodyPx;
  const rhythm = rhythmFor(tokens);
  const headingBefore = rhythm.headingBefore ?? "0rem";
  const headingAfter = rhythm.headingAfter ?? "0rem";
  const outlineOnSurface = contrastDiagnostic(
    tokens.color.outline?.value,
    tokens.color.surface?.value,
  );
  const outlineOnSurfaceVariant = contrastDiagnostic(
    tokens.color.outline?.value,
    tokens.color["surface-variant"]?.value,
  );
  const focusOnSurface = contrastDiagnostic(
    tokens.color.primary?.value,
    tokens.color.surface?.value,
  );
  const focusOnSurfaceVariant = contrastDiagnostic(
    tokens.color.primary?.value,
    tokens.color["surface-variant"]?.value,
  );
  const previewTextOnVariant = contrastDiagnostic(
    tokens.color["on-surface"]?.value,
    tokens.color["surface-variant"]?.value,
    4.5,
  );
  const previewMutedOnVariant = contrastDiagnostic(
    tokens.color.neutral?.value,
    tokens.color["surface-variant"]?.value,
    4.5,
  );
  const previewErrorState = contrastDiagnostic(
    tokens.color.error?.value,
    tokens.color["error-container"]?.value,
    4.5,
  );

  return [
    {
      name: "Body size",
      passes: bodyPx >= 16,
      detail:
        bodyPx >= 16
          ? `${formatNumber(bodyPx)}px equivalent.`
          : `${formatNumber(bodyPx)}px equivalent; prefer at least 16px for reading surfaces.`,
      ...(bodyPx >= 16
        ? {}
        : {
            repair: {
              kind: "typeScale" as const,
              token: "body" as const,
              value: repairedLengthValue(
                tokens.typeScale.body?.value ?? "1rem",
                16,
              ),
            },
          }),
    },
    {
      name: "Heading contrast by size",
      passes: headingRatio >= 1.2,
      detail:
        headingRatio >= 1.2
          ? `Heading is ${headingRatio.toFixed(2)}x body size.`
          : `Heading is ${headingRatio.toFixed(2)}x body size; increase size or weight for clearer hierarchy.`,
      ...(headingRatio >= 1.2
        ? {}
        : {
            repair: {
              kind: "typeScale" as const,
              token: "heading" as const,
              value: repairedLengthValue(
                tokens.typeScale.heading?.value ?? "1.35rem",
                bodyPx * 1.2,
              ),
            },
          }),
    },
    {
      name: "Line height",
      passes: lineHeight >= 1.5,
      detail:
        lineHeight >= 1.5
          ? `Line height is ${lineHeight.toFixed(2)}.`
          : `Line height is ${tokens.typeScale.lineHeight?.value ?? "unset"}; WCAG text-spacing testing uses 1.5x line height.`,
      ...(lineHeight >= 1.5
        ? {}
        : {
            repair: {
              kind: "typeScale" as const,
              token: "lineHeight" as const,
              value: "1.5",
            },
          }),
    },
    {
      name: "Heading rhythm",
      passes: remNumber(headingBefore) > remNumber(headingAfter),
      detail: `Before ${headingBefore}; after ${headingAfter}.`,
    },
    {
      name: "Preview state text contrast",
      passes:
        previewTextOnVariant.passes === true &&
        previewMutedOnVariant.passes === true &&
        previewErrorState.passes === true,
      detail: `State text is ${previewTextOnVariant.label}; labels are ${previewMutedOnVariant.label}; error state is ${previewErrorState.label}.`,
    },
    {
      name: "UI boundary contrast",
      passes:
        outlineOnSurface.passes === true &&
        outlineOnSurfaceVariant.passes === true,
      detail: `Outline is ${outlineOnSurface.label} on surface and ${outlineOnSurfaceVariant.label} on surface-variant; WCAG non-text contrast uses 3:1 when the boundary identifies a control.`,
      repair: {
        kind: "color",
        token: "outline",
        backgrounds: [
          tokens.color.surface?.value ?? "#ffffff",
          tokens.color["surface-variant"]?.value ?? "#f7f8fa",
        ],
        required: 3,
      },
    },
    {
      name: "Focus colour contrast",
      passes:
        focusOnSurface.passes === true && focusOnSurfaceVariant.passes === true,
      detail: `Primary focus colour is ${focusOnSurface.label} on surface and ${focusOnSurfaceVariant.label} on surface-variant.`,
      repair: {
        kind: "color",
        token: "primary",
        backgrounds: [
          tokens.color.surface?.value ?? "#ffffff",
          tokens.color["surface-variant"]?.value ?? "#f7f8fa",
        ],
        required: 3,
      },
    },
  ];
}

function renderAuditRow(
  pair: WcagPairCheck,
  apca: TokenAuditResult["apcaAdvisories"][number] | undefined,
): string {
  return `
    <div class="design-audit-row">
      <div class="design-audit-row__main">
        <span class="design-audit-row__chip" aria-hidden="true">
          <span style="background: ${escapeHtml(pair.background)}"></span>
          <span style="background: ${escapeHtml(pair.foreground)}"></span>
        </span>
        <span class="design-audit-row__name">${escapeHtml(pair.name)}</span>
      </div>
      <dl class="design-audit-row__meta">
        <div>
          <dt>Ratio</dt>
          <dd>${pair.ratio?.toFixed(2) ?? "n/a"}</dd>
        </div>
        <div>
          <dt>WCAG</dt>
          <dd><span class="design-badge ${pair.passes ? "design-badge--pass" : "design-badge--fail"}">${pair.passes ? "Pass" : "Fail"}</span></dd>
        </div>
        <div>
          <dt>APCA</dt>
          <dd>${renderApcaBadge(apca)}</dd>
        </div>
      </dl>
    </div>
  `;
}

function renderApcaBadge(
  pair: TokenAuditResult["apcaAdvisories"][number] | undefined,
): string {
  if (!pair || pair.lc === null) {
    return `<span class="design-badge design-badge--apca-fail" title="APCA could not score this pair">APCA n/a</span>`;
  }

  const score = Math.abs(pair.lc);
  const title = `APCA Lc ${pair.lc.toFixed(2)}`;
  if (score >= 75) {
    return `<span class="design-badge design-badge--apca-strong" title="${escapeHtml(title)}">Body</span>`;
  }
  if (score >= 60) {
    return `<span class="design-badge design-badge--apca-ok" title="${escapeHtml(title)}">Normal</span>`;
  }
  if (score >= 45) {
    return `<span class="design-badge design-badge--apca-warn" title="${escapeHtml(title)}">Large</span>`;
  }
  return `<span class="design-badge design-badge--apca-fail" title="${escapeHtml(title)}">Weak</span>`;
}

function repairSummary(targets: RepairTarget[]): string {
  const colourTokens = [
    ...new Set(
      targets
        .filter(
          (target): target is ColorRepairTarget => target.kind === "color",
        )
        .map((target) => target.token),
    ),
  ];
  const typeTokens = [
    ...new Set(
      targets
        .filter(
          (target): target is TypeScaleRepairTarget =>
            target.kind === "typeScale",
        )
        .map((target) => target.token),
    ),
  ];
  const parts = [];
  if (colourTokens.length > 0) {
    parts.push(`OKLCH colour repair for ${colourTokens.join(", ")}`);
  }
  if (typeTokens.length > 0) {
    parts.push(`type-scale repair for ${typeTokens.join(", ")}`);
  }
  return `${parts.join("; ")}. Review the preview after repair.`;
}

function getRepairTargets(
  tokens: DesignTokenDocument,
  audit: TokenAuditResult,
  diagnostics: DesignDiagnostic[],
): RepairTarget[] {
  const targets: RepairTarget[] = [];

  for (const failedPair of audit.wcagPairs.filter((pair) => !pair.passes)) {
    const semanticPair = tokens.semanticPairs.find(
      (pair) => pair.name === failedPair.name,
    );
    const token = colorTokenName(semanticPair?.foreground);
    if (!token) {
      continue;
    }

    targets.push({
      kind: "color",
      token,
      backgrounds: [failedPair.background],
      required: failedPair.required,
    });
  }

  for (const diagnostic of diagnostics) {
    if (!diagnostic.passes && diagnostic.repair) {
      targets.push(diagnostic.repair);
    }
  }

  return mergeRepairTargets(targets);
}

function mergeRepairTargets(targets: RepairTarget[]): RepairTarget[] {
  const colorTargets = targets.filter(
    (target): target is ColorRepairTarget => target.kind === "color",
  );
  const typeTargets = targets.filter(
    (target): target is TypeScaleRepairTarget => target.kind === "typeScale",
  );
  const merged = new Map<string, ColorRepairTarget>();
  for (const target of colorTargets) {
    const existing = merged.get(target.token);
    if (!existing) {
      merged.set(target.token, {
        kind: "color",
        token: target.token,
        backgrounds: [...new Set(target.backgrounds)],
        required: target.required,
      });
      continue;
    }

    existing.required = Math.max(existing.required, target.required);
    existing.backgrounds = [
      ...new Set([...existing.backgrounds, ...target.backgrounds]),
    ];
  }
  return [...typeTargets, ...merged.values()];
}

function colorTokenName(reference: string | undefined): string | null {
  if (!reference?.startsWith("color.")) {
    return null;
  }
  return reference.slice("color.".length);
}

function applyAutoRepair(): void {
  const tokens = parseTokensOrPreset();
  repairTypeScale(tokens);
  const audit = auditTokenDocument(tokens);
  const targets = getRepairTargets(tokens, audit, getDesignDiagnostics(tokens));

  for (const target of targets) {
    if (target.kind !== "color") {
      continue;
    }
    const current = tokens.color[target.token]?.value;
    if (!current) {
      continue;
    }

    const repaired = repairTokenColour(tokens, target);
    if (repaired) {
      tokens.color[target.token] = { value: repaired };
    }
  }

  state.tokensText = stringifyTokens(tokens);
  state.designDirty = false;
}

function repairTypeScale(tokens: DesignTokenDocument): void {
  const body = tokens.typeScale.body?.value ?? "1rem";
  const bodyPx = lengthToPx(body);
  if (bodyPx < 16) {
    tokens.typeScale.body = { value: repairedLengthValue(body, 16) };
  }

  const repairedBodyPx = lengthToPx(tokens.typeScale.body?.value ?? "1rem");
  const heading = tokens.typeScale.heading?.value ?? "1.35rem";
  if (lengthToPx(heading) / repairedBodyPx < 1.2) {
    tokens.typeScale.heading = {
      value: repairedLengthValue(heading, repairedBodyPx * 1.2),
    };
  }

  const lineHeight = Number.parseFloat(
    tokens.typeScale.lineHeight?.value ?? "",
  );
  if (!Number.isFinite(lineHeight) || lineHeight < 1.5) {
    tokens.typeScale.lineHeight = { value: "1.5" };
  }
}

function updateToken(
  group: keyof Pick<
    DesignTokenDocument,
    "color" | "font" | "typeScale" | "space" | "radius" | "elevation" | "motion"
  >,
  name: string,
  value: string,
): void {
  const tokens = parseTokensOrPreset();
  tokens[group][name] = { value };
  state.tokensText = stringifyTokens(tokens);
  state.designDirty = false;
}

function applySystemChoice(kind: string, value: string): void {
  const tokens = parseTokensOrPreset();
  if (kind === "density") {
    tokens.space = spacingFor(value);
  }
  if (kind === "radius") {
    tokens.radius = radiusFor(value);
  }
  if (kind === "elevation") {
    tokens.elevation = elevationFor(value);
  }
  state.tokensText = stringifyTokens(tokens);
  state.designDirty = false;
}

function updateLengthToken(token: string): void {
  const inputId = token === "body" ? "design-body-size" : "design-heading-size";
  const amount = getElement<HTMLInputElement>(inputId).value.trim();
  const unit = document.querySelector<HTMLButtonElement>(
    `[data-type-unit="${token}"][aria-pressed="true"]`,
  )?.value;
  updateToken("typeScale", token, `${amount}${unit ?? "rem"}`);
}

function markCustom(): void {
  if (state.preset.id === customPresetId) {
    return;
  }

  state.preset = {
    ...state.preset,
    id: customPresetId,
    name: "Custom",
  };
}

function selectedComponents(): string[] {
  return Array.from(
    getElement("design-components-controls").querySelectorAll<HTMLInputElement>(
      "input:checked",
    ),
  ).map((input) => input.value);
}

function componentListFromState(): string[] {
  const existing = state.sections.components
    .split(/\n|,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
  const exactMatched = componentSpecs
    .filter((component) =>
      existing.some((item) =>
        [component.key, component.label].some(
          (name) => item.toLowerCase() === name.toLowerCase(),
        ),
      ),
    )
    .map((component) => component.key);

  return exactMatched.length > 0 ? exactMatched : defaultComponentSelection();
}

function defaultComponentSelection(): string[] {
  return [
    "course-shell",
    "lesson-menu",
    "module-cover",
    "lesson-card",
    "objective-card",
    "process-step",
    "scenario-dialogue",
    "scenario-choice",
    "hotspot-marker",
    "hotspot-feedback",
    "reflection-prompt",
    "reflection-download",
    "note-callout",
    "icon-callout",
    "callout-info",
    "callout-warning",
    "section-transition",
    "character-cutout",
    "asset-frame",
    "image-treatment",
    "media-figure",
    "media-caption",
    "knowledge-check",
    "quiz-choice",
    "quiz-choice-selected",
    "feedback-correct",
    "feedback-incorrect",
    "progress-step",
    "button-primary",
    "button-secondary",
  ];
}

function generateStyleSummary(tokens: DesignTokenDocument): string {
  const matchingPreset = findPresetByTokens(tokens);
  if (matchingPreset) {
    return matchingPreset.description;
  }

  const density = densityName(tokens);
  const radius = radiusName(tokens);
  const depth = elevationName(tokens);
  const primaryTone = describeColour(tokens.color.primary?.value ?? "#0f766e");
  const secondaryTone = describeColour(
    tokens.color.secondary?.value ?? "#255e50",
  );
  const surfaceTone = describeSurface(
    tokens.color.surface?.value ?? "#ffffff",
    tokens.color["surface-variant"]?.value ?? "#f7f8fa",
  );
  const visualMode = styleModeFor(tokens);
  const layoutPhrase =
    density === "compact"
      ? "tight, scan-friendly spacing"
      : density === "spacious"
        ? "generous spacing for reflective activities"
        : "comfortable spacing for guided learning";
  return `${visualMode} learning interface with ${primaryTone} actions, ${secondaryTone} supporting controls, ${surfaceTone}, ${layoutPhrase}, ${radius} corners, and ${depth} depth.`;
}

function findPresetByTokens(tokens: DesignTokenDocument): DesignPreset | null {
  const currentSignature = tokenSignature(tokens);
  return (
    presets.find(
      (preset) => tokenSignature(preset.tokens) === currentSignature,
    ) ?? null
  );
}

function tokenSignature(tokens: DesignTokenDocument): string {
  return JSON.stringify({
    color: tokens.color,
    font: tokens.font,
    typeScale: tokens.typeScale,
    space: tokens.space,
    radius: tokens.radius,
    elevation: tokens.elevation,
    motion: tokens.motion,
  });
}

function styleModeFor(tokens: DesignTokenDocument): string {
  const surface = tokens.color.surface?.value ?? "#ffffff";
  const primary = tokens.color.primary?.value ?? "#0f766e";
  const surfaceRgb = parseHexRgb(surface);
  const primaryRgb = parseHexRgb(primary);
  const surfaceLightness = surfaceRgb ? rgbToHsl(surfaceRgb).lightness : 1;
  const primaryHsl = primaryRgb ? rgbToHsl(primaryRgb) : null;
  const density = densityName(tokens);
  const depth = elevationName(tokens);

  if (surfaceLightness < 0.25) {
    return "Cinematic";
  }
  if (primaryHsl && primaryHsl.saturation > 0.58 && density === "spacious") {
    return "Expressive";
  }
  if (depth === "flat" && density === "compact") {
    return "Technical";
  }
  if (primaryHsl && primaryHsl.hue >= 330 && primaryHsl.hue <= 360) {
    return "Editorial";
  }
  if (primaryHsl && primaryHsl.saturation < 0.2) {
    return "Minimal";
  }
  return "Structured";
}

async function copyResultText(button: HTMLButtonElement): Promise<void> {
  const text =
    button.dataset.copy === "tokens" ? state.tokensText : state.designText;
  const label = button.dataset.copy === "tokens" ? "tokens.json" : "DESIGN.md";
  const liveRegion = document.getElementById("design-live-region");
  try {
    await navigator.clipboard.writeText(text);
    button.dataset.copied = "true";
    button.setAttribute("aria-label", `Copied ${label}`);
    if (liveRegion) {
      liveRegion.textContent = `${label} copied to clipboard.`;
    }
    window.setTimeout(() => {
      delete button.dataset.copied;
      button.setAttribute("aria-label", `Copy ${label}`);
    }, 1200);
  } catch {
    button.dataset.copied = "false";
    button.setAttribute("aria-label", `Could not copy ${label}`);
    if (liveRegion) {
      liveRegion.textContent = `Could not copy ${label}.`;
    }
    window.setTimeout(() => {
      delete button.dataset.copied;
      button.setAttribute("aria-label", `Copy ${label}`);
    }, 1600);
  }
}

function buildDesignMarkdown(
  tokens: DesignTokenDocument,
  current: WorkbenchState,
): string {
  return `${buildDesignFrontMatter(tokens, current)}# ${current.systemName}

## Overview

${current.description}

## Colors

${Object.entries(tokens.color)
  .map(
    ([name, token]) =>
      `- **${name}** (\`${token.value}\`, \`${oklchNotation(token.value)}\`): ${colourRoleDescription(name)}`,
  )
  .join("\n")}

## Typography

${current.sections.typography}

- Body font: \`${tokens.font.body?.value ?? "system-ui"}\`
- Heading font: \`${tokens.font.heading?.value ?? tokens.font.body?.value ?? "system-ui"}\`
- Body size: \`${tokens.typeScale.body?.value ?? "1rem"}\`
- Heading size: \`${tokens.typeScale.heading?.value ?? "1.35rem"}\`
- Body weight: \`${tokens.typeScale.bodyWeight?.value ?? "400"}\`
- Heading weight: \`${tokens.typeScale.headingWeight?.value ?? "700"}\`
- Line height: \`${tokens.typeScale.lineHeight?.value ?? "1.55"}\`

## Layout

${current.sections.layout}

- Spacing scale: ${tokenValues(tokens.space)}
- Rhythm: ${tokenValues(toTokens(rhythmFor(tokens)))}
- Motion: ${tokenValues(tokens.motion)}

## Elevation & Depth

${current.sections.elevation}

- Panel: \`${tokens.elevation.panel?.value ?? "none"}\`
- Raised: \`${tokens.elevation.raised?.value ?? "none"}\`

## Shapes

${current.sections.shapes}

- Rounded scale: ${tokenValues(tokens.radius)}

## Components

${componentListFromState()
  .map((component) => `- **${component}**: ${componentGuidance(component)}`)
  .join("\n")}

## Do's and Don'ts

Do:
${current.sections.dos.map((item) => `- ${item}`).join("\n")}

Don't:
${current.sections.donts.map((item) => `- ${item}`).join("\n")}
`;
}

function buildDesignFrontMatter(
  tokens: DesignTokenDocument,
  current: WorkbenchState,
): string {
  return `---
name: ${yamlString(current.systemName)}
description: ${yamlString(current.description)}
colors:
${Object.entries(tokens.color)
  .map(([name, token]) => `  ${name}: ${yamlString(token.value)}`)
  .join("\n")}
colorSpaces:
  oklch:
${Object.entries(tokens.color)
  .map(
    ([name, token]) => `    ${name}: ${yamlString(oklchNotation(token.value))}`,
  )
  .join("\n")}
typography:
  headline-md:
    fontFamily: ${yamlString(tokens.font.heading?.value ?? tokens.font.body?.value ?? "system-ui")}
    fontSize: ${yamlString(tokens.typeScale.heading?.value ?? "1.35rem")}
    fontWeight: ${yamlString(tokens.typeScale.headingWeight?.value ?? "700")}
    lineHeight: ${yamlString("1.2")}
  body-md:
    fontFamily: ${yamlString(tokens.font.body?.value ?? "system-ui")}
    fontSize: ${yamlString(tokens.typeScale.body?.value ?? "1rem")}
    fontWeight: ${yamlString(tokens.typeScale.bodyWeight?.value ?? "400")}
    lineHeight: ${yamlString(tokens.typeScale.lineHeight?.value ?? "1.55")}
  label-md:
    fontFamily: ${yamlString(tokens.font.body?.value ?? "system-ui")}
    fontSize: ${yamlString("0.875rem")}
    fontWeight: ${yamlString("650")}
    lineHeight: ${yamlString("1.3")}
rounded:
${Object.entries(tokens.radius)
  .map(([name, token]) => `  ${name}: ${yamlString(token.value)}`)
  .join("\n")}
spacing:
${Object.entries(tokens.space)
  .map(([name, token]) => `  ${name}: ${yamlString(token.value)}`)
  .join("\n")}
rhythm:
${Object.entries(rhythmFor(tokens))
  .map(([name, value]) => `  ${name}: ${yamlString(value)}`)
  .join("\n")}
components:
${componentListFromState()
  .map((component) => componentFrontMatter(component))
  .join("\n")}
---

`;
}

function componentFrontMatter(component: string): string {
  const spec = componentSpecFor(component);
  if (!spec) {
    return `  ${kebabCase(component)}:
    backgroundColor: "{colors.surface-variant}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"`;
  }

  return `  ${spec.key}:
${Object.entries(spec.props)
  .map(([property, value]) => `    ${property}: ${yamlString(value)}`)
  .join("\n")}`;
}

function componentGuidance(component: string): string {
  return (
    componentSpecFor(component)?.guidance ??
    "Style this component consistently."
  );
}

function applyPreviewVariables(
  preview: HTMLElement,
  tokens: DesignTokenDocument,
): void {
  for (const [name, token] of Object.entries(tokens.color)) {
    preview.style.setProperty(`--prax-color-${kebabCase(name)}`, token.value);
  }
  for (const [name, token] of Object.entries(tokens.font)) {
    preview.style.setProperty(`--prax-font-${kebabCase(name)}`, token.value);
  }
  for (const [name, token] of Object.entries(tokens.typeScale)) {
    preview.style.setProperty(`--prax-type-${kebabCase(name)}`, token.value);
  }
  for (const [name, token] of Object.entries(tokens.space)) {
    preview.style.setProperty(`--prax-space-${kebabCase(name)}`, token.value);
  }
  for (const [name, token] of Object.entries(tokens.radius)) {
    preview.style.setProperty(`--prax-radius-${kebabCase(name)}`, token.value);
  }
  for (const [name, token] of Object.entries(tokens.elevation)) {
    preview.style.setProperty(
      `--prax-elevation-${kebabCase(name)}`,
      token.value,
    );
  }
  for (const [name, token] of Object.entries(tokens.motion)) {
    preview.style.setProperty(`--prax-motion-${kebabCase(name)}`, token.value);
  }
}

function parseTokensOrPreset(): DesignTokenDocument {
  return parseAndAuditTokens(state.tokensText).tokens ?? state.preset.tokens;
}

function parseMode(value: string | undefined): WorkbenchState["activeMode"] {
  if (value === "elements" || value === "tokens" || value === "design") {
    return value;
  }
  return "preview";
}

function linesFromTextarea(id: string): string[] {
  return getElement<HTMLTextAreaElement>(id)
    .value.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function fieldLabel(forId: string, label: string, help: string): string {
  return `
    <label class="design-label" for="${escapeHtml(forId)}">
      <span>${escapeHtml(label)}</span>
      ${tooltip(help)}
    </label>
  `;
}

function tooltip(help: string): string {
  return `<span class="design-tip" tabindex="0" aria-label="${escapeHtml(help)}" aria-describedby="design-tooltip" data-tooltip="${escapeHtml(help)}">i</span>`;
}

function textControl(
  id: string,
  label: string,
  group: string,
  token: string,
  value: string,
  help: string,
): string {
  const attr = group === "typeScale" ? "data-type-token" : "data-font-token";
  return `
    <label class="design-field" for="${escapeHtml(id)}">
      <span>${escapeHtml(label)} ${tooltip(help)}</span>
      <input id="${escapeHtml(id)}" class="design-input" value="${escapeHtml(value)}" ${attr}="${escapeHtml(token)}">
    </label>
  `;
}

function lengthControl(
  id: string,
  label: string,
  token: string,
  value: string,
  help: string,
): string {
  const length = parseLength(value);
  return `
    <div class="design-field">
      <label for="${escapeHtml(id)}">${escapeHtml(label)} ${tooltip(help)}</label>
      <span class="design-unit-field">
        <input id="${escapeHtml(id)}" class="design-input" inputmode="decimal" value="${escapeHtml(length.amount)}" data-type-number="${escapeHtml(token)}" aria-label="${escapeHtml(label)}">
        <span class="design-segmented design-segmented--attached" role="group" aria-label="${escapeHtml(label)} unit">
          <button type="button" value="rem" data-type-unit="${escapeHtml(token)}" aria-pressed="${length.unit === "rem" ? "true" : "false"}">rem</button>
          <button type="button" value="px" data-type-unit="${escapeHtml(token)}" aria-pressed="${length.unit === "px" ? "true" : "false"}">px</button>
        </span>
      </span>
    </div>
  `;
}

function weightControl(
  id: string,
  label: string,
  token: string,
  value: string,
  help: string,
): string {
  const weights = ["300", "400", "500", "600", "700", "800"];
  return `
    <label class="design-field" for="${escapeHtml(id)}">
      <span>${escapeHtml(label)} ${tooltip(help)}</span>
      <select id="${escapeHtml(id)}" class="design-input" data-type-token="${escapeHtml(token)}">
        ${weights
          .map(
            (weight) =>
              `<option value="${weight}" ${weight === value ? "selected" : ""}>${weight}</option>`,
          )
          .join("")}
      </select>
    </label>
  `;
}

function segmentedControl(
  label: string,
  token: string,
  values: string[],
  selected: string,
  help: string,
): string {
  return `
    <div class="design-field">
      <span>${escapeHtml(label)} ${tooltip(help)}</span>
      <span class="design-segmented" role="group" aria-label="${escapeHtml(label)}">
        ${values
          .map(
            (value) =>
              `<button type="button" value="${escapeHtml(value)}" data-system-token="${escapeHtml(token)}" aria-pressed="${value === selected ? "true" : "false"}">${escapeHtml(value)}</button>`,
          )
          .join("")}
      </span>
    </div>
  `;
}

function parseLength(value: string): { amount: string; unit: "rem" | "px" } {
  const match = value.trim().match(/^([0-9]*\.?[0-9]+)(rem|px)$/);
  if (!match) {
    return { amount: value.replace(/[a-z%]+$/i, "") || "1", unit: "rem" };
  }
  return {
    amount: match[1] ?? "1",
    unit: match[2] === "px" ? "px" : "rem",
  };
}

function lengthToPx(value: string): number {
  const match = value.trim().match(/^([0-9]*\.?[0-9]+)(rem|px)$/);
  if (!match) {
    return 16;
  }

  const amount = Number.parseFloat(match[1] ?? "0");
  return match[2] === "px" ? amount : amount * 16;
}

function remNumber(value: string): number {
  const match = value.trim().match(/^([0-9]*\.?[0-9]+)rem$/);
  if (match) {
    return Number.parseFloat(match[1] ?? "0");
  }

  const pxMatch = value.trim().match(/^([0-9]*\.?[0-9]+)px$/);
  return pxMatch ? Number.parseFloat(pxMatch[1] ?? "0") / 16 : 0;
}

function repairedLengthValue(value: string, minimumPx: number): string {
  const { unit } = parseLength(value);
  if (unit === "px") {
    return `${Math.ceil(minimumPx)}px`;
  }

  const rem = minimumPx / 16;
  return `${roundLength(rem)}rem`;
}

function roundLength(value: number): string {
  const rounded = Math.ceil(value * 1000) / 1000;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(3).replace(/0+$/g, "").replace(/\.$/, "");
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function contrastDiagnostic(
  foreground: string | undefined,
  background: string | undefined,
  required = 3,
): { label: string; passes: boolean | null } {
  if (!foreground || !background) {
    return { label: "not set", passes: null };
  }

  const ratio = getContrastRatio(foreground, background);
  if (ratio === null) {
    return { label: "not scorable", passes: null };
  }

  return {
    label: `${ratio.toFixed(2)}:1`,
    passes: ratio >= required,
  };
}

function downloadTextFile(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function stringifyTokens(tokens: DesignTokenDocument): string {
  return `${JSON.stringify(tokens, null, 2)}\n`;
}

function tokenValues(tokens: Record<string, TokenValue> | undefined): string {
  if (!tokens) {
    return "not set";
  }
  return Object.entries(tokens)
    .map(([name, token]) => `${name} ${token.value}`)
    .join(" · ");
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function colourRoleDescription(name: string): string {
  const descriptions: Record<string, string> = {
    primary: "primary actions, selected states, and focus emphasis.",
    "on-primary": "text and icons placed on primary.",
    secondary: "secondary actions, links, and lower-emphasis controls.",
    "on-secondary": "text and icons placed on secondary.",
    tertiary: "supplementary accent for diagrams and highlights.",
    neutral: "captions, helper text, metadata, and low-emphasis labels.",
    surface: "page and primary reading surface.",
    "surface-variant": "cards, grouped areas, inputs, and quiet panels.",
    "on-surface": "primary body copy and headings.",
    outline: "dividers, input borders, and card outlines.",
    error: "errors and blocking validation.",
    "error-container": "background for error and warning messages.",
  };

  return descriptions[name] ?? "supporting design token.";
}

function rhythmFor(tokens: DesignTokenDocument): Record<string, string> {
  const density = densityName(tokens);
  if (density === "compact") {
    return {
      paragraphGap: "0.5rem",
      headingBefore: "1.5rem",
      headingAfter: "0.5rem",
      sectionGap: "2rem",
      blockGap: "1rem",
      cardGap: "0.75rem",
      listItemGap: "0.375rem",
    };
  }
  if (density === "spacious") {
    return {
      paragraphGap: "1rem",
      headingBefore: "2.5rem",
      headingAfter: "0.75rem",
      sectionGap: "3rem",
      blockGap: "2rem",
      cardGap: "1.25rem",
      listItemGap: "0.625rem",
    };
  }
  return {
    paragraphGap: "0.75rem",
    headingBefore: "2rem",
    headingAfter: "0.625rem",
    sectionGap: "2.5rem",
    blockGap: "1.5rem",
    cardGap: "1rem",
    listItemGap: "0.5rem",
  };
}

function densityName(tokens: DesignTokenDocument): string {
  const md = tokens.space.md?.value;
  if (md === "0.875rem") {
    return "compact";
  }
  if (md === "1.25rem") {
    return "spacious";
  }
  return "comfortable";
}

function radiusName(tokens: DesignTokenDocument): string {
  const md = tokens.radius.md?.value;
  if (md === "0.25rem") {
    return "sharp";
  }
  if (md === "0.875rem") {
    return "soft";
  }
  return "modest";
}

function elevationName(tokens: DesignTokenDocument): string {
  const panel = tokens.elevation.panel?.value ?? "none";
  if (panel === "none") {
    return "flat";
  }
  if (panel.includes("3px 8px")) {
    return "raised";
  }
  return "subtle";
}

function isHexColor(value: string): boolean {
  return /^#?[\da-f]{6}$/i.test(value.trim());
}

function normalizeHexColor(value: string): string {
  const cleaned = value.trim();
  return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
}

function describeColour(value: string): string {
  const rgb = parseHexRgb(value);
  if (!rgb) {
    return "custom-coloured";
  }

  const { hue, saturation, lightness } = rgbToHsl(rgb);
  const depth =
    lightness < 0.28
      ? "deep"
      : lightness > 0.74
        ? "pale"
        : lightness > 0.58
          ? "light"
          : "";

  if (saturation < 0.18) {
    return [depth, "neutral"].filter(Boolean).join(" ");
  }

  const intensity =
    saturation < 0.42 ? "muted" : saturation > 0.72 ? "vivid" : "clear";
  const family = hueName(hue);
  return [depth, intensity, family].filter(Boolean).join(" ");
}

function describeSurface(surface: string, variant: string): string {
  const surfaceRgb = parseHexRgb(surface);
  const variantRgb = parseHexRgb(variant);
  if (!surfaceRgb || !variantRgb) {
    return "custom surfaces";
  }
  const surfaceLightness = rgbToHsl(surfaceRgb).lightness;
  const variantLightness = rgbToHsl(variantRgb).lightness;
  const relation =
    Math.abs(surfaceLightness - variantLightness) < 0.04
      ? "low-contrast"
      : variantLightness < surfaceLightness
        ? "softly layered"
        : "brightened";
  if (surfaceLightness > 0.92) {
    return `${relation} light surfaces`;
  }
  if (surfaceLightness < 0.2) {
    return `${relation} dark surfaces`;
  }
  return `${relation} mid-tone surfaces`;
}

function oklchNotation(value: string): string {
  const oklch = hexToOklch(value);
  if (!oklch) {
    return "oklch(none none none)";
  }

  return `oklch(${(oklch.lightness * 100).toFixed(2)}% ${oklch.chroma.toFixed(4)} ${oklch.hue.toFixed(2)})`;
}

function repairTokenColour(
  tokens: DesignTokenDocument,
  target: ColorRepairTarget,
): string | null {
  const current = tokens.color[target.token]?.value;
  if (!current) {
    return null;
  }

  const base = hexToOklch(current);
  if (!base) {
    return null;
  }

  const scorableBackgrounds = target.backgrounds.filter((background) =>
    parseHexRgb(background),
  );
  const dependentPairs = dependentSemanticPairs(tokens, target.token);
  if (scorableBackgrounds.length === 0 && dependentPairs.length === 0) {
    return null;
  }

  let best: { hex: string; distance: number } | null = null;
  for (const chromaFactor of [1, 0.85, 0.7, 0.5, 0.25, 0]) {
    for (let step = 0; step <= 100; step += 1) {
      const lightness = step / 100;
      const hex = oklchToHex({
        lightness,
        chroma: base.chroma * chromaFactor,
        hue: base.hue,
      });
      if (!hex) {
        continue;
      }

      const passes =
        scorableBackgrounds.every((background) => {
          const ratio = getContrastRatio(hex, background);
          return ratio !== null && ratio >= target.required;
        }) && dependentPairsPassWithCandidate(tokens, target.token, hex);
      if (!passes) {
        continue;
      }

      const distance =
        Math.abs(lightness - base.lightness) +
        Math.abs(1 - chromaFactor) * 0.12;
      if (!best || distance < best.distance) {
        best = { hex, distance };
      }
    }

    if (best) {
      return best.hex;
    }
  }

  return null;
}

function dependentSemanticPairs(
  tokens: DesignTokenDocument,
  token: string,
): DesignTokenDocument["semanticPairs"] {
  const reference = `color.${token}`;
  return tokens.semanticPairs.filter(
    (pair) => pair.foreground === reference || pair.background === reference,
  );
}

function dependentPairsPassWithCandidate(
  tokens: DesignTokenDocument,
  token: string,
  candidate: string,
): boolean {
  return dependentSemanticPairs(tokens, token).every((pair) => {
    const foreground =
      pair.foreground === `color.${token}`
        ? candidate
        : resolveTokenColour(tokens, pair.foreground);
    const background =
      pair.background === `color.${token}`
        ? candidate
        : resolveTokenColour(tokens, pair.background);
    if (!foreground || !background) {
      return false;
    }

    const ratio = getContrastRatio(foreground, background);
    return ratio !== null && ratio >= (pair.required ?? 4.5);
  });
}

function resolveTokenColour(
  tokens: DesignTokenDocument,
  reference: string,
): string | null {
  const token = colorTokenName(reference);
  return token ? (tokens.color[token]?.value ?? null) : null;
}

function hexToOklch(
  value: string,
): { lightness: number; chroma: number; hue: number } | null {
  const rgb = parseHexRgb(value);
  if (!rgb) {
    return null;
  }

  const [red, green, blue] = rgb.map((channel) =>
    srgbToLinear(channel / 255),
  ) as [number, number, number];
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const lightness =
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const b = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const chroma = Math.sqrt(a * a + b * b);
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  const normalizedHue = hue < 0 ? hue + 360 : hue;

  return { lightness, chroma, hue: normalizedHue };
}

function oklchToHex({
  lightness,
  chroma,
  hue,
}: {
  lightness: number;
  chroma: number;
  hue: number;
}): string | null {
  const hueRadians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);
  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return rgbToHex([linearToSrgb(red), linearToSrgb(green), linearToSrgb(blue)]);
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function rgbToHex([red, green, blue]: [number, number, number]): string {
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round(Math.min(1, Math.max(0, channel)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function rgbToHsl([red, green, blue]: [number, number, number]): {
  hue: number;
  saturation: number;
  lightness: number;
} {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === r) {
    hue = 60 * (((g - b) / delta) % 6);
  } else if (max === g) {
    hue = 60 * ((b - r) / delta + 2);
  } else {
    hue = 60 * ((r - g) / delta + 4);
  }

  return { hue: hue < 0 ? hue + 360 : hue, saturation, lightness };
}

function hueName(hue: number): string {
  if (hue < 15 || hue >= 345) {
    return "red";
  }
  if (hue < 45) {
    return "orange";
  }
  if (hue < 75) {
    return "yellow";
  }
  if (hue < 155) {
    return "green";
  }
  if (hue < 195) {
    return "teal";
  }
  if (hue < 255) {
    return "blue";
  }
  if (hue < 290) {
    return "purple";
  }
  if (hue < 345) {
    return "magenta";
  }
  return "neutral";
}

function parseHexRgb(value: string): [number, number, number] | null {
  const cleaned = value.replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(cleaned)) {
    return null;
  }

  return [
    Number.parseInt(cleaned.slice(0, 2), 16),
    Number.parseInt(cleaned.slice(2, 4), 16),
    Number.parseInt(cleaned.slice(4, 6), 16),
  ];
}

function kebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
}
