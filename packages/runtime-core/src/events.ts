// SPDX-License-Identifier: MIT

export const PRAX_EVENTS = {
  ready: "prax:ready",
  progress: "prax:progress",
  complete: "prax:complete",
  score: "prax:score",
  state: "prax:state",
} as const;

export type PraxEventName = (typeof PRAX_EVENTS)[keyof typeof PRAX_EVENTS];

export interface PraxEventDetail {
  "prax:ready": { block: string; v: number };
  "prax:progress": { percent: number };
  "prax:complete": Record<string, never>;
  "prax:score": { raw: number; min: number; max: number };
  "prax:state": { state: unknown };
}

export function dispatchPraxEvent<TName extends PraxEventName>(
  target: EventTarget,
  name: TName,
  detail: PraxEventDetail[TName],
): void {
  target.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail,
    }),
  );
}
