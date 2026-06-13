// SPDX-License-Identifier: MIT

import type {
  TokenAuditResult,
  TokenDocument,
  TokenValue,
} from "@praxity/tokens";

export interface DesignTokenDocument extends TokenDocument {
  font: Record<string, TokenValue>;
  typeScale: Record<string, TokenValue>;
  space: Record<string, TokenValue>;
  radius: Record<string, TokenValue>;
  elevation: Record<string, TokenValue>;
  motion: Record<string, TokenValue>;
}

export interface DesignSections {
  typography: string;
  layout: string;
  elevation: string;
  shapes: string;
  components: string;
  dos: string[];
  donts: string[];
}

export interface DesignPreset {
  id: string;
  name: string;
  systemName: string;
  description: string;
  tokens: DesignTokenDocument;
  sections: DesignSections;
}

export interface WorkbenchState {
  preset: DesignPreset;
  systemName: string;
  description: string;
  sections: DesignSections;
  tokensText: string;
  designText: string;
  activeMode: "preview" | "elements" | "tokens" | "design";
  designDirty: boolean;
}

export interface ParsedAudit {
  tokens: DesignTokenDocument | null;
  audit: TokenAuditResult | null;
  error: string | null;
}

export interface ColorRepairTarget {
  kind: "color";
  token: string;
  backgrounds: string[];
  required: number;
}

export interface TypeScaleRepairTarget {
  kind: "typeScale";
  token: "body" | "heading" | "lineHeight";
  value: string;
}

export type RepairTarget = ColorRepairTarget | TypeScaleRepairTarget;

export interface DesignDiagnostic {
  name: string;
  passes: boolean;
  detail: string;
  repair?: RepairTarget;
}

export const fontOptions = [
  {
    group: "Sans serif",
    id: "aptos",
    label: "Aptos",
    value: 'Aptos, Calibri, "Segoe UI", sans-serif',
  },
  {
    group: "Sans serif",
    id: "avenir-next",
    label: "Avenir Next",
    value: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
  {
    group: "Sans serif",
    id: "system",
    label: "System UI",
    value:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    group: "Sans serif",
    id: "inter",
    label: "Inter",
    value: 'Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif',
  },
  {
    group: "Sans serif",
    id: "montserrat",
    label: "Montserrat",
    value: 'Montserrat, "Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
  {
    group: "Sans serif",
    id: "noto-sans",
    label: "Noto Sans",
    value: '"Noto Sans", Arial, sans-serif',
  },
  {
    group: "Sans serif",
    id: "open-sans",
    label: "Open Sans",
    value: '"Open Sans", Arial, sans-serif',
  },
  {
    group: "Sans serif",
    id: "roboto",
    label: "Roboto",
    value: 'Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    group: "Sans serif",
    id: "source-sans",
    label: "Source Sans 3",
    value: '"Source Sans 3", "Source Sans Pro", Arial, sans-serif',
  },
  {
    group: "Serif",
    id: "serif",
    label: "Georgia",
    value: 'Georgia, "Times New Roman", serif',
  },
  {
    group: "Serif",
    id: "merriweather",
    label: "Merriweather",
    value: "Merriweather, Georgia, serif",
  },
  {
    group: "Serif",
    id: "plex-serif",
    label: "IBM Plex Serif",
    value: '"IBM Plex Serif", Georgia, serif',
  },
  {
    group: "Serif",
    id: "source-serif",
    label: "Source Serif 4",
    value: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
  },
  {
    group: "Monospace",
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    value: '"JetBrains Mono", SFMono-Regular, Consolas, monospace',
  },
  {
    group: "Monospace",
    id: "plex-mono",
    label: "IBM Plex Mono",
    value: '"IBM Plex Mono", SFMono-Regular, Consolas, monospace',
  },
  {
    group: "Monospace",
    id: "mono",
    label: "System Mono",
    value: 'SFMono-Regular, Consolas, "Liberation Mono", monospace',
  },
] as const;

export const defaultFont =
  fontOptions.find((font) => font.id === "system")?.value ??
  "system-ui, sans-serif";
export const customPresetId = "custom";

export interface ComponentSpec {
  key: string;
  label: string;
  description: string;
  guidance: string;
  props: Record<string, string>;
  preview: string;
}

export const componentSpecs: ComponentSpec[] = [
  {
    key: "course-shell",
    label: "Course shell",
    description: "Outer course frame, page background, and persistent chrome.",
    guidance:
      "Use for the full learner experience frame. Keep navigation, content width, and background treatment consistent across modules.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.lg}",
      padding: "{spacing.lg}",
    },
    preview: `<div class="design-token-course-shell"><span>Course</span><strong>Practice Studio</strong></div>`,
  },
  {
    key: "lesson-menu",
    label: "Lesson menu",
    description: "Module navigation, outline, or table of contents.",
    guidance:
      "Use clear current, complete, and upcoming states. Avoid hiding essential navigation behind icon-only controls.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.label-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-menu"><span class="is-current">Compare</span><span>Apply</span><span>Reflect</span></div>`,
  },
  {
    key: "module-cover",
    label: "Module cover",
    description: "Opening screen or section cover for a lesson module.",
    guidance:
      "Use a strong heading, one supporting visual treatment, and one primary start action. Do not overload the cover with instructions.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.on-surface}",
      typography: "{typography.headline-md}",
      rounded: "{rounded.lg}",
      padding: "{spacing.lg}",
    },
    preview: `<div class="design-token-module-cover"><span>Module 1</span><strong>Honing collaboration</strong></div>`,
  },
  {
    key: "process-step",
    label: "Process step",
    description: "Step-by-step procedure or guided sequence item.",
    guidance:
      "Use repeated numbering, spacing, and label treatment so learners can track procedure order without rereading.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-process-step"><span>2</span><strong>Compare the evidence</strong></div>`,
  },
  {
    key: "scenario-dialogue",
    label: "Scenario dialogue",
    description: "Dialogue bubble or scenario exchange.",
    guidance:
      "Use consistent speaker treatment, readable line length, and stable spacing between turns.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.lg}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-dialogue"><span>Manager</span><strong>What criteria should we use?</strong></div>`,
  },
  {
    key: "scenario-choice",
    label: "Scenario choice",
    description: "Decision option inside a branching scenario.",
    guidance:
      "Use option cards with visible boundaries, concise consequence-oriented labels, and clear selected state.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-choice">Ask for one observable example</div>`,
  },
  {
    key: "hotspot-marker",
    label: "Hotspot marker",
    description: "Visible or invisible clickable target on media.",
    guidance:
      "Use a clear marker when discoverability matters. For hidden hotspots, provide attempt feedback and hints.",
    props: {
      backgroundColor: "{colors.primary}",
      textColor: "{colors.on-primary}",
      typography: "{typography.label-md}",
      rounded: "{rounded.full}",
      size: "32px",
    },
    preview: `<div class="design-token-hotspot"><span>1</span></div>`,
  },
  {
    key: "hotspot-feedback",
    label: "Hotspot feedback",
    description: "Correct, incorrect, or hint response for hotspot tasks.",
    guidance:
      "Keep feedback anchored to the media or nearby instruction. Include a next step after incorrect attempts.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-callout"><span>Found</span>That point shows shared criteria.</div>`,
  },
  {
    key: "reflection-prompt",
    label: "Reflection prompt",
    description: "Open reflection or short written response.",
    guidance:
      "Use a generous writing surface, clear question, helper text, and optional save/download action.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.lg}",
      padding: "{spacing.lg}",
    },
    preview: `<div class="design-token-reflection"><strong>What would you try next?</strong><span>Write a short response...</span></div>`,
  },
  {
    key: "reflection-download",
    label: "Reflection download",
    description: "Save or download action for learner reflection output.",
    guidance:
      "Use a secondary action unless downloading the reflection is the required final step.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.secondary}",
      typography: "{typography.label-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
      height: "40px",
    },
    preview: `<button class="design-token-button design-token-button--secondary" type="button">Download reflection</button>`,
  },
  {
    key: "note-callout",
    label: "Note callout",
    description: "Instructional note or key takeaway.",
    guidance:
      "Use consistent padding, icon placement, and label treatment. Notes should support the task rather than interrupt it.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-callout"><span>Note</span>Reuse this language in feedback.</div>`,
  },
  {
    key: "icon-callout",
    label: "Icon callout",
    description: "Callout with a leading icon or graphic marker.",
    guidance:
      "Use icons as repeatable signposts. Keep icon style, stroke weight, and container size consistent.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-icon-callout"><span aria-hidden="true">!</span><strong>Pause before choosing.</strong></div>`,
  },
  {
    key: "section-transition",
    label: "Section transition",
    description: "Visual divider between lesson blocks or scenes.",
    guidance:
      "Use sparingly to clarify a shift in topic, activity, or scene. Do not add decorative dividers between every block.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.neutral}",
      typography: "{typography.label-md}",
      height: "32px",
    },
    preview: `<div class="design-token-transition"><span>Next: Apply</span></div>`,
  },
  {
    key: "character-cutout",
    label: "Character cutout",
    description: "Consistent character image treatment across poses.",
    guidance:
      "Use one illustration or photo style per course. Keep crop, scale, lighting, and pose treatment consistent.",
    props: {
      backgroundColor: "transparent",
      textColor: "{colors.on-surface}",
      rounded: "{rounded.md}",
      size: "160px",
    },
    preview: `<div class="design-token-character"><img src="/assets/humaaans-standing-19.svg" alt=""></div>`,
  },
  {
    key: "asset-frame",
    label: "Asset frame",
    description:
      "Shared frame for images, screenshots, diagrams, or stock assets.",
    guidance:
      "Use consistent aspect ratio, border, background, and caption placement so mixed-source assets feel intentional.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-asset-frame"><span>asset · 16:9</span></div>`,
  },
  {
    key: "image-treatment",
    label: "Image treatment",
    description: "Rules for cropping, masking, tinting, and overlays.",
    guidance:
      "Define crop ratio, corner radius, background, and any overlay treatment. Avoid mixing photographic and illustrative styles without a rule.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.neutral}",
      rounded: "{rounded.md}",
      padding: "{spacing.sm}",
    },
    preview: `<div class="design-token-image-treatment"><span>consistent crop</span></div>`,
  },
  {
    key: "button-primary",
    label: "Button primary",
    description: "Primary learner action.",
    guidance:
      "Use for the next meaningful learner action, such as Start lesson, Check answer, or Continue.",
    props: {
      backgroundColor: "{colors.primary}",
      textColor: "{colors.on-primary}",
      typography: "{typography.label-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
      height: "40px",
    },
    preview: `<button class="design-token-button" type="button">Check answer</button>`,
  },
  {
    key: "button-secondary",
    label: "Button secondary",
    description: "Secondary action near a primary task.",
    guidance:
      "Use for hints, transcripts, review actions, and alternate paths that should not compete with the primary action.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.secondary}",
      typography: "{typography.label-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
      height: "40px",
    },
    preview: `<button class="design-token-button design-token-button--secondary" type="button">Show hint</button>`,
  },
  {
    key: "input-field",
    label: "Input field",
    description: "Learner text entry and short-response fields.",
    guidance:
      "Use visible borders, readable body text, helper text, and clear invalid state treatment.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
      height: "40px",
    },
    preview: `<div class="design-token-input">Learner answer</div>`,
  },
  {
    key: "lesson-card",
    label: "Lesson card",
    description: "Top-level lesson/module container.",
    guidance:
      "Use for lesson, module, or activity containers with enough padding for readable instructional content.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.lg}",
      padding: "{spacing.lg}",
    },
    preview: `<div class="design-token-lesson-card"><strong>Honing collaboration</strong><span>12 min lesson</span></div>`,
  },
  {
    key: "objective-card",
    label: "Objective card",
    description: "Learning objective or success criterion.",
    guidance:
      "Use a quieter surface than the lesson card and place near the start of an activity.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-objective"><span>Objective</span><strong>Name one behaviour to practise.</strong></div>`,
  },
  {
    key: "callout-info",
    label: "Callout info",
    description: "Neutral note, tip, or key takeaway.",
    guidance:
      "Use for supportive instructional notes that clarify the task without blocking progress.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-callout"><span>Tip</span>Look for the named constraint.</div>`,
  },
  {
    key: "callout-warning",
    label: "Callout warning",
    description: "Caution or blocking instructional note.",
    guidance:
      "Use for warnings, blockers, and export checks. Pair colour with explicit text.",
    props: {
      backgroundColor: "{colors.error-container}",
      textColor: "{colors.error}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-callout design-token-callout--warning"><span>Check</span>Caption contrast is too low.</div>`,
  },
  {
    key: "media-figure",
    label: "Media figure",
    description: "Image, diagram, video, or simulation frame.",
    guidance:
      "Use stable aspect ratios, visible borders, captions, and controls close to the media.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-media"><span>figure · 4:3</span></div>`,
  },
  {
    key: "media-caption",
    label: "Media caption",
    description: "Caption, credit, or short explanatory media text.",
    guidance:
      "Use neutral text and keep captions attached to the media they explain.",
    props: {
      textColor: "{colors.neutral}",
      typography: "{typography.label-md}",
    },
    preview: `<p class="design-token-caption">Figure 2. Shared criteria after review.</p>`,
  },
  {
    key: "knowledge-check",
    label: "Knowledge check",
    description: "Question card with prompt, choices, and action.",
    guidance:
      "Use a clear prompt hierarchy, stable choice spacing, and feedback directly below the selected answer.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.lg}",
      padding: "{spacing.lg}",
    },
    preview: `<div class="design-token-check"><strong>Which move helps critique?</strong><span>Name the criteria.</span></div>`,
  },
  {
    key: "quiz-choice",
    label: "Quiz choice",
    description: "Unselected answer option.",
    guidance:
      "Use visible boundaries, body text, and enough hit area for repeated choice selection.",
    props: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.on-surface}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-choice">Move faster through outputs</div>`,
  },
  {
    key: "quiz-choice-selected",
    label: "Quiz choice selected",
    description: "Selected answer option.",
    guidance:
      "Use colour plus state text or selection affordance. Do not rely on fill colour alone.",
    props: {
      backgroundColor: "{colors.primary}",
      textColor: "{colors.on-primary}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-choice design-token-choice--selected">Name the constraint first</div>`,
  },
  {
    key: "feedback-correct",
    label: "Feedback correct",
    description: "Correct-answer feedback.",
    guidance:
      "Use success text with a short rationale that explains why the answer works.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.secondary}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-feedback design-token-feedback--correct"><strong>Correct.</strong><span>The criteria are now visible.</span></div>`,
  },
  {
    key: "feedback-incorrect",
    label: "Feedback incorrect",
    description: "Incorrect-answer feedback.",
    guidance:
      "Use error colour with a next step. Avoid shaming language or colour-only feedback.",
    props: {
      backgroundColor: "{colors.error-container}",
      textColor: "{colors.error}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.md}",
    },
    preview: `<div class="design-token-feedback"><strong>Not quite.</strong><span>Review who names the criteria.</span></div>`,
  },
  {
    key: "progress-step",
    label: "Progress step",
    description: "Module step, section status, or completion marker.",
    guidance:
      "Use primary for current progress, neutral for upcoming steps, and text labels for completion state.",
    props: {
      backgroundColor: "{colors.surface-variant}",
      textColor: "{colors.on-surface}",
      typography: "{typography.label-md}",
      rounded: "{rounded.full}",
      padding: "{spacing.sm}",
    },
    preview: `<div class="design-token-progress"><span></span><strong>2 of 4</strong></div>`,
  },
  {
    key: "tooltip",
    label: "Tooltip",
    description: "Short contextual help.",
    guidance:
      "Use only for brief clarification. Keep placement outside scroll clipping.",
    props: {
      backgroundColor: "{colors.on-surface}",
      textColor: "{colors.surface}",
      typography: "{typography.label-md}",
      rounded: "{rounded.sm}",
      padding: "{spacing.sm}",
    },
    preview: `<div class="design-token-tooltip">Token role help</div>`,
  },
];

export const componentOptions = componentSpecs.map(
  (component) => component.key,
);

export const componentDescriptions = Object.fromEntries(
  componentSpecs.map((component) => [component.key, component.description]),
) as Record<string, string>;

export const learningDesignDos = [
  "Use consistent asset treatment for characters, icons, screenshots, stock photos, and AI-generated imagery.",
  "Keep feedback, hints, captions, and transcript controls close to the learner action or media they explain.",
  "Use repeated templates for scenarios, reflections, process steps, and knowledge checks so activities feel intentional.",
  "Use spacing, alignment, and hierarchy to make the learner's next action obvious.",
];

export const learningDesignDonts = [
  "Do not make every lesson block visually unique; customize repeatable patterns instead.",
  "Do not rely on colour alone for correctness, progress, warnings, selected state, or hidden hotspot feedback.",
  "Do not hide important learner controls such as hints, captions, transcripts, or reflection downloads.",
  "Do not mix illustration, photo, icon, and AI image styles without a clear asset-treatment rule.",
];

export const presets: DesignPreset[] = [
  {
    id: "cinematic",
    name: "Cinematic",
    systemName: "Cinematic Learning UI",
    description:
      "Dark, high-contrast course surfaces with luminous blue actions and immersive media-forward framing.",
    tokens: createTokens({
      colors: {
        primary: "#8cc8ff",
        "on-primary": "#102030",
        secondary: "#f0b26a",
        "on-secondary": "#211306",
        tertiary: "#b8a5ff",
        neutral: "#c4cad6",
        surface: "#111318",
        "surface-variant": "#1d2330",
        "on-surface": "#f5f7fb",
        outline: "#7f8898",
        error: "#ffb4ab",
        "error-container": "#3d1010",
      },
      font:
        fontOptions.find((font) => font.id === "source-sans")?.value ??
        defaultFont,
      bodySize: "1rem",
      headingSize: "1.55rem",
      bodyWeight: "400",
      headingWeight: "800",
      density: "comfortable",
      radius: "soft",
      elevation: "raised",
    }),
    sections: {
      typography:
        "Use confident headings, generous line height, and short body copy blocks so dark learning surfaces remain easy to scan.",
      layout:
        "Lead with media or diagrams, then place prompts, captions, transcript controls, and checks in clearly separated panels.",
      elevation:
        "Use visible depth for primary course cards. Keep secondary controls flatter so the media surface stays dominant.",
      shapes:
        "Use soft corners on cards and media panels, with tighter corners on controls.",
      components:
        "Include buttons, media figures, caption controls, transcript panels, cards, knowledge checks, answer feedback, progress indicators, and export checks.",
      dos: [
        "Use the bright primary colour for the next meaningful learner action.",
        "Keep captions and transcript controls visible near media.",
        "Use warm secondary accents for notes, timestamps, and supporting context.",
        "Pair dark surfaces with visible borders to preserve control boundaries.",
        "Keep feedback close to the question or media segment it explains.",
      ],
      donts: [
        "Do not put long reading passages on dense dark panels.",
        "Do not hide accessibility controls behind icon-only actions.",
        "Do not use glow or blur as the only boundary between controls.",
        "Do not rely on colour alone for progress, correctness, or warnings.",
        "Do not make secondary media controls look like the primary action.",
      ],
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    systemName: "Editorial Learning UI",
    description:
      "Warm reading surfaces, strong serif headings, and structured lesson pages for article-like learning.",
    tokens: createTokens({
      colors: {
        primary: "#8f1638",
        "on-primary": "#ffffff",
        secondary: "#244d63",
        "on-secondary": "#ffffff",
        tertiary: "#b86b2d",
        neutral: "#66584d",
        surface: "#fff9ef",
        "surface-variant": "#f1e4d2",
        "on-surface": "#211a16",
        outline: "#82705e",
        error: "#9f1d1d",
        "error-container": "#fff0ec",
      },
      font:
        fontOptions.find((font) => font.id === "source-serif")?.value ??
        defaultFont,
      bodySize: "1rem",
      headingSize: "1.45rem",
      bodyWeight: "400",
      headingWeight: "700",
      density: "comfortable",
      radius: "modest",
      elevation: "flat",
    }),
    sections: {
      typography:
        "Use editorial headings with readable body copy. Keep labels plain and avoid ornamental type for controls.",
      layout:
        "Use chapter-like sections, objectives, pull quotes, captions, and knowledge checks with consistent spacing before headings.",
      elevation:
        "Prefer borders and paper-like surface changes over obvious shadows.",
      shapes:
        "Use modest corners so reading cards feel polished without becoming playful.",
      components:
        "Include buttons, lists, cards, callouts, media figures, glossary terms, reflection prompts, knowledge checks, and answer feedback.",
      dos: [
        "Keep headings, summaries, examples, captions, and callouts visually distinct.",
        "Use warm surfaces for reading context, not for every control.",
        "Keep figure captions and transcript links close to the media.",
        "Use consistent heading rhythm across lesson pages.",
        "Show feedback as a short explanation rather than only a status label.",
      ],
      donts: [
        "Do not use magazine styling for operational tool panels.",
        "Do not let decorative typography reduce scannability.",
        "Do not make metadata compete with primary reading copy.",
        "Do not hide status or export checks below long article sections.",
        "Do not rely on colour alone for examples, warnings, or success states.",
      ],
    },
  },
  {
    id: "colorful",
    name: "Colorful",
    systemName: "Colorful Practice UI",
    description:
      "Expressive pink and teal accents for lively practice, visual examples, and frequent feedback.",
    tokens: createTokens({
      colors: {
        primary: "#b3125b",
        "on-primary": "#ffffff",
        secondary: "#005f78",
        "on-secondary": "#ffffff",
        tertiary: "#8c5cc9",
        neutral: "#6b5d73",
        surface: "#fff7fb",
        "surface-variant": "#f2e8ff",
        "on-surface": "#201526",
        outline: "#867394",
        error: "#a32020",
        "error-container": "#fff0ec",
      },
      font:
        fontOptions.find((font) => font.id === "montserrat")?.value ??
        defaultFont,
      bodySize: "1rem",
      headingSize: "1.42rem",
      bodyWeight: "400",
      headingWeight: "700",
      density: "spacious",
      radius: "soft",
      elevation: "subtle",
    }),
    sections: {
      typography:
        "Use friendly headings and plain body copy. Keep colour expressive in surfaces and states, not in long text.",
      layout:
        "Use generous spacing, bold example cards, and clear grouping for choices, hints, and feedback.",
      elevation:
        "Use soft shadows sparingly; rely on colour blocks and clear outlines for grouping.",
      shapes:
        "Use soft cards and pill-like secondary controls, while keeping primary buttons predictable.",
      components:
        "Include buttons, chips, cards, callouts, media figures, hint panels, reflection prompts, choice groups, knowledge checks, and answer feedback.",
      dos: [
        "Use colour to make activities and feedback memorable.",
        "Keep instructions close to the learner action.",
        "Use text and icons alongside colour for feedback.",
        "Preserve generous line height and spacing.",
        "Give hints and transcript panels stable space so the layout does not jump.",
      ],
      donts: [
        "Do not make every card a different colour.",
        "Do not use colour alone for feedback.",
        "Do not let decorative shapes compete with the prompt.",
        "Do not style optional help like primary content.",
        "Do not place captions or transcripts behind unclear controls.",
      ],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    systemName: "Minimal Learning UI",
    description:
      "Restrained monochrome learning surfaces with crisp hierarchy, strong boundaries, and low ornament.",
    tokens: createTokens({
      colors: {
        primary: "#202020",
        "on-primary": "#ffffff",
        secondary: "#4d5a52",
        "on-secondary": "#ffffff",
        tertiary: "#6d655c",
        neutral: "#5d625d",
        surface: "#ffffff",
        "surface-variant": "#f2f2ee",
        "on-surface": "#181818",
        outline: "#78786f",
        error: "#9b1c1c",
        "error-container": "#fff1f1",
      },
      font: defaultFont,
      bodySize: "1rem",
      headingSize: "1.3rem",
      bodyWeight: "400",
      headingWeight: "650",
      density: "compact",
      radius: "sharp",
      elevation: "flat",
    }),
    sections: {
      typography:
        "Use restrained sans serif typography with strong weight contrast and no decorative text treatments.",
      layout:
        "Use compact but readable spacing, stable rows, clear dividers, and predictable navigation.",
      elevation: "Prefer crisp borders and low shadows. Avoid heavy cards.",
      shapes: "Use sharper controls and smaller radii.",
      components:
        "Include buttons, inputs, lists, cards, media figures, knowledge checks, progress indicators, status banners, export checks, token tables, and accessibility rows.",
      dos: [
        "Keep controls close to the values they affect.",
        "Use compact spacing for repeated scanning.",
        "Let borders, headings, and spacing carry the design.",
        "Pair every status colour with text or an icon.",
        "Keep learner prompts visually distinct from metadata.",
      ],
      donts: [
        "Do not use oversized headings in dense panels.",
        "Do not add decorative imagery to operational views.",
        "Do not shift layout on hover or status changes.",
        "Do not bury export-blocking issues below advisory findings.",
        "Do not use dashboard density for learner reading surfaces.",
      ],
    },
  },
  {
    id: "technical",
    name: "Technical",
    systemName: "Technical Knowledge UI",
    description:
      "Cool blueprint surfaces for documentation, diagrams, tables, and procedural learning.",
    tokens: createTokens({
      colors: {
        primary: "#006b7d",
        "on-primary": "#ffffff",
        secondary: "#334f80",
        "on-secondary": "#ffffff",
        tertiary: "#7a4f12",
        neutral: "#4b5b66",
        surface: "#f8fbfc",
        "surface-variant": "#e8f0f3",
        "on-surface": "#111827",
        outline: "#667986",
        error: "#9f1d1d",
        "error-container": "#fff1f1",
      },
      font:
        fontOptions.find((font) => font.id === "source-sans")?.value ??
        defaultFont,
      bodySize: "1rem",
      headingSize: "1.28rem",
      bodyWeight: "400",
      headingWeight: "700",
      density: "compact",
      radius: "modest",
      elevation: "flat",
    }),
    sections: {
      typography:
        "Use clean documentation typography with compact labels, readable body text, and clear heading weight.",
      layout:
        "Use grids, tables, diagrams, step lists, and code or formula surfaces with stable spacing.",
      elevation:
        "Prefer borders, tinted panels, and section dividers over shadows.",
      shapes:
        "Use modest corners for panels and sharper treatments for tables, inputs, and code-like surfaces.",
      components:
        "Include buttons, inputs, lists, tables, cards, callouts, media figures, glossary terms, transcript panels, progress indicators, and export checks.",
      dos: [
        "Use diagrams and tables with visible captions and labels.",
        "Keep procedures in numbered or clearly grouped steps.",
        "Use secondary colour for reference links and supporting controls.",
        "Make boundaries visible on inputs, tables, and diagrams.",
        "Keep status and export checks near the affected content.",
      ],
      donts: [
        "Do not compress reading copy below 16px equivalent.",
        "Do not make diagrams depend on colour alone.",
        "Do not hide glossary definitions behind vague icons.",
        "Do not use decorative gradients on data or code-like surfaces.",
        "Do not let metadata overpower the learner task.",
      ],
    },
  },
];

function createTokens({
  colors,
  font,
  bodySize,
  headingSize,
  bodyWeight = "400",
  headingWeight = "700",
  density,
  radius,
  elevation,
}: {
  colors: Record<string, string>;
  font: string;
  bodySize: string;
  headingSize: string;
  bodyWeight?: string;
  headingWeight?: string;
  density: string;
  radius: string;
  elevation: string;
}): DesignTokenDocument {
  return {
    color: Object.fromEntries(
      Object.entries(colors).map(([name, value]) => [name, { value }]),
    ),
    font: {
      body: { value: font },
      heading: { value: font },
      mono: { value: 'SFMono-Regular, Consolas, "Liberation Mono", monospace' },
    },
    typeScale: {
      body: { value: bodySize },
      heading: { value: headingSize },
      bodyWeight: { value: bodyWeight },
      headingWeight: { value: headingWeight },
      lineHeight: { value: "1.55" },
    },
    space: spacingFor(density),
    radius: radiusFor(radius),
    elevation: elevationFor(elevation),
    motion: {
      fast: { value: "120ms" },
      standard: { value: "160ms" },
    },
    semanticPairs: [
      {
        name: "body",
        foreground: "color.on-surface",
        background: "color.surface",
      },
      {
        name: "heading",
        foreground: "color.on-surface",
        background: "color.surface",
      },
      {
        name: "neutral",
        foreground: "color.neutral",
        background: "color.surface",
      },
      {
        name: "body / surface-variant",
        foreground: "color.on-surface",
        background: "color.surface-variant",
      },
      {
        name: "heading / surface-variant",
        foreground: "color.on-surface",
        background: "color.surface-variant",
      },
      {
        name: "neutral / surface-variant",
        foreground: "color.neutral",
        background: "color.surface-variant",
      },
      {
        name: "primary",
        foreground: "color.on-primary",
        background: "color.primary",
      },
      {
        name: "secondary",
        foreground: "color.secondary",
        background: "color.surface",
      },
      {
        name: "secondary / surface-variant",
        foreground: "color.secondary",
        background: "color.surface-variant",
      },
      {
        name: "error",
        foreground: "color.error",
        background: "color.error-container",
      },
    ],
  };
}

export function spacingFor(kind: string): Record<string, TokenValue> {
  if (kind === "compact") {
    return toTokens({
      xs: "0.25rem",
      sm: "0.5rem",
      md: "0.875rem",
      lg: "1.25rem",
      xl: "1.75rem",
    });
  }
  if (kind === "spacious") {
    return toTokens({
      xs: "0.25rem",
      sm: "0.625rem",
      md: "1.25rem",
      lg: "1.75rem",
      xl: "2.5rem",
    });
  }
  return toTokens({
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  });
}

export function radiusFor(kind: string): Record<string, TokenValue> {
  if (kind === "sharp") {
    return toTokens({
      none: "0",
      sm: "0.1875rem",
      md: "0.25rem",
      lg: "0.375rem",
      xl: "0.5rem",
      full: "999px",
    });
  }
  if (kind === "soft") {
    return toTokens({
      none: "0",
      sm: "0.375rem",
      md: "0.875rem",
      lg: "1.125rem",
      xl: "1.5rem",
      full: "999px",
    });
  }
  return toTokens({
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "999px",
  });
}

export function elevationFor(kind: string): Record<string, TokenValue> {
  if (kind === "flat") {
    return toTokens({ panel: "none", raised: "none" });
  }
  if (kind === "raised") {
    return toTokens({
      panel: "0 3px 8px rgb(23 32 51 / 0.12)",
      raised: "0 16px 32px rgb(23 32 51 / 0.16)",
    });
  }
  return toTokens({
    panel: "0 1px 2px rgb(23 32 51 / 0.08)",
    raised: "0 12px 24px rgb(23 32 51 / 0.14)",
  });
}

export function toTokens(
  values: Record<string, string>,
): Record<string, TokenValue> {
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [name, { value }]),
  );
}

export function cloneSections(sections: DesignSections): DesignSections {
  return {
    ...sections,
    dos: mergeUnique(sections.dos, learningDesignDos),
    donts: mergeUnique(sections.donts, learningDesignDonts),
  };
}

function mergeUnique(primary: string[], secondary: string[]): string[] {
  return [...new Set([...primary, ...secondary])];
}
