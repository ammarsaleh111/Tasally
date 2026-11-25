import assert from "node:assert/strict";
import test from "node:test";
import { getResultIdentity, resultIdentityStorageKey, storeResultIdentity } from "../src/utils/resultIdentity";
import { setSession } from "../src/utils/sessionManager";

test("replay ownership is JSON stored and scoped to the current account", () => {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  };
  const localStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
  Object.defineProperty(globalThis, "window", { value: { localStorage: storage }, configurable: true });

  const signIn = (userId: string) => setSession({
    userId, role: "USER", displayName: null, createdAt: "2026-11-25", version: 1,
  });

  try {
    signIn("account-one");
    const firstKey = resultIdentityStorageKey();
    storeResultIdentity(firstKey, "identity-one");
    assert.equal(JSON.parse(entries.get(firstKey)!), "identity-one");
    assert.equal(getResultIdentity(), "identity-one");

    signIn("account-two");
    assert.equal(getResultIdentity(), null);
    storeResultIdentity(firstKey, "identity-two");
    assert.equal(getResultIdentity(), null);

    signIn("account-one");
    assert.equal(getResultIdentity(), "identity-one");
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    if (localStorageDescriptor) Object.defineProperty(globalThis, "localStorage", localStorageDescriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
