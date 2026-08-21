# Manual Scenario Comparison Template

Use this after running deterministic validation and manual checks.

Date:
Tester:
Machine:
macOS version:
VoiceOver version/settings notes:

## Scope

- Scenario 4: Heading navigation speech quality
- Scenario 9: 400% zoom and magnification
- Implementations: drupal, a11yproject, govuk, proposed

## Verdict Table

| Implementation | Scenario 4 verdict | Scenario 9 verdict | Overall manual confidence |
|---|---|---|---|
| drupal | pass / concern | pass / concern | high / medium / low |
| a11yproject | pass / concern | pass / concern | high / medium / low |
| govuk | pass / concern | pass / concern | high / medium / low |
| proposed | pass / concern | pass / concern | high / medium / low |

## Scenario 4 Details (Heading Navigation)

Expected check points:

- Phrase is natural and understandable
- No boundary glitch between visible and hidden words
- Heading level announcement is consistent
- Repeated navigation gives stable results

| Implementation | Natural phrase | Boundary clean | Level consistent | Stable repeat | Notes |
|---|---|---|---|---|---|
| drupal | yes / no | yes / no | yes / no | yes / no | |
| a11yproject | yes / no | yes / no | yes / no | yes / no | |
| govuk | yes / no | yes / no | yes / no | yes / no | |
| proposed | yes / no | yes / no | yes / no | yes / no | |

## Scenario 9 Details (400% Zoom + Magnifier)

Expected check points:

- Focus target is quickly discoverable
- Revealed content is readable and not clipped
- Context around focused control remains understandable
- Panning burden is reasonable

| Implementation | Discoverable focus | Not clipped | Context preserved | Panning reasonable | Notes |
|---|---|---|---|---|---|
| drupal | yes / no | yes / no | yes / no | yes / no | |
| a11yproject | yes / no | yes / no | yes / no | yes / no | |
| govuk | yes / no | yes / no | yes / no | yes / no | |
| proposed | yes / no | yes / no | yes / no | yes / no | |

## Phrase-Boundary Notes

Capture observations for these fixture strings if they affect judgment:

- Place block + hidden suffix
- hidden Search + all content
- Continue + long hidden context

| Implementation | Place block note | Search all content note | Continue note |
|---|---|---|---|
| drupal | | | |
| a11yproject | | | |
| govuk | | | |
| proposed | | | |

## Final Manual Summary

Top choice based on manual checks:

Reasoning:

Open questions or retest needs:
