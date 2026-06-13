// SPDX-License-Identifier: MIT

export type PraxityToolStatus = "ready" | "planned";

export interface PraxityToolRoute {
  id: string;
  label: string;
  href: string;
  status: PraxityToolStatus;
}

export const praxityTools = [
  {
    id: "design",
    label: "Design",
    href: "/tools/design",
    status: "ready",
  },
  {
    id: "compare",
    label: "Compare",
    href: "/tools/compare",
    status: "planned",
  },
  {
    id: "ivideo",
    label: "Interactive video",
    href: "/tools/ivideo",
    status: "planned",
  },
] as const satisfies readonly PraxityToolRoute[];
