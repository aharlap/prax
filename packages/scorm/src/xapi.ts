// SPDX-License-Identifier: MIT

import { bindPraxEvents, type PraxTrackingRuntime } from "./runtime.js";

export interface XapiActor {
  name: string;
  mbox: string;
}

export interface XapiConfig {
  endpoint: string;
  auth?: string;
  actor: XapiActor;
  activityId: string;
}

export interface XapiStatement {
  actor: {
    name: string;
    mbox: string;
  };
  verb: {
    id: string;
    display: { "en-US": string };
  };
  object: {
    id: string;
  };
  result?: {
    completion?: boolean;
    score?: {
      raw: number;
      min: number;
      max: number;
      scaled: number;
    };
    extensions?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface XapiFacade extends PraxTrackingRuntime {
  statements: XapiStatement[];
  sendStatement: (statement: XapiStatement) => Promise<boolean>;
}

const ADL_VERB_BASE = "http://adlnet.gov/expapi/verbs";

export function createXapiFacade(config: XapiConfig): XapiFacade {
  const statements: XapiStatement[] = [];

  const facade = {
    statements,
    initialize: async () => recordAndSend(config, statements, "initialized"),
    finish: async () =>
      recordAndSend(config, statements, "completed", {
        completion: true,
      }),
    commit: () => true,
    setCompletion: async (status: "completed" | "incomplete") =>
      recordAndSend(
        config,
        statements,
        status === "completed" ? "completed" : "attempted",
        {
          completion: status === "completed",
        },
      ),
    setScore: async (raw: number, min: number, max: number) =>
      recordAndSend(config, statements, "scored", {
        score: {
          raw,
          min,
          max,
          scaled: max === min ? 0 : (raw - min) / (max - min),
        },
      }),
    setState: async (state: unknown) =>
      recordAndSend(config, statements, "experienced", {
        extensions: {
          "https://praxity.io/xapi/extensions/state": state,
        },
      }),
    sendStatement: (statement: XapiStatement) =>
      sendStatement(config, statement),
    bindPraxEvents: (root: EventTarget) => bindPraxEvents(root, facade),
  };

  return facade;
}

async function recordAndSend(
  config: XapiConfig,
  statements: XapiStatement[],
  verb: string,
  result?: XapiStatement["result"],
): Promise<boolean> {
  const statement = buildStatement(config, verb, result);
  statements.push(statement);
  return sendStatement(config, statement);
}

function buildStatement(
  config: XapiConfig,
  verb: string,
  result?: XapiStatement["result"],
): XapiStatement {
  return {
    actor: {
      name: config.actor.name,
      mbox: config.actor.mbox.startsWith("mailto:")
        ? config.actor.mbox
        : `mailto:${config.actor.mbox}`,
    },
    verb: {
      id: `${ADL_VERB_BASE}/${verb}`,
      display: { "en-US": verb },
    },
    object: {
      id: config.activityId,
    },
    ...(result ? { result } : {}),
    timestamp: new Date().toISOString(),
  };
}

async function sendStatement(
  config: XapiConfig,
  statement: XapiStatement,
): Promise<boolean> {
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.auth ? { Authorization: config.auth } : {}),
        "X-Experience-API-Version": "1.0.3",
      },
      body: JSON.stringify(statement),
    });
    return response.ok;
  } catch {
    return false;
  }
}
