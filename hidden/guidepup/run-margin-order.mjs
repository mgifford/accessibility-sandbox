#!/usr/bin/env node
// Standalone VoiceOver probe for the negative-margin announcement-order claim.
//
// GOV.UK's visually-hidden stylesheet keeps `margin: 0` with the note that a
// negative margin can cause text to be announced in the wrong order in VoiceOver
// on macOS (comment added 2019). This captures VoiceOver's spoken output for a
// link whose visually hidden middle span has margin: 0 versus a negative margin,
// to check whether the order actually differs on this platform.
//
// Like run-boundary-speech.mjs, this is a standalone runner (NOT @playwright/test)
// because VoiceOver automation needs a frontable browser window. It launches a
// fresh browser per condition and verifies the VoiceOver cursor reached web
// content before trusting a phrase. Requires a configured VoiceOver session and
// Full Disk Access for the controlling app (see GUIDEPUP_SETUP.md).
//
// Run: npm run test:margin-order

import { webkit } from "playwright";
import { voiceOver } from "@guidepup/guidepup";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureVoiceOverIsOff, activateLikelyBrowserApp } from "./voiceover-utils.js";
import { ensureInWebContent, findLinkPhrase } from "./at-helpers.js";

// The expected spoken order is: "Start here" -> hidden "then read this hidden
// middle part" -> "and finish here". The link text carries all three in DOM
// order; the question is whether VoiceOver announces the hidden middle span in
// its correct position or displaces it.
const HIDDEN_STYLE_BASE =
  "position:absolute!important;width:1px!important;height:1px!important;" +
  "overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important;";

function pageHtml(margin) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<title>margin-order ${margin} skip-link variant</title>` +
    `<style>.vh{${HIDDEN_STYLE_BASE}margin:${margin}!important;}</style></head>` +
    `<body><a href="#t">Start here<span class="vh"> then read this hidden middle part</span> and finish here</a>` +
    `<p id="t">end</p></body></html>`;
}

const conditions = [
  { id: "margin-0", label: "margin: 0 (proposed / GOV.UK reset)", margin: "0" },
  { id: "margin-negative", label: "margin: -10px (bug condition)", margin: "-10px" },
];

async function captureOrder(tmpFile) {
  await ensureVoiceOverIsOff();
  const browser = await webkit.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${tmpFile}`);
    await page.waitForLoadState("domcontentloaded");
    await voiceOver.start();
    try {
      await ensureInWebContent(
        voiceOver,
        page,
        activateLikelyBrowserApp,
        /skip-link variant|start here|margin-order/i
      );
      return await findLinkPhrase(voiceOver, (p) => /start here/i.test(p), { max: 12 });
    } finally {
      await voiceOver.stop();
    }
  } finally {
    await browser.close();
  }
}

// Does the spoken phrase preserve DOM order: "start here" ... "middle part" ... "finish here"?
function orderPreserved(phrase) {
  if (!phrase) return null;
  const lower = phrase.toLowerCase();
  const a = lower.indexOf("start here");
  const b = lower.indexOf("middle part");
  const c = lower.indexOf("finish here");
  if (a < 0 || b < 0 || c < 0) return null;
  return a < b && b < c;
}

async function main() {
  const tmpDir = path.resolve("guidepup/logs");
  await fs.mkdir(tmpDir, { recursive: true });

  const captured = [];
  for (const { id, label, margin } of conditions) {
    const tmpFile = path.join(tmpDir, `_margin-order-${id}.html`);
    await fs.writeFile(tmpFile, pageHtml(margin));
    try {
      const phrase = await captureOrder(tmpFile);
      captured.push({ id, label, margin, phrase, orderPreserved: orderPreserved(phrase) });
      console.log(`${label}: ${JSON.stringify(phrase)} -> orderPreserved=${orderPreserved(phrase)}`);
    } finally {
      await fs.rm(tmpFile, { force: true });
    }
  }

  const zero = captured.find((c) => c.id === "margin-0");
  const negative = captured.find((c) => c.id === "margin-negative");
  const reproduced =
    zero?.orderPreserved === true && negative?.orderPreserved === false;

  const report = {
    generatedAt: new Date().toISOString(),
    platform: process.platform,
    claim: "A negative margin causes VoiceOver (macOS) to announce visually hidden text in the wrong order; margin:0 prevents it",
    captured,
    negativeMarginBugReproduced: reproduced,
    interpretation: reproduced
      ? "Reproduced: margin:0 preserved order, a negative margin displaced the hidden text. The margin:0 reset is load-bearing on this platform."
      : "Not reproduced on this platform/version: order was the same with margin:0 and a negative margin. The margin:0 reset may be defensive against older versions, or the bug is browser/version-specific.",
  };
  await fs.writeFile(
    path.join(tmpDir, "margin-order.json"),
    JSON.stringify(report, null, 2) + "\n"
  );
  console.log(`\nNegative-margin bug reproduced: ${reproduced}`);
  console.log("Evidence written to guidepup/logs/margin-order.json");
}

await main();
