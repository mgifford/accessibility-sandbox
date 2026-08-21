# Manual Scenario Summary (2 Items)

This summary covers the two scenarios that remain manual in this repo's matrix.

Test page variants:

- `tests.html?implementation=drupal`
- `tests.html?implementation=a11yproject`
- `tests.html?implementation=govuk`
- `tests.html?implementation=proposed`

## Scenario 4: Heading navigation (VoiceOver quality)

### What to do

1. Open one implementation URL.
2. Use VoiceOver heading navigation (rotor or heading commands).
3. Navigate to heading: `Account settings`.
4. Repeat for all 4 implementations.

### What to judge

- Is heading text announced as a natural phrase?
- Are there awkward pauses or boundary glitches between visible and hidden words?
- Is heading level announced consistently?
- Are repeated passes stable (no random variation)?

### Pass criteria

- Phrase is understandable and consistently announced.
- No obvious boundary artifact that changes meaning.

## Scenario 9: High zoom and magnification

### What to do

1. Set browser zoom to 400%.
2. Reload each implementation URL.
3. Start keyboard navigation from the top.
4. Track focused items visually while tabbing through interactive controls.

### What to judge

- Focused/revealed hidden content is visually discoverable.
- Revealed content is not clipped to 1px artifacts.
- Context remains understandable around focused controls.
- Horizontal/vertical panning burden is reasonable.

### Pass criteria

- Focus target can be found quickly at 400%.
- Revealed content is readable and does not collapse visually.

## Suggested capture format

Use this per implementation:

- Implementation:
- Scenario 4 verdict: pass / concern
- Scenario 4 notes:
- Scenario 9 verdict: pass / concern
- Scenario 9 notes:

## About "Place block", "all content", "Continue"

These strings are stress-test fixtures used to expose phrase-boundary behavior, not recommended final UX copy.