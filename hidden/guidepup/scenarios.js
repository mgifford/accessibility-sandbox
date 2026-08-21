export const implementations = ["drupal", "a11yproject", "govuk", "proposed"];

export const scenarios = [
  {
    id: 1,
    title: "Keyboard-only: skip link",
    type: "automated",
    description: "First Tab focuses skip link and reveals it visually."
  },
  {
    id: 2,
    title: "Visible text followed by hidden text",
    type: "automated",
    description: "Link name keeps phrase boundary for trailing hidden text."
  },
  {
    id: 3,
    title: "Hidden text followed by visible text",
    type: "automated",
    description: "Link name keeps phrase boundary for leading hidden text."
  },
  {
    id: 4,
    title: "Heading navigation",
    type: "manual-assistive-tech",
    description: "VoiceOver rotor heading navigation and spoken phrase quality."
  },
  {
    id: 5,
    title: "Different HTML contexts",
    type: "automated",
    description: "Hidden text contributes context in button, legend, summary and table."
  },
  {
    id: 6,
    title: "Direct focus versus focus-within",
    type: "automated",
    description: "Hidden wrapper reveals when descendant receives focus."
  },
  {
    id: 7,
    title: "Long hidden text",
    type: "automated",
    description: "Long hidden text remains no-wrap and part of control name."
  },
  {
    id: 8,
    title: "Text selection",
    type: "manual-plus-automated",
    description: "Selection/copy behavior differs when hidden text is selectable."
  },
  {
    id: 9,
    title: "High zoom and magnification",
    type: "manual-visual",
    description: "400% zoom and magnifier tracking require manual visual verification."
  }
];

export const voiceOverNeedles = [
  { scenarioId: 1, needle: "Keyboard-only: skip link" },
  { scenarioId: 2, needle: "Place block" },
  { scenarioId: 3, needle: "all content" },
  { scenarioId: 4, needle: "Heading navigation" },
  { scenarioId: 5, needle: "Different HTML contexts" },
  { scenarioId: 6, needle: "Direct focus versus focus-within" },
  { scenarioId: 7, needle: "Continue" },
  { scenarioId: 8, needle: "Text selection" },
  { scenarioId: 9, needle: "High zoom and magnification" }
];