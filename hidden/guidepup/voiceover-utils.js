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