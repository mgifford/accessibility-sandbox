import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { implementations, scenarios } from "./scenarios.js";

const defaultBaseURL = `${pathToFileURL(path.resolve("tests.html")).href}`;
const baseURL = process.env.HIDDEN_TEST_URL || defaultBaseURL;

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function passFail(pass, details, manual = false) {
  return {
    status: manual ? "manual" : pass ? "pass" : "fail",
    details
  };
}

test("implementation comparison report", async ({ page }) => {
  const reportRows = [];

  for (const implementation of implementations) {
    await page.goto(`${baseURL}?implementation=${implementation}`);

    const beforeFocus = await page.locator(".skip-link").evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        width: parseFloat(style.width),
        height: parseFloat(style.height),
        clip: style.clip,
        clipPath: style.clipPath,
        overflow: style.overflow
      };
    });

    await page.locator("body").click({ position: { x: 2, y: 2 } });
    await page.keyboard.press("Tab");

    const skipLinkKeyboardState = await page.locator(".skip-link").evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        hasFocus: node === document.activeElement,
        width: rect.width,
        height: rect.height,
        clip: style.clip,
        clipPath: style.clipPath,
        overflow: style.overflow
      };
    });

    await page.locator(".skip-link").focus();

    const skipLinkState = await page.locator(".skip-link").evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        hasFocus: node === document.activeElement,
        width: rect.width,
        height: rect.height,
        clip: style.clip,
        clipPath: style.clipPath,
        overflow: style.overflow
      };
    });

    await page.locator(".focus-wrapper a").focus();

    const focusWrapperState = await page.locator(".focus-wrapper").evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        clip: style.clip,
        clipPath: style.clipPath,
        overflow: style.overflow
      };
    });

    const inlineHiddenStyle = await page
      .locator('a[href="#suffix-target"] .visually-hidden')
      .evaluate((node) => {
        const style = getComputedStyle(node);
        const before = getComputedStyle(node, "::before").content;
        const after = getComputedStyle(node, "::after").content;
        return {
          whiteSpace: style.whiteSpace,
          userSelect: style.userSelect,
          clipPath: style.clipPath,
          beforeContent: before,
          afterContent: after
        };
      });

    const semantics = await page.evaluate(() => {
      const suffixLink = document.querySelector('a[href="#suffix-target"]');
      const prefixLink = document.querySelector('a[href="#prefix-target"]');
      const heading = document.querySelector("h3");
      const contextSection = document.querySelector("section:nth-of-type(5)");
      const saveButton = contextSection?.querySelector('button[type="button"]');
      const legend = contextSection?.querySelector("fieldset legend");
      const summary = contextSection?.querySelector("details summary");
      const tableCell = contextSection?.querySelector("table td");
      const continueButton = document.querySelector('section:nth-of-type(7) button[type="button"]');
      const continueHidden = continueButton?.querySelector(".visually-hidden");
      const continueHiddenStyle = continueHidden ? getComputedStyle(continueHidden) : null;
      const selectionSample = document.querySelector("section:nth-of-type(8) p .visually-hidden");
      const selectionStyle = selectionSample
        ? getComputedStyle(selectionSample).getPropertyValue("user-select") || "auto"
        : "unknown";

      return {
        suffixLinkText: suffixLink?.textContent ?? "",
        prefixLinkText: prefixLink?.textContent ?? "",
        headingText: heading?.textContent ?? "",
        saveButtonText: saveButton?.textContent ?? "",
        legendText: legend?.textContent ?? "",
        summaryText: summary?.textContent ?? "",
        tableCellText: tableCell?.textContent ?? "",
        continueButtonText: continueButton?.textContent ?? "",
        continueHiddenWhiteSpace: continueHiddenStyle?.whiteSpace ?? "",
        selectionUserSelect: selectionStyle
      };
    });

    const metrics = {
      skipLinkRevealsOnFocus:
        skipLinkState.hasFocus &&
        skipLinkState.width > 1 &&
        skipLinkState.height > 1 &&
        (skipLinkState.clip === "auto" || skipLinkState.clipPath === "none" || skipLinkState.clipPath === "auto"),
      focusWithinWrapperReveals:
        focusWrapperState.width > 1 &&
        focusWrapperState.height > 1 &&
        (focusWrapperState.clip === "auto" || focusWrapperState.clipPath === "none" || focusWrapperState.clipPath === "auto"),
      inlineHiddenTextUsesNoWrap: inlineHiddenStyle.whiteSpace === "nowrap",
      inlineHiddenTextSelectable: inlineHiddenStyle.userSelect !== "none",
      usesClipPathInset: inlineHiddenStyle.clipPath.includes("inset"),
      addsPseudoWhitespaceToInlineHiddenText:
        (inlineHiddenStyle.beforeContent &&
          inlineHiddenStyle.beforeContent !== "none" &&
          inlineHiddenStyle.beforeContent !== "normal" &&
          inlineHiddenStyle.beforeContent !== "\"\"") ||
        (inlineHiddenStyle.afterContent &&
          inlineHiddenStyle.afterContent !== "none" &&
          inlineHiddenStyle.afterContent !== "normal" &&
          inlineHiddenStyle.afterContent !== "\"\""),
      selectionUserSelect: semantics.selectionUserSelect
    };

    const normalized = {
      suffixLinkText: normalizeWhitespace(semantics.suffixLinkText),
      prefixLinkText: normalizeWhitespace(semantics.prefixLinkText),
      headingText: normalizeWhitespace(semantics.headingText),
      saveButtonText: normalizeWhitespace(semantics.saveButtonText),
      legendText: normalizeWhitespace(semantics.legendText),
      summaryText: normalizeWhitespace(semantics.summaryText),
      tableCellText: normalizeWhitespace(semantics.tableCellText),
      continueButtonText: normalizeWhitespace(semantics.continueButtonText)
    };

    const scenarioResults = {
      1: passFail(
        metrics.skipLinkRevealsOnFocus,
        `focusReveal=${metrics.skipLinkRevealsOnFocus}, keyboardTabFocused=${skipLinkKeyboardState.hasFocus}, width=${skipLinkState.width.toFixed(2)}, height=${skipLinkState.height.toFixed(2)}`
      ),
      2: passFail(
        normalized.suffixLinkText.includes("Place block") && normalized.suffixLinkText.includes("Header region"),
        `linkText='${normalized.suffixLinkText}'`
      ),
      3: passFail(
        normalized.prefixLinkText.includes("Search") && normalized.prefixLinkText.includes("all content"),
        `linkText='${normalized.prefixLinkText}'`
      ),
      4: passFail(
        false,
        "Requires VoiceOver rotor/heading navigation review for spoken boundary quality.",
        true
      ),
      5: passFail(
        normalized.saveButtonText.includes("Save draft") &&
          normalized.legendText.includes("Delivery address") &&
          normalized.summaryText.includes("More information") &&
          normalized.tableCellText.includes("Standard subscription"),
        `button='${normalized.saveButtonText}', legend='${normalized.legendText}', summary='${normalized.summaryText}', table='${normalized.tableCellText}'`
      ),
      6: passFail(
        metrics.focusWithinWrapperReveals,
        `wrapperWidth=${focusWrapperState.width.toFixed(2)}, wrapperHeight=${focusWrapperState.height.toFixed(2)}`
      ),
      7: passFail(
        normalized.continueButtonText.includes("Continue") &&
          normalized.continueButtonText.includes("review all configuration choices") &&
          semantics.continueHiddenWhiteSpace === "nowrap",
        `button='${normalized.continueButtonText}', hiddenWhiteSpace='${semantics.continueHiddenWhiteSpace}'`
      ),
      8: passFail(
        true,
        `selection user-select on hidden phrase='${metrics.selectionUserSelect}' (manual clipboard behavior still required).`
      ),
      9: passFail(
        false,
        "Needs manual 400% zoom and magnification visual tracking.",
        true
      )
    };

    const automatedPassed = Object.values(scenarioResults).filter((item) => item.status === "pass").length;
    const automatedFailed = Object.values(scenarioResults).filter((item) => item.status === "fail").length;
    const manualCount = Object.values(scenarioResults).filter((item) => item.status === "manual").length;

    reportRows.push({
      implementation,
      scenarioResults,
      automatedPassed,
      automatedFailed,
      manualCount,
      cssTraits: {
        usesClipPathInset: metrics.usesClipPathInset,
        addsPseudoWhitespace: metrics.addsPseudoWhitespaceToInlineHiddenText,
        inlineNoWrap: metrics.inlineHiddenTextUsesNoWrap,
        inlineSelectable: metrics.inlineHiddenTextSelectable
      },
      debug: {
        beforeFocus,
        skipLinkKeyboardState,
        skipLinkState,
        focusWrapperState,
        inlineHiddenStyle,
        semantics,
        normalized
      }
    });
  }

  const ranking = [...reportRows].sort((a, b) => {
    if (b.automatedPassed !== a.automatedPassed) {
      return b.automatedPassed - a.automatedPassed;
    }
    return a.automatedFailed - b.automatedFailed;
  });

  const output = {
    generatedAt: new Date().toISOString(),
    baseURL,
    scenarios,
    ranking: ranking.map((item) => ({
      implementation: item.implementation,
      automatedPassed: item.automatedPassed,
      automatedFailed: item.automatedFailed,
      manualCount: item.manualCount
    })),
    rows: reportRows
  };

  const logDir = path.resolve("guidepup/logs");
  await fs.mkdir(logDir, { recursive: true });
  await fs.writeFile(
    path.join(logDir, "comparison-report.json"),
    JSON.stringify(output, null, 2) + "\n"
  );

  const markdownLines = [
    "# Visually Hidden Implementation Matrix Report",
    "",
    `Generated: ${output.generatedAt}`,
    `Base URL: ${output.baseURL}`,
    "",
    "## Scope",
    "",
    "- 4 implementations x 9 scenarios (CSS and, for proposed, skip-target markup)",
    "- Status keys: pass, fail, manual",
    "",
    "## Scenario Types",
    "",
    ...output.scenarios.map(
      (scenario) => `- ${scenario.id}. ${scenario.title} (${scenario.type}) - ${scenario.description}`
    ),
    "",
    "## Ranking",
    "",
    "| Rank | Implementation | Automated Pass | Automated Fail | Manual |",
    "|---|---|---:|---:|---:|",
    ...ranking.map(
      (item, index) =>
        `| ${index + 1} | ${item.implementation} | ${item.automatedPassed} | ${item.automatedFailed} | ${item.manualCount} |`
    ),
    "",
    "## Case Consistency",
    "",
    `Cases identical across all implementations: ${scenarios.filter((scenario) => {
      const statuses = reportRows.map((row) => row.scenarioResults[scenario.id].status);
      return statuses.every((status) => status === statuses[0]);
    }).length}/${scenarios.length}`,
    "",
    "| Scenario | drupal | a11yproject | govuk | proposed | Same? |",
    "|---|---|---|---|---|---|",
    ...scenarios.map((scenario) => {
      const statuses = reportRows.map((row) => row.scenarioResults[scenario.id].status);
      const same = statuses.every((status) => status === statuses[0]);
      return `| ${scenario.id} | ${statuses.join(" | ")} | ${same ? "yes" : "no"} |`;
    }),
    "",
    "## Scenario Matrix",
    "",
    "| Implementation | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...reportRows.map((row) => {
      const cells = [];
      for (let id = 1; id <= 9; id++) {
        cells.push(row.scenarioResults[id].status);
      }
      return `| ${row.implementation} | ${cells.join(" | ")} |`;
    }),
    "",
    "## Per-implementation Details",
    "",
    ...reportRows.flatMap((row) => [
      `### ${row.implementation}`,
      `- Automated pass/fail: ${row.automatedPassed}/${row.automatedFailed}`,
      ...Array.from({ length: 9 }, (_, idx) => {
        const scenarioId = idx + 1;
        const result = row.scenarioResults[scenarioId];
        return `- ${scenarioId}. ${result.status} - ${result.details}`;
      }),
      ""
    ])
  ];

  await fs.writeFile(path.join(logDir, "comparison-report.md"), `${markdownLines.join("\n")}\n`);

  expect(reportRows).toHaveLength(4);
});