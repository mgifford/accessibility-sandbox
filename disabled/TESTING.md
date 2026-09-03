# Testing disabled and inactive controls

Automated checks can confirm attributes, focusability, blocked events, colour values, and basic accessibility rules. They cannot decide whether disabling an action is understandable in context. That requires task-based testing with disabled people.

## Keyboard pass

Use each colour scheme and both Drupal treatments.

1. Reload the page and use only `Tab`, `Shift+Tab`, `Enter`, and `Space`.
2. Confirm enabled controls receive a visible focus indicator.
3. Confirm native disabled controls are skipped and cannot be activated.
4. Confirm the `aria-disabled` Publish button receives focus, is announced as disabled, and cannot activate.
5. Submit the validation example empty. Confirm focus moves to “There is a problem” and the error links to the email field.
6. Confirm the readonly identifier is focusable and its value can be selected and copied.
7. Make the preferences region inert. Confirm its select and link leave the focus order. Restore it and confirm both return.

## Visual pass

Test system, light, and dark modes at 100%, 200%, and 400% zoom.

Check that:

- every control remains visible;
- enabled and disabled states are distinguishable without relying on colour alone where practical;
- labels and descriptions appear to belong to the correct controls;
- disabled checkboxes do not gain an enabled hover treatment;
- the disabled toggle label changes with the proposal;
- content reflows without horizontal page scrolling at 320 CSS pixels;
- forced-colour mode retains native control affordances and state distinctions;
- the inert region is visibly obscured and the loading explanation remains visible.

The ratios shown on the page are diagnostic. WCAG 2.2 exempts inactive controls from the contrast requirements in Success Criteria 1.4.3 and 1.4.11. Record whether people can perceive the controls and distinguish the states instead of reporting an inactive-control contrast failure.

## Screen-reader matrix

Run at least:

- NVDA with Firefox and Chrome on Windows;
- JAWS with Chrome or Edge on Windows;
- VoiceOver with Safari on macOS and iOS;
- TalkBack with Chrome on Android.

For each, record:

- whether native `disabled`, `aria-disabled`, and `readonly` are announced;
- whether the reason referenced by `aria-describedby` is announced;
- whether the native disabled control can be found in browse or virtual navigation even though it is absent from the Tab order;
- whether the `aria-disabled` control remains in the Tab order and every activation path is blocked;
- whether the error summary and linked error are understandable;
- whether content in the inert region disappears from accessibility navigation and returns when restored.

## Usability questions

Do not ask only whether participants notice that a control is disabled. Give them a task and observe:

- Can they determine what must change before the action becomes available?
- Do they discover the reason without assistance?
- Does a focusable but inoperable control clarify the interface or add frustration?
- Does keeping the action enabled with validation lead to faster recovery?
- Do disabled controls create a false impression that the task is impossible?

## Evidence limits

- The page reproduces selected Drupal tokens and selectors, not the entire Default Admin cascade.
- Browser and automated accessibility-tree results must be labelled with browser, operating system, screen reader, and version.
- A result from one assistive-technology combination must not be generalized to all combinations.
- Passing axe does not validate the product decision to disable a control.
- The experiment does not support the rejected diagonal-strike treatment from issue #3617875.
