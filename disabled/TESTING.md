# Testing disabled and inactive controls

Automated checks can confirm attributes, focusability, blocked events, colour values, and basic accessibility rules. They cannot decide whether disabling an action is understandable in context. That requires task-based testing with disabled people.

## Browser matrix

Run the deterministic tests in Chromium, Firefox, and WebKit:

```sh
npm run test:cross-browser
```

Manually spot-check the live page in at least Chrome, Firefox, and Safari, because
native control rendering (date/time pickers, file buttons, range tracks) differs.

## Keyboard procedures

Use each colour scheme and both Drupal treatments. Use only `Tab`, `Shift+Tab`,
`Enter`, `Space`, and the arrow keys.

1. Confirm enabled controls receive a visible focus indicator.
2. Confirm native disabled controls are skipped and cannot be activated.
3. Confirm the `aria-disabled` Publish button receives focus, is announced as disabled, and cannot activate.
4. Submit the validation example empty. Confirm focus moves to "There is a problem".
5. Confirm the readonly identifier is focusable and its value can be selected and copied.
6. **Radio arrow-key tests.** In the available "Digest frequency" group, Tab to the checked option, then use arrow keys to move the selection. Confirm one Tab enters the group and one Tab leaves it. In the "Delivery method" group, use arrow keys across the individually disabled "Same day" option and record whether the browser skips it or stops on it (browsers differ; the automated suite records this per browser rather than asserting one outcome). Confirm the disabled option can never become selected.
7. Toggle the dynamically disabled fieldset. Confirm focus stays on the controller and does not jump into the newly enabled fields.
8. Make the preferences region inert. Confirm its select and link leave the focus order and return when restored, and that focus stays on the toggle.

## Pointer procedures

1. Confirm disabled controls do not respond to clicks.
2. Confirm `cursor: not-allowed` appears on disabled controls as a supplemental cue only.
3. Confirm proposed disabled checkboxes and toggles do not gain a hover treatment.
4. Operate the file input and confirm the `::file-selector-button` is styled in both enabled and disabled states.

## File-input tests

- Confirm the explicit label, the persistent format-and-size hint, and the disabled example.
- Confirm the `multiple` example accepts more than one file.
- Confirm the input text and the `::file-selector-button` are both styled, and that the disabled button is visibly distinct.

## Date and time tests

- Confirm `date`, `time`, and `datetime-local` inputs use the **native** browser control (no scripted picker).
- Confirm each is a direct available / unavailable pair using the same field name, with an "Unavailable" badge and a visible reason on the disabled example.
- Confirm the disabled input differs from the enabled input in text, background, and border colour (not only the label), in both Drupal treatments.
- Confirm the state cue is on the label and field, not on the native calendar or clock icon; those icons are not hidden or restyled with browser-specific pseudo-elements.
- Note rendering differences between browsers; native pickers vary.

## Colour-distinction and reason tests

The deterministic suite asserts, for file/date/time/datetime/number, that the
disabled input differs from the enabled input in computed colour, and that each
disabled file/date/time control has an "Unavailable" badge and a visible reason
whose `aria-describedby` references both the reason and (for file) the format hint.
The reason stays at full readable contrast; only the ordinary help text is muted.

Native-control cards also have per-browser visual snapshots for the file and
date/time cards. These baselines are captured on the developer's operating system
and native-control rendering is OS-specific, so the snapshots are skipped on CI and
are for local cross-browser review. Regenerate them with:

```sh
npm run test:cross-browser -- --update-snapshots
```

Still check forced-colours mode manually in a real high-contrast environment as
well as through the automated emulation.

## Live-region tests

- Confirm the availability status container and the inert status container are present and empty from page load, and are never `hidden` or created during an update.
- Confirm each transition updates only the text content of the existing container.
- Confirm each transition produces exactly one message, in both directions.

## Form-data tests

- Submit the consequences form. Confirm the displayed data includes `enabled-text`, `readonly-text`, `enabled-check`, and `fd-choice`.
- Confirm it omits `disabled-text`, `disabled-check`, and the disabled fieldset's `fd-locked`.

## Visual pass

Test system, light, and dark modes at 100%, 200%, and 400% zoom.

Check that:

- every control remains visible and operable;
- enabled and disabled states are distinguishable without relying on colour alone where practical;
- disabled checked checkboxes and radios keep their checkmark or dot;
- labels, descriptions, and unavailability reasons appear to belong to the correct controls and stay readable (the reason is not dimmed to match the control surface);
- content reflows without horizontal page scrolling at 320 CSS pixels.

## Forced-colours testing

Enable a forced-colours (high-contrast) mode.

- Confirm native control affordances and state distinctions remain.
- Confirm the visual-treatment badges, reasons, and patterns stay perceivable.
- Confirm the inert overlay and the file button remain distinguishable.

The Playwright suite also emulates `forced-colors: active` for an axe pass, but
emulation is not a substitute for a real high-contrast environment.

## Screen-reader matrix

Run at least:

- NVDA with Firefox and Chrome on Windows;
- JAWS with Chrome or Edge on Windows;
- VoiceOver with Safari on macOS and iOS;
- TalkBack with Chrome on Android.

The `guidepup/` scenarios automate parts of this on VoiceOver (macOS) and NVDA
(Windows). For each combination, record whether native `disabled`,
`aria-disabled`, and `readonly` are announced; whether the reason referenced by
`aria-describedby` is announced; whether radio legend, selected state, and position
are announced; how an individually disabled option and an entirely disabled group
are described; and whether the dynamic and inert transitions are announced once in
each direction. Screen-reader terminology varies, so accept alternatives such as
"disabled", "dimmed", and "unavailable".

## Task-based testing with disabled people

Do not ask only whether participants notice that a control is disabled. Give them a task and observe:

- Can they determine what must change before the action becomes available?
- Do they discover the reason without assistance?
- Does a focusable but inoperable control clarify the interface or add frustration?
- Does keeping the action enabled with validation lead to faster recovery?
- Do disabled controls create a false impression that the task is impossible?

## Evidence limits

- Browser behaviour varies, including radio arrow-key navigation across a disabled option and native date/time and file rendering.
- Screen-reader terminology varies; one transcript must not be treated as the universal wording.
- Guidepup captures speech; it does not establish usability.
- Automated contrast measurements do not establish that two states are sufficiently distinguishable. They are diagnostics.
- The page reproduces selected Drupal tokens and selectors, not the complete Default Admin cascade.
- WCAG 2.2 exempts inactive controls from the contrast requirements in Success Criteria 1.4.3 and 1.4.11. The exemption is not a recommendation for low contrast, and comparisons of corresponding enabled and disabled colours are state-difference research, not a pass or fail result.
- The experiment does not support the rejected diagonal-strike treatment from issue #3617875.
- A result from one assistive-technology combination must not be generalised to all combinations.
- Passing axe does not validate the product decision to disable a control.
