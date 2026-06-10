// SPDX-License-Identifier: MIT

import { bindPraxEvents, type PraxTrackingRuntime } from "./runtime.js";

export interface LocalRuntimeStore {
  completion: "completed" | "incomplete";
  score: { raw: number; min: number; max: number } | null;
  state: unknown;
}

export function createLocalRuntimeFacade(
  store: LocalRuntimeStore = {
    completion: "incomplete",
    score: null,
    state: null,
  },
): PraxTrackingRuntime & { store: LocalRuntimeStore } {
  const facade = {
    store,
    initialize: () => true,
    finish: () => true,
    commit: () => true,
    setCompletion: (status: "completed" | "incomplete") => {
      store.completion = status;
      return true;
    },
    setScore: (raw: number, min: number, max: number) => {
      store.score = { raw, min, max };
      return true;
    },
    setState: (state: unknown) => {
      store.state = state;
      return true;
    },
    bindPraxEvents: (root: EventTarget) => bindPraxEvents(root, facade),
  };

  return facade;
}
