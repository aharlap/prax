// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  bindPraxEvents,
  createLocalRuntimeFacade,
  createScorm2004Facade,
  createXapiFacade,
  type Scorm2004Api,
} from "./index.js";

class StrictScorm2004Api implements Scorm2004Api {
  calls: Array<[string, ...string[]]> = [];
  data = new Map<string, string>([["cmi.suspend_data", ""]]);
  #initialized = false;
  #lastError = "0";

  Initialize(parameter: string): string {
    this.calls.push(["Initialize", parameter]);
    if (parameter !== "" || this.#initialized) {
      return this.#fail("103");
    }
    this.#initialized = true;
    return this.#ok();
  }

  Terminate(parameter: string): string {
    this.calls.push(["Terminate", parameter]);
    if (parameter !== "" || !this.#initialized) {
      return this.#fail("112");
    }
    this.#initialized = false;
    return this.#ok();
  }

  GetValue(key: string): string {
    this.calls.push(["GetValue", key]);
    if (!this.#initialized) {
      this.#fail("122");
      return "";
    }
    this.#ok();
    return this.data.get(key) ?? "";
  }

  SetValue(key: string, value: string): string {
    this.calls.push(["SetValue", key, value]);
    if (!this.#initialized) {
      return this.#fail("132");
    }
    if (!this.#isValidSetValue(key, value)) {
      return this.#fail("406");
    }
    this.data.set(key, value);
    return this.#ok();
  }

  Commit(parameter: string): string {
    this.calls.push(["Commit", parameter]);
    if (parameter !== "" || !this.#initialized) {
      return this.#fail("142");
    }
    return this.#ok();
  }

  GetLastError(): string {
    return this.#lastError;
  }

  GetErrorString(errorCode: string): string {
    return errorCode === "406"
      ? "Data model element type mismatch"
      : "SCORM test error";
  }

  GetDiagnostic(errorCode: string): string {
    return `strict SCORM 2004 diagnostic ${errorCode}`;
  }

  #ok(): "true" {
    this.#lastError = "0";
    return "true";
  }

  #fail(code: string): "false" {
    this.#lastError = code;
    return "false";
  }

  #isValidSetValue(key: string, value: string): boolean {
    if (key === "cmi.completion_status") {
      return ["completed", "incomplete", "not attempted", "unknown"].includes(
        value,
      );
    }
    if (key === "cmi.success_status") {
      return ["passed", "failed", "unknown"].includes(value);
    }
    if (["cmi.score.raw", "cmi.score.min", "cmi.score.max"].includes(key)) {
      return value.trim() !== "" && Number.isFinite(Number(value));
    }
    if (key === "cmi.score.scaled") {
      const number = Number(value);
      return Number.isFinite(number) && number >= -1 && number <= 1;
    }
    if (key === "cmi.suspend_data") {
      return value.length <= 64_000;
    }
    return false;
  }
}

test("SCORM 2004 facade uses valid lifecycle, completion, score, and state fields", () => {
  const api = new StrictScorm2004Api();
  const facade = createScorm2004Facade(api);

  assert.equal(facade.initialize(), true);
  assert.equal(facade.setCompletion("completed"), true);
  assert.equal(facade.setScore(75, 0, 100), true);
  assert.equal(facade.setState({ slide: "intro" }), true);
  assert.equal(facade.commit(), true);
  assert.equal(facade.finish(), true);

  assert.equal(api.data.get("cmi.completion_status"), "completed");
  assert.equal(api.data.get("cmi.success_status"), "passed");
  assert.equal(api.data.get("cmi.score.raw"), "75");
  assert.equal(api.data.get("cmi.score.scaled"), "0.75");
  assert.equal(api.data.get("cmi.suspend_data"), '{"slide":"intro"}');
  assert.deepEqual(
    api.calls
      .map(([method]) => method)
      .filter((method) =>
        ["Initialize", "Commit", "Terminate"].includes(method),
      ),
    ["Initialize", "Commit", "Terminate"],
  );
});

test("local runtime facade records prax event bridge data without an LMS", () => {
  const target = new EventTarget();
  const facade = createLocalRuntimeFacade();
  const cleanup = facade.bindPraxEvents(target);

  target.dispatchEvent(
    new CustomEvent("prax:score", { detail: { raw: 9, min: 0, max: 10 } }),
  );
  target.dispatchEvent(
    new CustomEvent("prax:state", { detail: { state: { answer: "a" } } }),
  );
  target.dispatchEvent(new CustomEvent("prax:complete", { detail: {} }));
  cleanup();

  assert.deepEqual(facade.store.score, { raw: 9, min: 0, max: 10 });
  assert.deepEqual(facade.store.state, { answer: "a" });
  assert.equal(facade.store.completion, "completed");
});

test("event bridge awaits async facade calls before committing", async () => {
  const target = new EventTarget();
  const calls: string[] = [];
  const facade = {
    async initialize(): Promise<boolean> {
      calls.push("initialize");
      return true;
    },
    async finish(): Promise<boolean> {
      calls.push("finish");
      return true;
    },
    async commit(): Promise<boolean> {
      calls.push("commit");
      return true;
    },
    async setCompletion(): Promise<boolean> {
      await Promise.resolve();
      calls.push("setCompletion");
      return true;
    },
    async setScore(): Promise<boolean> {
      await Promise.resolve();
      calls.push("setScore");
      return true;
    },
    async setState(): Promise<boolean> {
      await Promise.resolve();
      calls.push("setState");
      return true;
    },
  };

  const cleanup = bindPraxEvents(target, facade);
  target.dispatchEvent(new CustomEvent("prax:complete", { detail: {} }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  cleanup();

  assert.deepEqual(calls, ["setCompletion", "commit"]);
});

test("xAPI facade records ADL-verb statements and prefixes mbox values", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });

  try {
    const facade = createXapiFacade({
      endpoint: "https://lrs.example.test/xapi/statements",
      actor: { name: "Test Learner", mbox: "learner@example.test" },
      activityId: "https://praxity.io/activities/compare-demo",
    });

    assert.equal(await facade.initialize(), true);
    assert.equal(await facade.setCompletion("completed"), true);

    assert.equal(facade.statements.length, 2);
    assert.equal(
      facade.statements[0]?.actor.mbox,
      "mailto:learner@example.test",
    );
    assert.equal(
      facade.statements[0]?.verb.id,
      "http://adlnet.gov/expapi/verbs/initialized",
    );
    assert.equal(
      facade.statements[1]?.verb.id,
      "http://adlnet.gov/expapi/verbs/completed",
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});
