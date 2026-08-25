# Visually Hidden Implementation Matrix Report

Generated: (reference capture)
Base URL: file:///Users/mgifford/accessibility-sandbox/hidden/tests.html

## Scope

- 4 implementations x 9 scenarios (CSS and, for proposed, skip-target markup)
- Status keys: pass, fail, manual

## Scenario Types

- 1. Keyboard-only: skip link (automated) - First Tab focuses skip link and reveals it visually.
- 2. Visible text followed by hidden text (automated) - Link name keeps phrase boundary for trailing hidden text.
- 3. Hidden text followed by visible text (automated) - Link name keeps phrase boundary for leading hidden text.
- 4. Heading navigation (manual-assistive-tech) - VoiceOver rotor heading navigation and spoken phrase quality.
- 5. Different HTML contexts (automated) - Hidden text contributes context in button, legend, summary and table.
- 6. Direct focus versus focus-within (automated) - Hidden wrapper reveals when descendant receives focus.
- 7. Long hidden text (automated) - Long hidden text remains no-wrap and part of control name.
- 8. Text selection (manual-plus-automated) - Selection/copy behavior differs when hidden text is selectable.
- 9. High zoom and magnification (manual-visual) - 400% zoom and magnifier tracking require manual visual verification.

## Ranking

| Rank | Implementation | Automated Pass | Automated Fail | Manual |
|---|---|---:|---:|---:|
| 1 | proposed | 7 | 0 | 2 |
| 2 | drupal | 6 | 1 | 2 |
| 3 | a11yproject | 6 | 1 | 2 |
| 4 | govuk | 5 | 2 | 2 |

## Case Consistency

Cases identical across all implementations: 6/9

| Scenario | drupal | a11yproject | govuk | proposed | Same? |
|---|---|---|---|---|---|
| 1 | pass | pass | fail | pass | no |
| 2 | pass | pass | pass | pass | yes |
| 3 | pass | pass | pass | pass | yes |
| 4 | manual | manual | manual | manual | yes |
| 5 | pass | pass | pass | pass | yes |
| 6 | pass | fail | fail | pass | no |
| 7 | fail | pass | pass | pass | no |
| 8 | pass | pass | pass | pass | yes |
| 9 | manual | manual | manual | manual | yes |

## Scenario Matrix

| Implementation | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| drupal | pass | pass | pass | manual | pass | pass | fail | pass | manual |
| a11yproject | pass | pass | pass | manual | pass | fail | pass | pass | manual |
| govuk | fail | pass | pass | manual | pass | fail | pass | pass | manual |
| proposed | pass | pass | pass | manual | pass | pass | pass | pass | manual |

## Per-implementation Details

### drupal
- Automated pass/fail: 6/1
- 1. pass - focusReveal=true, keyboardTabFocused=false, width=186.77, height=48.84
- 2. pass - linkText='Place block in the Header region'
- 3. pass - linkText='Search all content'
- 4. manual - Requires VoiceOver rotor/heading navigation review for spoken boundary quality.
- 5. pass - button='Save draft', legend='Delivery address', summary='More information', table='Standard subscription'
- 6. pass - wrapperWidth=1184.00, wrapperHeight=116.00
- 7. fail - button='Continue to the next step where you will review all configuration choices before saving the form', hiddenWhiteSpace='normal'
- 8. pass - selection user-select on hidden phrase='auto' (manual clipboard behavior still required).
- 9. manual - Needs manual 400% zoom and magnification visual tracking.

### a11yproject
- Automated pass/fail: 6/1
- 1. pass - focusReveal=true, keyboardTabFocused=false, width=186.77, height=48.84
- 2. pass - linkText='Place block in the Header region'
- 3. pass - linkText='Search all content'
- 4. manual - Requires VoiceOver rotor/heading navigation review for spoken boundary quality.
- 5. pass - button='Save draft', legend='Delivery address', summary='More information', table='Standard subscription'
- 6. fail - wrapperWidth=36.00, wrapperHeight=36.00
- 7. pass - button='Continue to the next step where you will review all configuration choices before saving the form', hiddenWhiteSpace='nowrap'
- 8. pass - selection user-select on hidden phrase='auto' (manual clipboard behavior still required).
- 9. manual - Needs manual 400% zoom and magnification visual tracking.

### govuk
- Automated pass/fail: 5/2
- 1. fail - focusReveal=false, keyboardTabFocused=false, width=1.00, height=1.00
- 2. pass - linkText='Place block in the Header region'
- 3. pass - linkText='Search all content'
- 4. manual - Requires VoiceOver rotor/heading navigation review for spoken boundary quality.
- 5. pass - button='Save draft', legend='Delivery address', summary='More information', table='Standard subscription'
- 6. fail - wrapperWidth=1.00, wrapperHeight=1.00
- 7. pass - button='Continue to the next step where you will review all configuration choices before saving the form', hiddenWhiteSpace='nowrap'
- 8. pass - selection user-select on hidden phrase='auto' (manual clipboard behavior still required).
- 9. manual - Needs manual 400% zoom and magnification visual tracking.

### proposed
- Automated pass/fail: 7/0
- 1. pass - focusReveal=true, keyboardTabFocused=false, width=186.77, height=48.84
- 2. pass - linkText='Place block in the Header region'
- 3. pass - linkText='Search all content'
- 4. manual - Requires VoiceOver rotor/heading navigation review for spoken boundary quality.
- 5. pass - button='Save draft', legend='Delivery address', summary='More information', table='Standard subscription'
- 6. pass - wrapperWidth=1184.00, wrapperHeight=116.00
- 7. pass - button='Continue to the next step where you will review all configuration choices before saving the form', hiddenWhiteSpace='nowrap'
- 8. pass - selection user-select on hidden phrase='auto' (manual clipboard behavior still required).
- 9. manual - Needs manual 400% zoom and magnification visual tracking.

