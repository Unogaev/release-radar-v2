// packages/testing/acceptance/testKit.ts
//
// Minimal, dependency-free assertion helpers. No vitest/jest — this sandbox
// has no network access for npm install, and pure-function domain logic
// doesn't need a heavy test framework to be rigorously checked. Runs via
// `tsx` directly (see scripts/runAcceptanceTests.ts).

export interface AssertionFailure {
  message: string;
}

export class TestContext {
  failures: AssertionFailure[] = [];

  assertEqual<T>(actual: T, expected: T, label: string) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (!pass) {
      this.failures.push({
        message: `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      });
    }
  }

  assertTrue(condition: boolean, label: string) {
    if (!condition) this.failures.push({ message: `${label}: expected true, got false` });
  }

  assertFalse(condition: boolean, label: string) {
    if (condition) this.failures.push({ message: `${label}: expected false, got true` });
  }

  assertIncludes(haystack: string[], needle: string, label: string) {
    if (!haystack.some((h) => h.includes(needle))) {
      this.failures.push({
        message: `${label}: expected one entry to include "${needle}", got [${haystack.join(" | ")}]`,
      });
    }
  }
}

export interface AcceptanceTest {
  id: string;
  title: string;
  run: () => AssertionFailure[];
}
