import { test, expect } from "@playwright/test";
import { voiceOver } from "@guidepup/guidepup";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { implementations, voiceOverNeedles } from "./scenarios.js";
import { activateLikelyBrowserApp, moveNextWithFallback } from "./voiceover-utils.js";

const defaultBaseURL = `${pathToFileURL(path.resolve("tests.html")).href}`;
const baseURL =
  process.env.HIDDEN_TEST_URL ||
  defaultBaseURL;
const selectedImplementations = (process.env.VOICEOVER_IMPLEMENTATIONS || implementations.join(","))
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
  .filter((item) => implementations.includes(item));
const voiceOverTraversalSteps = Number(process.env.VOICEOVER_TRAVERSAL_STEPS || "160");
const voiceOverTestTimeoutMs = Number(process.env.VOICEOVER_TEST_TIMEOUT_MS || "180000");
const voiceOverStepDelayMs = Number(process.env.VOICEOVER_STEP_DELAY_MS || "220");
const voiceOverStagnationLimit = Number(process.env.VOICEOVER_STAGNATION_LIMIT || "28");
const voiceOverRepeatPhraseLimit = Number(process.env.VOICEOVER_REPEAT_PHRASE_LIMIT || "10");
const voiceOverMinCheckpointMatches = Number(process.env.VOICEOVER_MIN_CHECKPOINT_MATCHES || "1");
const voiceOverRequireSpokenLog = process.env.VOICEOVER_REQUIRE_SPOKEN_LOG === "1";
const voiceOverProgressLog = process.env.VOICEOVER_PROGRESS_LOG !== "0";
const voiceOverHeadingProbeEvery = Number(process.env.VOICEOVER_HEADING_PROBE_EVERY || "18");
const voiceOverLinkProbeEvery = Number(process.env.VOICEOVER_LINK_PROBE_EVERY || "11");

test.describe.configure({ mode: "serial" });

function findFirstMatch(log, needle) {
  const lowerNeedle = needle.toLowerCase();
  return log.find((entry) => entry.toLowerCase().includes(lowerNeedle)) || null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCheckpointCoverage(log) {
  const checkpoints = voiceOverNeedles.map((checkpoint) => ({
    scenarioId: checkpoint.scenarioId,
    needle: checkpoint.needle,
    firstMatch: findFirstMatch(log, checkpoint.needle)
  }));

  return {
    checkpoints,
    matchedCount: checkpoints.filter((item) => item.firstMatch).length
  };
}

async function runNavigationStep(voiceOver, phase) {
  if (phase === "heading" && typeof voiceOver.nextHeading === "function") {
    await voiceOver.nextHeading();
    return { method: "nextHeading" };
  }

  if (phase === "link" && typeof voiceOver.nextLink === "function") {
    await voiceOver.nextLink();
    return { method: "nextLink" };
  }

  return moveNextWithFallback(voiceOver);
}

function getTraversalPhase(stepIndex) {
  // Mostly move sequentially through content; only probe headings/links periodically.
  if (voiceOverHeadingProbeEvery > 0 && stepIndex > 0 && stepIndex % voiceOverHeadingProbeEvery === 0) {
    return "heading";
  }

  if (voiceOverLinkProbeEvery > 0 && stepIndex > 0 && stepIndex % voiceOverLinkProbeEvery === 0) {
    return "link";
  }

  return "next";
}

for (const implementation of selectedImplementations) {
  test(`${implementation}: VoiceOver speech log`, async ({ page }) => {
    test.setTimeout(voiceOverTestTimeoutMs);

    await page.goto(`${baseURL}?implementation=${implementation}`);
    await page.waitForLoadState("domcontentloaded");
    await page.bringToFront();
    await page.locator("body").click();
    await activateLikelyBrowserApp();
    await voiceOver.start();
    try {
      if (typeof voiceOver.navigateToWebContent === "function") {
        await activateLikelyBrowserApp();
        await voiceOver.navigateToWebContent();
        await delay(voiceOverStepDelayMs);
      }

      if (voiceOver.keyboardCommands?.moveToBeginningOfText) {
        await voiceOver.perform(voiceOver.keyboardCommands.moveToBeginningOfText);
        await delay(voiceOverStepDelayMs);
      }

      const firstMove = await runNavigationStep(voiceOver, "next");
      const firstSpokenPhrase = await voiceOver.lastSpokenPhrase();
      await delay(voiceOverStepDelayMs);

      // Traverse with pacing and stop early when checkpoints are covered or progress stalls.
      const traversalMethods = [firstMove.method];
      let bestMatchedCount = 0;
      let stagnantSteps = 0;
      let repeatedPhraseCount = 0;
      let previousPhrase = (firstSpokenPhrase || "").trim();
      let traversalStopReason = "max_steps";

      for (let i = 0; i < voiceOverTraversalSteps; i++) {
        const phase = getTraversalPhase(i + 1);
        const move = await runNavigationStep(voiceOver, phase);
        traversalMethods.push(move.method);

        await delay(voiceOverStepDelayMs);

        const currentPhrase = ((await voiceOver.lastSpokenPhrase()) || "").trim();
        if (currentPhrase && currentPhrase === previousPhrase) {
          repeatedPhraseCount += 1;
        } else {
          repeatedPhraseCount = 0;
          previousPhrase = currentPhrase;
        }

        const spokenPhraseLogSnapshot = await voiceOver.spokenPhraseLog();
        const { matchedCount } = getCheckpointCoverage(spokenPhraseLogSnapshot);

        if (voiceOverProgressLog && (i % 12 === 0 || matchedCount > bestMatchedCount)) {
          console.log(
            `[voiceover][${implementation}] step=${i + 1} phase=${phase} matched=${matchedCount}/${voiceOverNeedles.length} phrase=${currentPhrase || "(none)"}`
          );
        }

        if (matchedCount > bestMatchedCount) {
          bestMatchedCount = matchedCount;
          stagnantSteps = 0;
        } else {
          stagnantSteps += 1;
        }

        if (matchedCount === voiceOverNeedles.length) {
          traversalStopReason = "all_checkpoints_matched";
          break;
        }

        if (stagnantSteps >= voiceOverStagnationLimit) {
          traversalStopReason = "checkpoint_stagnation";
          break;
        }

        if (repeatedPhraseCount >= voiceOverRepeatPhraseLimit) {
          traversalStopReason = "repeated_phrase";
          break;
        }
      }

      const spokenPhraseLog = await voiceOver.spokenPhraseLog();
      const itemTextLog = await voiceOver.itemTextLog();
      const { checkpoints: scenarioMatches, matchedCount } = getCheckpointCoverage(spokenPhraseLog);

      const output = {
        implementation,
        url: page.url(),
        traversalStopReason,
        repeatedPhraseCount,
        traversalMethods,
        firstSpokenPhrase,
        checkpoints: scenarioMatches,
        checkpointCoverage: {
          matched: matchedCount,
          total: scenarioMatches.length
        },
        spokenPhraseLog,
        itemTextLog
      };

      const logDir = path.resolve("guidepup/logs");
      await fs.mkdir(logDir, { recursive: true });
      await fs.writeFile(
        path.join(logDir, `voiceover-${implementation}.json`),
        JSON.stringify(output, null, 2) + "\n"
      );

      const markdown = [
        `# VoiceOver Log - ${implementation}`,
        "",
        `URL: ${output.url}`,
        `First phrase: ${firstSpokenPhrase || "(none)"}`,
        `Scenario checkpoints matched: ${matchedCount}/${scenarioMatches.length}`,
        "",
        "## Scenario checkpoint matches",
        "",
        ...scenarioMatches.map(
          (item) =>
            `- ${item.scenarioId}. needle='${item.needle}' -> ${item.firstMatch ? `'${item.firstMatch}'` : "NO MATCH"}`
        ),
        ""
      ];
      await fs.writeFile(
        path.join(logDir, `voiceover-${implementation}.md`),
        `${markdown.join("\n")}\n`
      );

      if (voiceOverRequireSpokenLog) {
        expect(spokenPhraseLog.length).toBeGreaterThan(0);
      }
      expect(matchedCount).toBeGreaterThanOrEqual(voiceOverMinCheckpointMatches);
    } finally {
      await voiceOver.stop();
    }
  });
}

test("VoiceOver cross-implementation differences report", async () => {
  test.setTimeout(voiceOverTestTimeoutMs);

  if (selectedImplementations.length !== implementations.length) {
    test.skip(true, "Skipping cross-implementation report for single-implementation run.");
  }

  const logDir = path.resolve("guidepup/logs");
  const data = [];
  const missingFiles = [];

  for (const implementation of implementations) {
    const filePath = path.join(logDir, `voiceover-${implementation}.json`);
    try {
      const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
      data.push(parsed);
    } catch {
      missingFiles.push(filePath);
    }
  }

  if (missingFiles.length > 0) {
    test.skip(
      true,
      `Skipping cross-implementation report because required logs are missing: ${missingFiles.join(", ")}`
    );
  }

  const lines = [
    "# VoiceOver Differences by Implementation",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Scenario | Drupal | A11Y Project | GOV.UK | Proposed |",
    "|---|---|---|---|---|"
  ];

  for (const checkpoint of voiceOverNeedles) {
    const row = [];
    for (const implementation of implementations) {
      const entry = data.find((item) => item.implementation === implementation);
      const match = entry.checkpoints.find((item) => item.scenarioId === checkpoint.scenarioId);
      row.push(match.firstMatch ? match.firstMatch.replace(/\|/g, "\\|") : "NO MATCH");
    }
    lines.push(`| ${checkpoint.scenarioId}. ${checkpoint.needle} | ${row.join(" | ")} |`);
  }

  await fs.writeFile(path.join(logDir, "voiceover-differences.md"), `${lines.join("\n")}\n`);

  expect(data).toHaveLength(4);
});
