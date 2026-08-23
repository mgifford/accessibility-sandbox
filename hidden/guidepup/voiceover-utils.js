import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runAppleScript(script) {
  const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script]);
  return stdout.trim();
}

export async function isVoiceOverRunning() {
  try {
    return (await runAppleScript('tell application "VoiceOver" to running')) === "true";
  } catch {
    return false;
  }
}

export async function ensureVoiceOverIsOff() {
  if (await isVoiceOverRunning()) {
    await runAppleScript('tell application "VoiceOver" to quit');

    for (let attempt = 0; attempt < 20; attempt++) {
      if (!(await isVoiceOverRunning())) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(
      "VoiceOver was already running and the script could not turn it off automatically. Turn it off manually, then rerun the command from the same terminal app."
    );
  }
}

export async function moveNextWithFallback(voiceOver) {
  try {
    await voiceOver.next();
    return { method: "cursorMove" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isMoveRightFailure =
      message.includes("VoiceOver unable to move") &&
      (message.includes("doesn\u2019t understand the \u201cmove\u201d message") ||
        message.includes("doesn't understand the \"move\" message") ||
        message.includes("(-1708)"));

    if (!isMoveRightFailure) {
      throw error;
    }

    await voiceOver.perform(voiceOver.keyboardCommands.moveToNext);
    return { method: "keyboardMoveToNext", fallbackFrom: message };
  }
}

export async function activateLikelyBrowserApp() {
  const script = `
tell application "System Events"
  repeat with p in (application processes whose background only is false)
    set processName to name of p
    if processName contains "Playwright" or processName contains "MiniBrowser" or processName is "Safari" then
      set frontmost of p to true
      return processName
    end if
  end repeat
end tell
return ""
`;

  try {
    const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script]);
    return stdout.trim();
  } catch {
    return "";
  }
}