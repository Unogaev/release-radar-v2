// scripts/runAcceptanceTests.ts
//
// Runs AT-01..AT-12 and prints a pass/fail summary. Exits non-zero on any
// failure. This is the literal Definition of Done for Phase 0 (spec §22):
// "все acceptance tests проходят без UI."

import { AT01 } from "../packages/testing/acceptance/AT-01";
import { AT02 } from "../packages/testing/acceptance/AT-02";
import { AT03 } from "../packages/testing/acceptance/AT-03";
import { AT04 } from "../packages/testing/acceptance/AT-04";
import { AT05 } from "../packages/testing/acceptance/AT-05";
import { AT06 } from "../packages/testing/acceptance/AT-06";
import { AT07 } from "../packages/testing/acceptance/AT-07";
import { AT08 } from "../packages/testing/acceptance/AT-08";
import { AT09 } from "../packages/testing/acceptance/AT-09";
import { AT10 } from "../packages/testing/acceptance/AT-10";
import { AT11 } from "../packages/testing/acceptance/AT-11";
import { AT12 } from "../packages/testing/acceptance/AT-12";
import { AcceptanceTest } from "../packages/testing/acceptance/testKit";

const tests: AcceptanceTest[] = [AT01, AT02, AT03, AT04, AT05, AT06, AT07, AT08, AT09, AT10, AT11, AT12];

console.log("=== Release Radar v2.0 — Phase 0 Acceptance Tests ===\n");

let totalFailures = 0;

for (const test of tests) {
  let failures: { message: string }[];
  try {
    failures = test.run();
  } catch (e) {
    failures = [{ message: e instanceof Error ? `THREW: ${e.message}` : `THREW: ${String(e)}` }];
  }

  const status = failures.length === 0 ? "PASS" : "FAIL";
  console.log(`[${status}] ${test.id} — ${test.title}`);
  for (const f of failures) {
    console.log(`        ✗ ${f.message}`);
    totalFailures++;
  }
}

console.log("");
if (totalFailures === 0) {
  console.log(`=== ALL ${tests.length} ACCEPTANCE TESTS PASSED — Phase 0 Definition of Done met ===`);
} else {
  console.log(`=== ${totalFailures} ASSERTION FAILURE(S) — Phase 0 NOT done ===`);
}

process.exit(totalFailures === 0 ? 0 : 1);
