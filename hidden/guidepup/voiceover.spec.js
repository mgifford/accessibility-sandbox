import { test, expect } from "@playwright/test";
import { voiceOver } from "@guidepup/guidepup";
import fs from "node:fs/promises";
import path from "node:path";

const implementations = ["drupal", "a11yproject", "govuk", "proposed"];
const baseURL =
  process.env.HIDDEN_TEST_URL ||
  "https://mgifford.github.io/accessibility-sandbox/hidden/tests.html";

for (const implementation of implementations) {
  test(`${implementation}: VoiceOver speech log`, async ({ page }) => {
    await page.goto(`${baseURL}?implementation=${implementation}`);
    await voiceOver.start();
    try {
      await voiceOver.next();
      const firstSpokenPhrase = await voiceOver.lastSpokenPhrase();

      for (let i = 0; i < 45; i++) {
        await voiceOver.next();
      }

      const spokenPhraseLog = await voiceOver.spokenPhraseLog();
      const output = {
        implementation,
        url: page.url(),
        firstSpokenPhrase,
        spokenPhraseLog
      };

      const logDir = path.resolve("guidepup/logs");
      await fs.mkdir(logDir, { recursive: true });
      await fs.writeFile(
        path.join(logDir, `voiceover-${implementation}.json`),
        JSON.stringify(output, null, 2) + "\n"
      );

      expect(spokenPhraseLog.length).toBeGreaterThan(0);
    } finally {
      await voiceOver.stop();
    }
  });
}
