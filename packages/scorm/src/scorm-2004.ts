// SPDX-License-Identifier: MIT

import { bindPraxEvents, type PraxTrackingRuntime } from "./runtime.js";

export interface Scorm2004Api {
  Initialize(parameter: string): string;
  Terminate(parameter: string): string;
  GetValue(key: string): string;
  SetValue(key: string, value: string): string;
  Commit(parameter: string): string;
  GetLastError(): string;
  GetErrorString(errorCode: string): string;
  GetDiagnostic(errorCode: string): string;
}

export interface Scorm2004Facade extends PraxTrackingRuntime {
  api: Scorm2004Api | null;
  getValue: (key: string) => string;
  setValue: (key: string, value: string) => boolean;
  getLastError: () => string;
}

const MAX_SEARCH_DEPTH = 10;

export function findScorm2004Api(
  startWindow: Window = window,
): Scorm2004Api | null {
  const openerApi = readFromChain(
    safeWindowValue(startWindow, "opener") as Window | null,
  );
  return openerApi ?? readFromChain(startWindow);
}

export function createScorm2004Facade(
  api: Scorm2004Api | null = findScorm2004Api(),
): Scorm2004Facade {
  const facade = {
    api,
    initialize: () => callBoolean(api, "Initialize", ""),
    finish: () => callBoolean(api, "Terminate", ""),
    commit: () => callBoolean(api, "Commit", ""),
    getValue: (key: string) => {
      const value = api?.GetValue(key) ?? "";
      warnOnScormError(api, "SCORM 2004");
      return value;
    },
    setValue: (key: string, value: string) => {
      const result = api?.SetValue(key, value) === "true";
      warnOnScormError(api, "SCORM 2004");
      return result;
    },
    setCompletion: (status: "completed" | "incomplete") => {
      const completionOk = facade.setValue("cmi.completion_status", status);
      const successOk =
        status === "completed"
          ? facade.setValue("cmi.success_status", "passed")
          : true;
      return completionOk && successOk;
    },
    setScore: (raw: number, min: number, max: number) => {
      const scaled = max === min ? 0 : clamp((raw - min) / (max - min), -1, 1);
      return (
        facade.setValue("cmi.score.raw", String(raw)) &&
        facade.setValue("cmi.score.min", String(min)) &&
        facade.setValue("cmi.score.max", String(max)) &&
        facade.setValue("cmi.score.scaled", String(scaled))
      );
    },
    setState: (state: unknown) =>
      facade.setValue("cmi.suspend_data", JSON.stringify(state)),
    getLastError: () => api?.GetLastError() ?? "0",
    bindPraxEvents: (root: EventTarget) => bindPraxEvents(root, facade),
  };

  return facade;
}

function readFromChain(startWindow: Window | null): Scorm2004Api | null {
  let current = startWindow;
  for (let depth = 0; current && depth < MAX_SEARCH_DEPTH; depth += 1) {
    const api = safeWindowValue(current, "API_1484_11") as
      | Scorm2004Api
      | undefined;
    if (api) {
      return api;
    }

    const parent = safeWindowValue(current, "parent") as Window | null;
    if (!parent || parent === current) {
      break;
    }
    current = parent;
  }

  return null;
}

function safeWindowValue(
  frame: Window,
  key: "API_1484_11" | "opener" | "parent",
): unknown {
  try {
    return (frame as Window & Record<string, unknown>)[key];
  } catch {
    return null;
  }
}

function callBoolean(
  api: Scorm2004Api | null,
  method: "Initialize" | "Terminate" | "Commit",
  parameter: string,
): boolean {
  if (!api) {
    return false;
  }

  return api[method](parameter) === "true";
}

function warnOnScormError(api: Scorm2004Api | null, label: string): void {
  if (!api) {
    return;
  }

  const code = api.GetLastError();
  if (code === "0") {
    return;
  }

  const message = api.GetErrorString(code);
  const diagnostic = api.GetDiagnostic(code);
  console.warn(
    `[${label}] Error ${code}: ${message}${diagnostic ? ` (${diagnostic})` : ""}`,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
