#!/usr/bin/env node
// Standalone VoiceOver boundary-speech capture.
//
// IMPORTANT: This does NOT run under @playwright/test. The Playwright test runner
// launches WebKit as a background process that does not surface a frontable GUI
// window, so AppleScript cannot bring it forward and the VoiceOver cursor never
// enters the page's web content. A direct webkit.launch() from a plain Node
// script DOES surface a "Playwright" GUI process that can be fronted, which is
// what VoiceOver automation requires. See guidepup/logs/at-findings.md.
//
// This captures what VoiceOver actually speaks for the boundary link ("Place
// block" + hidden "in the Header region") on current Drupal (no generated
// spaces) versus proposed (with \00a0), and records whether they differ.
//
// Run: npm run test:boundary-speech
// Requires a configured VoiceOver session (see GUIDEPUP_SETUP.md).

import { webkit } from "playwright";
import { voiceOver } from "@guidepup/guidepup";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureVoiceOverIsOff, activateLikelyBrowserApp } from "./voiceover-utils.js";
import { variantUrl, ensureInWebContent, findLinkPhrase } from "./at-helpers.js";

const boundaryVariants = [
  { file: "drupal-current.html", label: "current (no generated spaces)" },
  { file: "proposed-sfnsp-focuswithin.html", label: "proposed (generated \\00a0 spaces)" },
];

// A fresh browser per variant: the VoiceOver cursor and window fronting are far
// more reliable against a newly launched WebKit window than a second page reused
// in the same browser after a VoiceOver stop/start cycle.
async function captureBoundary(file) {
  await ensureVoiceOverIsOff();
  const browser = await webkit.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(variantUrl(file));
    await page.waitForLoadState("domcontentloaded");
    await voiceOver.start();
    try {
      await ensureInWebContent(
        voiceOver,
        page,
        activateLikelyBrowserApp,
        /skip-link variant|drupal|proposed/i
      );
      return await findLinkPhrase(voiceOver, (p) => /place block/i.test(p), { max: 12 });
    } finally {
      await voiceOver.stop();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const captured = [];
  for (const { file, label } of boundaryVariants) {
    const boundaryPhrase = await captureBoundary(file);
    captured.push({ file, label, boundaryPhrase });
    console.log(`${label}: ${JSON.stringify(boundaryPhrase)}`);
  }

  const normalized = captured.map((c) =>
    (c.boundaryPhrase || "").toLowerCase().replace(/\s+/g, " ").replace(/\blink\b/g, "").trim()
  );
  const allSpokeBoundary = captured.every(
    (c) =>
      c.boundaryPhrase &&
      /place block/i.test(c.boundaryPhrase) &&
      /header region/i.test(c.boundaryPhrase)
  );
  const identical = normalized.every((p) => p === normalized[0]) && normalized[0] !== "";

  const report = {
    generatedAt: new Date().toISOString(),
    platform: process.platform,
    claim: "Generated ::before/::after \\00a0 spaces change VoiceOver boundary output",
    captured,
    allImplementationsSpokeBoundary: allSpokeBoundary,
    voiceOverBoundaryIdentical: identical,
    interpretation: !allSpokeBoundary
      ? "Capture incomplete; at least one variant did not yield a boundary phrase. Re-run with VoiceOver configured."
      : identical
        ? "No VoiceOver-observable difference between current and proposed on this platform. The generated-space mitigation is a no-op for VoiceOver here; verify against other screen readers (JAWS, NVDA) before claiming a benefit."
        : "VoiceOver output differed between current and proposed; inspect captured phrases.",
  };

  const logDir = path.resolve("guidepup/logs");
  await fs.mkdir(logDir, { recursive: true });
  await fs.writeFile(
    path.join(logDir, "boundary-speech.json"),
    JSON.stringify(report, null, 2) + "\n"
  );

  console.log(`\nBoundary identical across current/proposed: ${identical}`);
  console.log(`Evidence written to guidepup/logs/boundary-speech.json`);

  if (!allSpokeBoundary) {
    process.exitCode = 1;
  }
}

await main();
