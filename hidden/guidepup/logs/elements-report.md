# Element-Level Hidden Content Report

Generated: 2026-08-21T20:09:02.935Z
Base URL: file:///Users/mike.gifford/accessibility-sandbox/hidden/tests.html

## Summary

| Implementation | Passed | Failed |
|---|---:|---:|
| drupal | 10 | 0 |
| a11yproject | 9 | 1 |
| govuk | 7 | 3 |
| proposed | 10 | 0 |

## Case Consistency

Cases identical across all implementations: 7/10

| Case | drupal | a11yproject | govuk | proposed | Same? |
|---|---|---|---|---|---|
| skip-link | pass | pass | fail | pass | no |
| suffix-link | pass | pass | pass | pass | yes |
| prefix-link | pass | pass | pass | pass | yes |
| focus-within-wrapper | pass | fail | fail | pass | no |
| save-button | pass | pass | pass | pass | yes |
| fieldset-legend | pass | pass | pass | pass | yes |
| details-summary | pass | pass | pass | pass | yes |
| table-cell | pass | pass | pass | pass | yes |
| continue-button | pass | pass | pass | pass | yes |
| selection-phrase | pass | pass | fail | pass | no |

## Baseline Divergences (proposed canonical)

| Implementation | Case | Reason | Expected | Observed |
|---|---|---|---|---|
| a11yproject | focus-within-wrapper | status_mismatch | pass | fail |
| govuk | skip-link | status_mismatch | pass | fail |
| govuk | focus-within-wrapper | status_mismatch | pass | fail |
| govuk | selection-phrase | status_mismatch | pass | fail |

## Detailed Results

### drupal
- skip-link [pass] selector=.skip-link
  - section: (none)
  - details: revealed=true, width=186.77, height=48.84, clip=auto, clipPath=none
  - phrase='Skip to main content' found=true index=0
- suffix-link [pass] selector=a[href="#suffix-target"]
  - section: 2. Visible text followed by hidden text
  - details: all_expected_phrases_found=true
  - phrase='Place block' found=true index=0
  - phrase='Header region' found=true index=19
- prefix-link [pass] selector=a[href="#prefix-target"]
  - section: 3. Hidden text followed by visible text
  - details: all_expected_phrases_found=true
  - phrase='Search' found=true index=0
  - phrase='all content' found=true index=7
- focus-within-wrapper [pass] selector=.focus-wrapper
  - section: 6. Direct focus versus focus-within
  - details: revealed_on_descendant_focus=true, width=1184.00, height=116.00
  - phrase='Hidden wrapper context' found=true index=0
  - phrase='Focusable descendant inside hidden wrapper' found=true index=24
- save-button [pass] selector=section:nth-of-type(5) button[type="button"]
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Save' found=true index=0
  - phrase='draft' found=true index=5
- fieldset-legend [pass] selector=section:nth-of-type(5) fieldset legend
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Delivery' found=true index=0
  - phrase='address' found=true index=9
- details-summary [pass] selector=section:nth-of-type(5) details summary
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='More' found=true index=0
  - phrase='information' found=true index=5
- table-cell [pass] selector=section:nth-of-type(5) table td
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Standard' found=true index=0
  - phrase='subscription' found=true index=9
- continue-button [pass] selector=section:nth-of-type(7) button
  - section: 7. Long hidden text
  - details: all_expected_phrases_found=true
  - phrase='Continue' found=true index=0
  - phrase='review all configuration choices' found=true index=41
- selection-phrase [pass] selector=section:nth-of-type(8) p .visually-hidden
  - section: 8. Text selection
  - details: userSelect=, expected=not none
  - phrase='including this hidden phrase' found=true index=0

### a11yproject
- skip-link [pass] selector=.skip-link
  - section: (none)
  - details: revealed=true, width=186.77, height=48.84, clip=auto, clipPath=none
  - phrase='Skip to main content' found=true index=0
- suffix-link [pass] selector=a[href="#suffix-target"]
  - section: 2. Visible text followed by hidden text
  - details: all_expected_phrases_found=true
  - phrase='Place block' found=true index=0
  - phrase='Header region' found=true index=19
- prefix-link [pass] selector=a[href="#prefix-target"]
  - section: 3. Hidden text followed by visible text
  - details: all_expected_phrases_found=true
  - phrase='Search' found=true index=0
  - phrase='all content' found=true index=7
- focus-within-wrapper [fail] selector=.focus-wrapper
  - section: 6. Direct focus versus focus-within
  - details: revealed_on_descendant_focus=false, width=36.00, height=36.00
  - phrase='Hidden wrapper context' found=true index=0
  - phrase='Focusable descendant inside hidden wrapper' found=true index=24
- save-button [pass] selector=section:nth-of-type(5) button[type="button"]
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Save' found=true index=0
  - phrase='draft' found=true index=5
- fieldset-legend [pass] selector=section:nth-of-type(5) fieldset legend
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Delivery' found=true index=0
  - phrase='address' found=true index=9
- details-summary [pass] selector=section:nth-of-type(5) details summary
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='More' found=true index=0
  - phrase='information' found=true index=5
- table-cell [pass] selector=section:nth-of-type(5) table td
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Standard' found=true index=0
  - phrase='subscription' found=true index=9
- continue-button [pass] selector=section:nth-of-type(7) button
  - section: 7. Long hidden text
  - details: all_expected_phrases_found=true
  - phrase='Continue' found=true index=0
  - phrase='review all configuration choices' found=true index=41
- selection-phrase [pass] selector=section:nth-of-type(8) p .visually-hidden
  - section: 8. Text selection
  - details: userSelect=, expected=not none
  - phrase='including this hidden phrase' found=true index=0

### govuk
- skip-link [fail] selector=.skip-link
  - section: (none)
  - details: revealed=false, width=1.00, height=1.00, clip=rect(0px, 0px, 0px, 0px), clipPath=inset(50%)
  - phrase='Skip to main content' found=true index=0
- suffix-link [pass] selector=a[href="#suffix-target"]
  - section: 2. Visible text followed by hidden text
  - details: all_expected_phrases_found=true
  - phrase='Place block' found=true index=0
  - phrase='Header region' found=true index=19
- prefix-link [pass] selector=a[href="#prefix-target"]
  - section: 3. Hidden text followed by visible text
  - details: all_expected_phrases_found=true
  - phrase='Search' found=true index=0
  - phrase='all content' found=true index=7
- focus-within-wrapper [fail] selector=.focus-wrapper
  - section: 6. Direct focus versus focus-within
  - details: revealed_on_descendant_focus=false, width=1.00, height=1.00
  - phrase='Hidden wrapper context' found=true index=0
  - phrase='Focusable descendant inside hidden wrapper' found=true index=24
- save-button [pass] selector=section:nth-of-type(5) button[type="button"]
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Save' found=true index=0
  - phrase='draft' found=true index=5
- fieldset-legend [pass] selector=section:nth-of-type(5) fieldset legend
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Delivery' found=true index=0
  - phrase='address' found=true index=9
- details-summary [pass] selector=section:nth-of-type(5) details summary
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='More' found=true index=0
  - phrase='information' found=true index=5
- table-cell [pass] selector=section:nth-of-type(5) table td
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Standard' found=true index=0
  - phrase='subscription' found=true index=9
- continue-button [pass] selector=section:nth-of-type(7) button
  - section: 7. Long hidden text
  - details: all_expected_phrases_found=true
  - phrase='Continue' found=true index=0
  - phrase='review all configuration choices' found=true index=41
- selection-phrase [fail] selector=section:nth-of-type(8) p .visually-hidden
  - section: 8. Text selection
  - details: userSelect=, expected=none
  - phrase='including this hidden phrase' found=true index=0

### proposed
- skip-link [pass] selector=.skip-link
  - section: (none)
  - details: revealed=true, width=186.77, height=48.84, clip=auto, clipPath=none
  - phrase='Skip to main content' found=true index=0
- suffix-link [pass] selector=a[href="#suffix-target"]
  - section: 2. Visible text followed by hidden text
  - details: all_expected_phrases_found=true
  - phrase='Place block' found=true index=0
  - phrase='Header region' found=true index=19
- prefix-link [pass] selector=a[href="#prefix-target"]
  - section: 3. Hidden text followed by visible text
  - details: all_expected_phrases_found=true
  - phrase='Search' found=true index=0
  - phrase='all content' found=true index=7
- focus-within-wrapper [pass] selector=.focus-wrapper
  - section: 6. Direct focus versus focus-within
  - details: revealed_on_descendant_focus=true, width=1184.00, height=116.00
  - phrase='Hidden wrapper context' found=true index=0
  - phrase='Focusable descendant inside hidden wrapper' found=true index=24
- save-button [pass] selector=section:nth-of-type(5) button[type="button"]
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Save' found=true index=0
  - phrase='draft' found=true index=5
- fieldset-legend [pass] selector=section:nth-of-type(5) fieldset legend
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Delivery' found=true index=0
  - phrase='address' found=true index=9
- details-summary [pass] selector=section:nth-of-type(5) details summary
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='More' found=true index=0
  - phrase='information' found=true index=5
- table-cell [pass] selector=section:nth-of-type(5) table td
  - section: 5. Different HTML contexts
  - details: all_expected_phrases_found=true
  - phrase='Standard' found=true index=0
  - phrase='subscription' found=true index=9
- continue-button [pass] selector=section:nth-of-type(7) button
  - section: 7. Long hidden text
  - details: all_expected_phrases_found=true
  - phrase='Continue' found=true index=0
  - phrase='review all configuration choices' found=true index=41
- selection-phrase [pass] selector=section:nth-of-type(8) p .visually-hidden
  - section: 8. Text selection
  - details: userSelect=, expected=not none
  - phrase='including this hidden phrase' found=true index=0

