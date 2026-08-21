import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const implementations = ["drupal", "a11yproject", "govuk", "proposed"];
const defaultBaseURL = `${pathToFileURL(path.resolve("tests.html")).href}`;
const baseURL = process.env.HIDDEN_TEST_URL || defaultBaseURL;

for (const implementation of implementations) {
  test(`${implementation}: axe scan`, async ({ page }) => {
    const targetURL = `${baseURL}?implementation=${implementation}`;
    await page.goto(targetURL);

    const axeResults = await new AxeBuilder({ page }).analyze();
    const output = {
      implementation,
      url: page.url(),
      violations: axeResults.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node) => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary
        }))
      })),
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
      inapplicable: axeResults.inapplicable.length
    };

    const logDir = path.resolve("guidepup/logs");
    await fs.mkdir(logDir, { recursive: true });
    await fs.writeFile(
      path.join(logDir, `axe-${implementation}.json`),
      JSON.stringify(output, null, 2) + "\n"
    );

    expect(
      axeResults.violations,
      `axe violations for ${implementation}: ${axeResults.violations
        .map((violation) => violation.id)
        .join(", ")}`
    ).toHaveLength(0);
  });
}