// SPDX-License-Identifier: MIT

import { PRAX_EVENTS } from "@praxity/runtime-core/events";

export interface PraxTrackingFacade {
  initialize: () => boolean | Promise<boolean>;
  finish: () => boolean | Promise<boolean>;
  commit: () => boolean | Promise<boolean>;
  setCompletion: (
    status: "completed" | "incomplete",
  ) => boolean | Promise<boolean>;
  setScore: (
    raw: number,
    min: number,
    max: number,
  ) => boolean | Promise<boolean>;
  setState: (state: unknown) => boolean | Promise<boolean>;
}

export interface PraxTrackingRuntime extends PraxTrackingFacade {
  bindPraxEvents: (root: EventTarget) => () => void;
}

export function bindPraxEvents(
  root: EventTarget,
  facade: PraxTrackingFacade,
): () => void {
  const complete = (): void => {
    void runTrackingOperation(async () => {
      await facade.setCompletion("completed");
      await facade.commit();
    });
  };
  const score = (event: Event): void => {
    const detail = (
      event as CustomEvent<{ raw: number; min?: number; max?: number }>
    ).detail;
    if (typeof detail?.raw === "number") {
      void runTrackingOperation(async () => {
        await facade.setScore(detail.raw, detail.min ?? 0, detail.max ?? 100);
        await facade.commit();
      });
    }
  };
  const state = (event: Event): void => {
    const detail = (event as CustomEvent<{ state: unknown }>).detail;
    void runTrackingOperation(async () => {
      await facade.setState(detail?.state ?? null);
      await facade.commit();
    });
  };

  root.addEventListener(PRAX_EVENTS.complete, complete);
  root.addEventListener(PRAX_EVENTS.score, score);
  root.addEventListener(PRAX_EVENTS.state, state);

  return () => {
    root.removeEventListener(PRAX_EVENTS.complete, complete);
    root.removeEventListener(PRAX_EVENTS.score, score);
    root.removeEventListener(PRAX_EVENTS.state, state);
  };
}

async function runTrackingOperation(
  operation: () => Promise<void>,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    console.error("Prax tracking operation failed.", error);
  }
}
