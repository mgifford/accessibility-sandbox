import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const implementations = ["drupal", "a11yproject", "govuk", "proposed"];
const defaultBaseURL = `${pathToFileURL(path.resolve("tests.html")).href}`;
const baseURL = process.env.HIDDEN_TEST_URL || defaultBaseURL;
const strictBaseline = process.env.ELEMENTS_STRICT_BASELINE === "1";

const cases = [
  {
    id: "skip-link",
    selector: ".skip-link",
    expectedPhrases: ["Skip to main content"],
    check: "reveals-on-tab-focus"
  },
  {
    id: "suffix-link",
    selector: 'a[href="#suffix-target"]',
    expectedPhrases: ["Place block", "Header region"],
    check: "hidden-suffix-present"
  },
  {
    id: "prefix-link",
    selector: 'a[href="#prefix-target"]',
    expectedPhrases: ["Search", "all content"],
    check: "hidden-prefix-present"
  },
  {
    id: "focus-within-wrapper",
    selector: ".focus-wrapper",
    expectedPhrases: ["Hidden wrapper context", "Focusable descendant inside hidden wrapper"],
    check: "reveals-when-descendant-focused",
    focusSelector: ".focus-wrapper a"
  },
  {
    id: "save-button",
    selector: 'section:nth-of-type(5) button[type="button"]',
    expectedPhrases: ["Save", "draft"],
    check: "button-hidden-text-present"
  },
  {
    id: "fieldset-legend",
    selector: "section:nth-of-type(5) fieldset legend",
    expectedPhrases: ["Delivery", "address"],
    check: "legend-hidden-text-present"
  },
  {
    id: "details-summary",
    selector: "section:nth-of-type(5) details summary",
    expectedPhrases: ["More", "information"],
    check: "summary-hidden-text-present"
  },
  {
    id: "table-cell",
    selector: "section:nth-of-type(5) table td",
    expectedPhrases: ["Standard", "subscription"],
    check: "table-hidden-text-present"
  },
  {
    id: "continue-button",
    selector: "section:nth-of-type(7) button",
    expectedPhrases: ["Continue", "review all configuration choices"],
    check: "long-hidden-text-present"
  },
  {
    id: "selection-phrase",
    selector: "section:nth-of-type(8) p .visually-hidden",
    expectedPhrases: ["including this hidden phrase"],
    check: "selection-style"
  }
];

function normalize(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function findPhraseMatches(text, phrases) {
  const haystack = normalize(text);
  const lowerHaystack = haystack.toLowerCase();
  return phrases.map((phrase) => {
    const lowerPhrase = phrase.toLowerCase();
    const index = lowerHaystack.indexOf(lowerPhrase);
    return {
      phrase,
      found: index >= 0,
      index,
      source: "textContent"
    };
  });
}

async function captureElementState(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const computedUserSelect = style.getPropertyValue("user-select") || style.userSelect || "";
    const hiddenParts = Array.from(element.querySelectorAll(".visually-hidden")).map((node) => {
      const nodeStyle = getComputedStyle(node);
      const nodeRect = node.getBoundingClientRect();
      const hiddenUserSelect = nodeStyle.getPropertyValue("user-select") || nodeStyle.userSelect || "";
      return {
        text: (node.textContent || "").replace(/\s+/g, " ").trim(),
        width: nodeRect.width,
        height: nodeRect.height,
        clip: nodeStyle.clip,
        clipPath: nodeStyle.clipPath,
        overflow: nodeStyle.overflow,
        whiteSpace: nodeStyle.whiteSpace,
        userSelect: hiddenUserSelect
      };
    });

    const section = element.closest("section");
    const sectionHeading = section?.querySelector("h2")?.textContent || "";

    return {
      tagName: element.tagName,
      textContent: (element.textContent || "").replace(/\s+/g, " ").trim(),
      innerText: (element.innerText || "").replace(/\s+/g, " ").trim(),
      width: rect.width,
      height: rect.height,
      clip: style.clip,
      clipPath: style.clipPath,
      overflow: style.overflow,
      whiteSpace: style.whiteSpace,
      userSelect: computedUserSelect,
      hasFocus: element === document.activeElement,
      sectionHeading: sectionHeading.replace(/\s+/g, " ").trim(),
      hiddenParts
    };
  });
}

function evaluateCase(implementation, testCase, before, after) {
  const phraseMatches = findPhraseMatches(after.textContent, testCase.expectedPhrases);
  const allPhrasesFound = phraseMatches.every((match) => match.found);

  let status = "pass";
  let details = "";

  if (testCase.check === "reveals-on-tab-focus") {
    const revealed = after.width > 1 && after.height > 1 && (after.clip === "auto" || after.clipPath === "none" || after.clipPath === "auto");
    status = revealed ? "pass" : "fail";
    details = `revealed=${revealed}, width=${after.width.toFixed(2)}, height=${after.height.toFixed(2)}, clip=${after.clip}, clipPath=${after.clipPath}`;
  } else if (testCase.check === "reveals-when-descendant-focused") {
    const revealed = after.width > 1 && after.height > 1 && (after.clip === "auto" || after.clipPath === "none" || after.clipPath === "auto");
    status = revealed ? "pass" : "fail";
    details = `revealed_on_descendant_focus=${revealed}, width=${after.width.toFixed(2)}, height=${after.height.toFixed(2)}`;
  } else if (testCase.check === "selection-style") {
    const expectedNone = implementation === "govuk";
    const observedNone = after.userSelect === "none";
    const matchesExpected = expectedNone ? observedNone : !observedNone;
    status = matchesExpected ? "pass" : "fail";
    details = `userSelect=${after.userSelect}, expected=${expectedNone ? "none" : "not none"}`;
  } else {
    status = allPhrasesFound ? "pass" : "fail";
    details = `all_expected_phrases_found=${allPhrasesFound}`;
  }

  return {
    id: testCase.id,
    selector: testCase.selector,
    check: testCase.check,
    status,
    details,
    sectionHeading: after.sectionHeading,
    expectedPhrases: testCase.expectedPhrases,
    phraseMatches,
    before,
    after
  };
}

test("element-level hidden content report", async ({ page }) => {
  const rows = [];

  for (const implementation of implementations) {
    await page.goto(`${baseURL}?implementation=${implementation}`);
    await page.waitForLoadState("domcontentloaded");

    // Needed so skip link can become first keyboard target.
    await page.locator("body").click({ position: { x: 2, y: 2 } });
    await page.keyboard.press("Tab");

    const results = [];

    for (const testCase of cases) {
      const count = await page.locator(testCase.selector).count();
      if (count === 0) {
        results.push({
          id: testCase.id,
          selector: testCase.selector,
          check: testCase.check,
          status: "fail",
          details: "selector not found",
          sectionHeading: "",
          expectedPhrases: testCase.expectedPhrases,
          phraseMatches: []
        });
        continue;
      }

      const before = await captureElementState(page, testCase.selector);

      if (testCase.focusSelector) {
        await page.locator(testCase.focusSelector).focus();
      } else {
        await page.locator(testCase.selector).focus();
      }

      const after = await captureElementState(page, testCase.selector);
      results.push(evaluateCase(implementation, testCase, before, after));
    }

    const passed = results.filter((item) => item.status === "pass").length;
    const failed = results.filter((item) => item.status === "fail").length;

    rows.push({ implementation, passed, failed, results });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    baseURL,
    rows,
    baseline: {
      canonicalImplementation: "proposed",
      strict: strictBaseline,
      divergences: []
    }
  };

  const proposedRow = rows.find((row) => row.implementation === "proposed");
  if (proposedRow) {
    for (const row of rows) {
      if (row.implementation === "proposed") {
        continue;
      }

      for (const result of row.results) {
        const baselineResult = proposedRow.results.find((item) => item.id === result.id);
        if (!baselineResult) {
          output.baseline.divergences.push({
            implementation: row.implementation,
            caseId: result.id,
            reason: "missing_baseline_case"
          });
          continue;
        }

        if (result.status !== baselineResult.status) {
          output.baseline.divergences.push({
            implementation: row.implementation,
            caseId: result.id,
            reason: "status_mismatch",
            expectedStatus: baselineResult.status,
            observedStatus: result.status,
            expectedDetails: baselineResult.details,
            observedDetails: result.details
          });
        }

        const baselinePhraseMap = new Map(
          (baselineResult.phraseMatches || []).map((match) => [match.phrase, match.found])
        );

        for (const phraseMatch of result.phraseMatches || []) {
          const expectedFound = baselinePhraseMap.get(phraseMatch.phrase);
          if (typeof expectedFound === "boolean" && expectedFound !== phraseMatch.found) {
            output.baseline.divergences.push({
              implementation: row.implementation,
              caseId: result.id,
              reason: "phrase_match_mismatch",
              phrase: phraseMatch.phrase,
              expectedFound,
              observedFound: phraseMatch.found
            });
          }
        }
      }
    }
  }

  const logDir = path.resolve("guidepup/logs");
  await fs.mkdir(logDir, { recursive: true });
  await fs.writeFile(path.join(logDir, "elements-report.json"), `${JSON.stringify(output, null, 2)}\n`);

  const lines = [
    "# Element-Level Hidden Content Report",
    "",
    `Generated: ${output.generatedAt}`,
    `Base URL: ${baseURL}`,
    "",
    "## Summary",
    "",
    "| Implementation | Passed | Failed |",
    "|---|---:|---:|",
    ...rows.map((row) => `| ${row.implementation} | ${row.passed} | ${row.failed} |`),
    "",
    "## Case Consistency",
    "",
    `Cases identical across all implementations: ${rows[0]?.results?.filter((_, index) => {
      const caseId = rows[0].results[index].id;
      return rows.every((row) => row.results.find((result) => result.id === caseId)?.status === rows[0].results[index].status);
    }).length || 0}/${rows[0]?.results?.length || 0}`,
    "",
    "| Case | drupal | a11yproject | govuk | proposed | Same? |",
    "|---|---|---|---|---|---|",
    ...(rows[0]?.results || []).map((result) => {
      const statuses = rows.map((row) => row.results.find((item) => item.id === result.id)?.status || "missing");
      const same = statuses.every((status) => status === statuses[0]);
      return `| ${result.id} | ${statuses.join(" | ")} | ${same ? "yes" : "no"} |`;
    }),
    "",
    "## Baseline Divergences (proposed canonical)",
    "",
    output.baseline.divergences.length === 0
      ? "No divergences from proposed baseline detected."
      : "| Implementation | Case | Reason | Expected | Observed |",
    output.baseline.divergences.length === 0
      ? ""
      : "|---|---|---|---|---|",
    ...output.baseline.divergences.map((diff) => {
      const expected =
        diff.expectedStatus ??
        (typeof diff.expectedFound === "boolean" ? String(diff.expectedFound) : "-");
      const observed =
        diff.observedStatus ??
        (typeof diff.observedFound === "boolean" ? String(diff.observedFound) : "-");
      return `| ${diff.implementation} | ${diff.caseId} | ${diff.reason} | ${expected} | ${observed} |`;
    }),
    "",
    "## Detailed Results",
    ""
  ];

  for (const row of rows) {
    lines.push(`### ${row.implementation}`);
    for (const result of row.results) {
      lines.push(`- ${result.id} [${result.status}] selector=${result.selector}`);
      lines.push(`  - section: ${result.sectionHeading || "(none)"}`);
      lines.push(`  - details: ${result.details}`);
      if (result.phraseMatches?.length) {
        for (const match of result.phraseMatches) {
          lines.push(
            `  - phrase='${match.phrase}' found=${match.found} index=${match.index}`
          );
        }
      }
    }
    lines.push("");
  }

  await fs.writeFile(path.join(logDir, "elements-report.md"), `${lines.join("\n")}\n`);

  expect(rows).toHaveLength(4);

  if (strictBaseline) {
    expect(proposedRow).toBeDefined();
    expect(proposedRow.failed).toBe(0);
    expect(output.baseline.divergences).toHaveLength(0);
  }
});
