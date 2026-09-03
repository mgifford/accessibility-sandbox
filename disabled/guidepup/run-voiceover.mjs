#!/usr/bin/env node
// Standalone VoiceOver scenarios for the disabled-controls experiment.
//
// NOT a @playwright/test file: VoiceOver needs a frontable browser window, which
// the Playwright test runner does not provide. This launches WebKit directly,
// verifies the VoiceOver cursor reached web content, then runs targeted scenarios
// and records raw speech as evidence.
//
// Requires a configured VoiceOver session (Accessibility, Automation, Full Disk
// Access, and "Allow VoiceOver to be controlled with AppleScript"). Run:
//   npm run test:voiceover
// Diagnose readiness first with:
//   npm run test:voiceover:diagnose
//
// Terminology varies between screen readers, so scenarios match a set of accepted
// phrases rather than one exact transcript.

import { webkit } from "playwright";
import { voiceOver } from "@guidepup/guidepup";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureVoiceOverIsOff, activateLikelyBrowserApp } from "./voiceover-utils.js";
import { pageUrl, ensureInWebContent, findPhrase, evidenceRecord, PHRASES, delay } from "./at-helpers.js";

// Each scenario: focus a control by DOM, then read what VoiceOver speaks for it.
// We drive focus with Playwright and read voiceOver.lastSpokenPhrase(), clearing
// the speech log immediately before the action under test.
const scenarios = [
  {
    id: "native-disabled",
    describe: "Native disabled control announcement",
    focus: "#disabled-text",
    expect: PHRASES.disabled,
  },
  {
    id: "aria-disabled",
    describe: "aria-disabled announcement and blocked activation",
    focus: "#aria-disabled-button",
    expect: PHRASES.disabled,
    thenPressEnter: true,
  },
  {
    id: "readonly",
    describe: "readonly announcement",
    focus: "#readonly-id",
    expect: PHRASES.readOnly,
  },
  {
    id: "radio-enabled",
    describe: "Enabled radio group legend, selected state, and position",
    focus: "#digest-weekly",
    expect: PHRASES.radioSelected,
  },
  {
    id: "radio-option-disabled",
    describe: "Individually disabled radio option",
    focus: "#delivery-same-day",
    expect: PHRASES.disabled,
  },
  {
    id: "radio-group-disabled",
    describe: "Entirely disabled radio group",
    focus: "#billing-monthly",
    expect: PHRASES.disabled,
  },
  {
    id: "file-disabled",
    describe: "File input label, hint, and disabled state",
    focus: "#file-disabled",
    expect: PHRASES.disabled,
  },
  {
    id: "date-disabled",
    describe: "Date input label and disabled state",
    focus: "#date-disabled",
    expect: PHRASES.disabled,
  },
];

async function browserVersion(browser) {
  try {
    return browser.version();
  } catch {
    return "unknown";
  }
}

async function readControl(browser, scenario) {
  await ensureVoiceOverIsOff();
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await page2.goto(pageUrl());
  await page2.waitForLoadState("domcontentloaded");
  await voiceOver.start();
  let captured = null;
  try {
    await ensureInWebContent(
      voiceOver,
      page2,
      activateLikelyBrowserApp,
      /disabled and inactive controls|appearance settings/i,
    );
    // Move the DOM focus to the control; VoiceOver follows focus.
    await page2.locator(scenario.focus).focus();
    await delay(400);
    await voiceOver.clearSpokenPhraseLog();
    await page2.locator(scenario.focus).focus();
    await delay(500);
    captured = ((await voiceOver.lastSpokenPhrase()) || "").trim();
    if (!captured) {
      // Fall back to walking to it.
      captured = await findPhrase(voiceOver, scenario.expect, { max: 40 });
    }
    if (scenario.thenPressEnter) {
      await voiceOver.clearSpokenPhraseLog();
      await page2.locator(scenario.focus).press("Enter");
      await delay(400);
    }
  } finally {
    await voiceOver.stop();
    await context.close();
  }
  return captured;
}

// Transition scenarios use spokenPhraseLog() to capture a sequence, clearing the
// log immediately before the action under test.
async function readTransition(browser, { id, describe, run, expect }) {
  await ensureVoiceOverIsOff();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(pageUrl());
  await page.waitForLoadState("domcontentloaded");
  await voiceOver.start();
  let log = [];
  try {
    await ensureInWebContent(
      voiceOver,
      page,
      activateLikelyBrowserApp,
      /disabled and inactive controls|appearance settings/i,
    );
    await voiceOver.clearSpokenPhraseLog();
    await run(page);
    await delay(900);
    log = await voiceOver.spokenPhraseLog();
  } finally {
    await voiceOver.stop();
    await context.close();
  }
  return log.join(" | ");
}

const transitions = [
  {
    id: "dynamic-unavailable",
    describe: "Dynamic unavailable announcement",
    expect: /unavailable/i,
    run: async (page) => {
      await page.locator("#attachments-toggle").check();
      await page.locator("#attachments-toggle").uncheck();
    },
  },
  {
    id: "dynamic-available",
    describe: "Dynamic available announcement",
    expect: /available/i,
    run: async (page) => {
      await page.locator("#attachments-toggle").check();
    },
  },
  {
    id: "inert-unavailable",
    describe: "Inert content disappearing (unavailable announcement)",
    expect: /unavailable/i,
    run: async (page) => {
      await page.locator("#inert-toggle").click();
    },
  },
  {
    id: "inert-available",
    describe: "Inert content returning (available announcement)",
    expect: /available/i,
    run: async (page) => {
      await page.locator("#inert-toggle").click();
      await delay(600);
      await page.locator("#inert-toggle").click();
    },
  },
];

async function main() {
  await ensureVoiceOverIsOff();
  const browser = await webkit.launch({ headless: false });
  const version = await browserVersion(browser);
  const records = [];
  try {
    for (const scenario of scenarios) {
      let captured = "";
      let error = null;
      try {
        captured = (await readControl(browser, scenario)) || "";
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
      const observed = error
        ? `error: ${error}`
        : scenario.expect.test(captured || "")
          ? "matched"
          : "no match";
      records.push(
        evidenceRecord({
          scenario: `${scenario.id}: ${scenario.describe}`,
          browser: "WebKit",
          browserVersion: version,
          screenReader: "VoiceOver",
          screenReaderVersion: "macOS built-in",
          capturedSpeech: captured,
          expected: String(scenario.expect),
          observed,
        }),
      );
      console.log(`${scenario.id}: ${observed} :: ${JSON.stringify(captured)}`);
    }

    for (const transition of transitions) {
      let captured = "";
      let error = null;
      try {
        captured = (await readTransition(browser, transition)) || "";
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
      const observed = error
        ? `error: ${error}`
        : transition.expect.test(captured || "")
          ? "matched"
          : "no match";
      records.push(
        evidenceRecord({
          scenario: `${transition.id}: ${transition.describe}`,
          browser: "WebKit",
          browserVersion: version,
          screenReader: "VoiceOver",
          screenReaderVersion: "macOS built-in",
          capturedSpeech: captured,
          expected: String(transition.expect),
          observed,
        }),
      );
      console.log(`${transition.id}: ${observed} :: ${JSON.stringify(captured)}`);
    }
  } finally {
    await browser.close();
  }

  const logDir = path.resolve("guidepup/logs");
  await fs.mkdir(logDir, { recursive: true });
  await fs.writeFile(
    path.join(logDir, "voiceover-evidence.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), records }, null, 2) + "\n",
  );
  console.log(`\nEvidence written to guidepup/logs/voiceover-evidence.json`);
}

await main();
