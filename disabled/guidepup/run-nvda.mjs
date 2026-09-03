#!/usr/bin/env node
// Standalone NVDA scenarios for the disabled-controls experiment (Windows only).
//
// Mirrors run-voiceover.mjs but drives NVDA via Guidepup. NVDA and Chrome/Firefox
// are the most common real-world combination, and terminology differs from
// VoiceOver, so scenarios match a set of accepted phrases rather than one exact
// transcript. This cannot run on macOS; it is provided so the same scenarios can
// be captured on Windows.
//
// Prerequisites (Windows): install NVDA, run `npx @guidepup/setup`, and start from
// a session where Guidepup can control NVDA. Run: npm run test:nvda

import { chromium } from "playwright";
import { nvda } from "@guidepup/guidepup";
import fs from "node:fs/promises";
import path from "node:path";
import { pageUrl, evidenceRecord, PHRASES, delay } from "./at-helpers.js";

const scenarios = [
  { id: "native-disabled", describe: "Native disabled control announcement", focus: "#disabled-text", expect: PHRASES.disabled },
  { id: "aria-disabled", describe: "aria-disabled announcement and blocked activation", focus: "#aria-disabled-button", expect: PHRASES.disabled },
  { id: "readonly", describe: "readonly announcement", focus: "#readonly-id", expect: PHRASES.readOnly },
  { id: "radio-enabled", describe: "Enabled radio group legend, selected state, and position", focus: "#digest-weekly", expect: PHRASES.radioSelected },
  { id: "radio-option-disabled", describe: "Individually disabled radio option", focus: "#delivery-same-day", expect: PHRASES.disabled },
  { id: "radio-group-disabled", describe: "Entirely disabled radio group", focus: "#billing-monthly", expect: PHRASES.disabled },
  { id: "file-disabled", describe: "File input label, hint, and disabled state", focus: "#file-disabled", expect: PHRASES.disabled },
  { id: "date-disabled", describe: "Date input label and disabled state", focus: "#date-disabled", expect: PHRASES.disabled },
];

async function main() {
  if (process.platform !== "win32") {
    console.error("NVDA automation requires Windows. Skipping.");
    process.exit(process.platform === "win32" ? 0 : 0);
  }

  const browser = await chromium.launch({ headless: false });
  const records = [];
  try {
    await nvda.start();
    const page = await browser.newPage();
    await page.goto(pageUrl());
    await page.waitForLoadState("domcontentloaded");
    await page.bringToFront();

    for (const scenario of scenarios) {
      await page.locator(scenario.focus).focus();
      await delay(300);
      await nvda.clearSpokenPhraseLog();
      await page.locator(scenario.focus).focus();
      await delay(500);
      const captured = ((await nvda.lastSpokenPhrase()) || "").trim();
      const observed = scenario.expect.test(captured) ? "matched" : "no match";
      records.push(
        evidenceRecord({
          scenario: `${scenario.id}: ${scenario.describe}`,
          browser: "Chrome",
          browserVersion: browser.version(),
          screenReader: "NVDA",
          screenReaderVersion: "installed",
          capturedSpeech: captured,
          expected: String(scenario.expect),
          observed,
        }),
      );
      console.log(`${scenario.id}: ${observed} :: ${JSON.stringify(captured)}`);
    }
  } finally {
    try {
      await nvda.stop();
    } catch {
      // ignore
    }
    await browser.close();
  }

  const logDir = path.resolve("guidepup/logs");
  await fs.mkdir(logDir, { recursive: true });
  await fs.writeFile(
    path.join(logDir, "nvda-evidence.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), records }, null, 2) + "\n",
  );
  console.log("\nEvidence written to guidepup/logs/nvda-evidence.json");
}

await main();
