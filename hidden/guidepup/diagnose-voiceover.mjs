import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { voiceOver } from "@guidepup/guidepup";

const execFileAsync = promisify(execFile);

async function runAppleScript(script) {
  const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script]);
  return stdout.trim();
}

async function main() {
  const result = {
    platform: process.platform,
    nodeVersion: process.version,
    checks: {
      voiceOverActivate: { ok: false, output: "" },
      voiceOverRunning: { ok: false, output: "" },
      systemEventsUiElementsEnabled: { ok: false, output: "" },
      guidepupStart: { ok: false, output: "" },
      guidepupMoveNext: { ok: false, output: "" },
      guidepupMoveNextFallback: { ok: false, output: "" },
      guidepupLastPhrase: { ok: false, output: "" }
    },
    diagnosis: []
  };

  if (process.platform !== "darwin") {
    result.diagnosis.push("Guidepup VoiceOver automation requires macOS.");
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  try {
    await runAppleScript('tell application "VoiceOver" to activate');
    result.checks.voiceOverActivate = { ok: true, output: "activated" };
  } catch (error) {
    result.checks.voiceOverActivate = {
      ok: false,
      output: error instanceof Error ? error.message : String(error)
    };
  }

  try {
    const running = await runAppleScript('tell application "VoiceOver" to running');
    result.checks.voiceOverRunning = { ok: true, output: running };
  } catch (error) {
    result.checks.voiceOverRunning = {
      ok: false,
      output: error instanceof Error ? error.message : String(error)
    };
  }

  try {
    const enabled = await runAppleScript('tell application "System Events" to UI elements enabled');
    result.checks.systemEventsUiElementsEnabled = { ok: true, output: enabled };
  } catch (error) {
    result.checks.systemEventsUiElementsEnabled = {
      ok: false,
      output: error instanceof Error ? error.message : String(error)
    };
  }

  try {
    await voiceOver.start();
    result.checks.guidepupStart = { ok: true, output: "started" };

    try {
      await voiceOver.next();
      result.checks.guidepupMoveNext = { ok: true, output: "move next succeeded" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.checks.guidepupMoveNext = { ok: false, output: message };

      await voiceOver.perform(voiceOver.keyboardCommands.moveToNext);
      result.checks.guidepupMoveNextFallback = {
        ok: true,
        output: "keyboardCommands.moveToNext succeeded"
      };
    }

    const phrase = await voiceOver.lastSpokenPhrase();
    result.checks.guidepupLastPhrase = {
      ok: !!phrase,
      output: phrase || "(no phrase returned)"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!result.checks.guidepupStart.ok) {
      result.checks.guidepupStart = { ok: false, output: message };
    } else {
      result.checks.guidepupMoveNext = { ok: false, output: message };
    }
  } finally {
    try {
      await voiceOver.stop();
    } catch {
      // ignore
    }
  }

  if (!result.checks.voiceOverActivate.ok || !result.checks.systemEventsUiElementsEnabled.ok) {
    result.diagnosis.push("Automation permissions are not fully available from this session.");
  }

  if (result.checks.voiceOverActivate.ok && result.checks.systemEventsUiElementsEnabled.ok && !result.checks.guidepupMoveNext.ok) {
    result.diagnosis.push(
      "VoiceOver is reachable by AppleScript, but Guidepup navigation command failed. This is usually a Guidepup/VoiceOver compatibility issue for this macOS version or an incomplete manual VoiceOver setup."
    );
  }

  if (result.checks.guidepupMoveNext.ok && !result.checks.guidepupLastPhrase.ok) {
    result.diagnosis.push("Guidepup can move, but no spoken phrase was captured yet.");
  }

  if (!result.checks.guidepupMoveNext.ok && result.checks.guidepupMoveNextFallback.ok) {
    result.diagnosis.push(
      "Cursor move API failed but keyboard move command succeeded. Use keyboardCommands.moveToNext fallback in this environment."
    );
  }

  if (result.checks.guidepupMoveNextFallback.ok && !result.checks.guidepupLastPhrase.ok) {
    result.diagnosis.push(
      "Fallback move succeeded; no phrase capture can still happen in preflight contexts and is non-blocking if main voiceover traversal tests pass."
    );
  }

  if (result.diagnosis.length === 0) {
    result.diagnosis.push("No immediate blockers detected.");
  }

  console.log(JSON.stringify(result, null, 2));

  const criticalChecks = [
    result.checks.voiceOverActivate,
    result.checks.systemEventsUiElementsEnabled,
    result.checks.guidepupStart
  ];
  const movementSucceeded = result.checks.guidepupMoveNext.ok || result.checks.guidepupMoveNextFallback.ok;
  const hasFailure = criticalChecks.some((check) => !check.ok) || !movementSucceeded;
  process.exit(hasFailure ? 1 : 0);
}

await main();