# Visually hidden CSS comparison and test harness

Static documentation and manual accessibility tests for Drupal core issue #3591112.

## Files

- `index.html`: overview and scope
- `implementations.html`: line-by-line explanation of Drupal 11.x, GOV.UK Frontend, and the proposed Drupal adaptation
- `tests.html`: matched screen-reader, keyboard, focus-within, zoom, and magnification tests
- `assets/site.css`: presentation styles for the documentation site
- `assets/implementations.css`: the three CSS implementations used by the test cases

## GitHub Pages

This site has no build step and no dependencies.

1. Add these files to a repository.
2. In GitHub, open **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch and the root folder containing `index.html`.
5. Publish and test the resulting HTTPS URL with assistive technologies.

Using an HTTPS GitHub Pages URL is preferable to testing `file://` pages because it more closely resembles ordinary browser behavior and gives testers a stable URL to share.

## Testing principle

Do not treat the proposed implementation as the expected winner. Record the actual announcement or behavior for every browser and assistive-technology combination. GOV.UK has broader published testing than the proposed Drupal adaptation, and the `:focus-within` comparison is specifically about preserving Drupal behavior rather than proving a defect in GOV.UK Frontend.

## Primary references

- https://www.drupal.org/project/drupal/issues/3591112
- https://api.drupal.org/api/drupal/core%21modules%21system%21css%21components%21hidden.module.css/11.x
- https://www.drupal.org/docs/getting-started/accessibility/hide-content-properly
- https://design-system.service.gov.uk/styles/layout/#hide-elements-and-keep-them-accessible-to-screen-readers
- https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/helpers/_visually-hidden.scss
- https://github.com/alphagov/govuk-frontend/pull/3836
- https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip-path
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/white-space
