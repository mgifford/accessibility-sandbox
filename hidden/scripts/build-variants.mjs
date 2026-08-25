#!/usr/bin/env node
// Generates faithful skip-link / visually-hidden variant pages into hidden/variants/.
//
// Each variant is one static HTML page that differs from the others ONLY in:
//   - the skip target markup (how #main-content is exposed), and
//   - the visually-hidden reveal CSS (which stylesheet it links).
//
// The pages are static (no runtime DOM mutation) so assistive-technology testing
// observes exactly what each project ships. Regenerate with:
//   node scripts/build-variants.mjs
//
// This is the single source of truth for the variant pages; edit the manifest or
// the body template here rather than hand-editing the generated HTML.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const hiddenDir = path.resolve(scriptDir, "..");
const outDir = path.join(hiddenDir, "variants");

// The href the skip link points at. Kept as #main-content to match Drupal core's
// real fragment (current Drupal, Claro, Default Admin all use #main-content).
const SKIP_HREF = "#main-content";

// Skip-target markup patterns. Each returns the opening of <main> plus any empty
// destination anchor that sits inside it. `mainId` is placed where the fragment
// target lives so the skip link always resolves.
const targets = {
  // Current Drupal: empty destination anchor carries the id + tabindex; <main> is plain.
  "empty-anchor": {
    label: "empty destination anchor inside <main> (current Drupal)",
    mainOpen: "<main>",
    // The comment mirrors core's own note that the skip link lives in html.html.twig.
    destinationAnchor:
      '  <a id="main-content" tabindex="-1"></a><!-- link is elsewhere in the page -->'
  },
  // Proposed / A11Y Project / GOV.UK style: id on <main>, keep tabindex="-1".
  "main-tabindex": {
    label: '<main id="main-content" tabindex="-1"> (id on landmark, focus shim kept)',
    mainOpen: '<main id="main-content" tabindex="-1">',
    destinationAnchor: null
  },
  // Proposed SFNSP: id on <main>, no tabindex; relies on sequential focus nav start point.
  "main-sfnsp": {
    label: '<main id="main-content"> (SFNSP, no tabindex)',
    mainOpen: '<main id="main-content">',
    destinationAnchor: null
  }
};

// Reveal-CSS choices map to the existing stylesheet files in assets/.
const revealCss = {
  "focus": {
    stylesheet: "drupal.css",
    label: ":focus / :active reveal (current Drupal)"
  },
  "focus-within": {
    stylesheet: "proposed.css",
    label: ":focus-within reveal (proposed)"
  }
};

// The variant manifest. `faithfulTo` documents which real project a page reproduces
// so reviewers are not misled into reading a synthetic combination as a project's
// actual shipped pattern.
const variants = [
  {
    id: "drupal-current",
    title: "Current Drupal",
    target: "empty-anchor",
    css: "focus",
    faithfulTo:
      "Current Drupal core: empty <a id=\"main-content\" tabindex=\"-1\"> inside <main>, :focus reveal."
  },
  {
    id: "a11yproject",
    title: "A11Y Project",
    target: "main-tabindex",
    // A11Y Project's site uses clip/clip-path with :not(:focus):not(:active);
    // its own stylesheet is the faithful one.
    cssOverride: "a11yproject.css",
    css: "focus",
    faithfulTo:
      "The A11Y Project: <main id tabindex=\"-1\">, :not(:focus):not(:active) hide rule (a11yproject.css)."
  },
  {
    id: "govuk",
    title: "GOV.UK",
    target: "main-tabindex",
    cssOverride: "govuk.css",
    css: "focus",
    faithfulTo:
      "GOV.UK Frontend: <main id tabindex=\"-1\"> plus a focus-managing JS module (not reproduced here), user-select:none, govuk.css."
  },
  {
    id: "proposed-sfnsp-focus",
    title: "Proposed Drupal — SFNSP target, :focus reveal",
    target: "main-sfnsp",
    css: "focus",
    faithfulTo:
      "Proposed A: skip target modernized (no tabindex, SFNSP) but current :focus reveal CSS retained."
  },
  {
    id: "proposed-sfnsp-focuswithin",
    title: "Proposed Drupal — SFNSP target, :focus-within reveal",
    target: "main-sfnsp",
    css: "focus-within",
    faithfulTo:
      "Proposed B: both changes together — SFNSP target and :focus-within reveal. The primary proposal."
  },
  {
    id: "proposed-tabindex-focus",
    title: "Proposed Drupal — id on <main> with tabindex, :focus reveal",
    target: "main-tabindex",
    css: "focus",
    faithfulTo:
      "Proposed C: id moved onto <main> but tabindex=\"-1\" kept; current :focus reveal CSS."
  },
  {
    id: "proposed-tabindex-focuswithin",
    title: "Proposed Drupal — id on <main> with tabindex, :focus-within reveal",
    target: "main-tabindex",
    css: "focus-within",
    faithfulTo:
      "Proposed D: id on <main>, tabindex kept, plus :focus-within reveal."
  },
  {
    id: "proposed-anchor-focuswithin",
    title: "Proposed Drupal — empty anchor retained, :focus-within reveal",
    target: "empty-anchor",
    css: "focus-within",
    faithfulTo:
      "Proposed E: current empty-anchor target held constant, only the reveal CSS changed to :focus-within."
  }
];

// Escapes text that describes markup (e.g. "<main id=...>") so it renders as
// visible text instead of being parsed as real elements.
function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMain(target) {
  const t = targets[target];
  const anchorLine = t.destinationAnchor ? `${t.destinationAnchor}\n` : "";
  return `${t.mainOpen}\n${anchorLine}`;
}

function renderPage(variant) {
  const target = targets[variant.target];
  const css = revealCss[variant.css];
  const stylesheet = variant.cssOverride || css.stylesheet;
  const cssLabel = variant.cssOverride
    ? `${variant.cssOverride} (project stylesheet)`
    : css.label;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(variant.title)} — skip-link variant</title>
  <link rel="stylesheet" href="../assets/site.css">
  <link rel="stylesheet" href="../assets/${stylesheet}">
</head>
<body>
<!-- GENERATED FILE — do not edit. Source: scripts/build-variants.mjs -->
<!-- Variant: ${variant.id} -->
<!-- Skip target: ${target.label} -->
<!-- Reveal CSS: ${cssLabel} -->
<!-- Faithful to: ${variant.faithfulTo} -->
<a class="visually-hidden focusable skip-link" href="${SKIP_HREF}">Skip to main content</a>

<header>
  <h1>${esc(variant.title)}</h1>
  <nav aria-label="Site navigation">
    <ul>
      <li><a href="../index.html">Overview</a></li>
      <li><a href="index.html">Variants index</a></li>
    </ul>
  </nav>
  <p class="variant-meta">Skip target: ${esc(target.label)}. Reveal CSS: ${esc(cssLabel)}.</p>
</header>

${renderMain(variant.target)}<section>
<h2>1. Keyboard-only: skip link</h2>
<p><strong>Start here.</strong> Reload the page and press <kbd>Tab</kbd> once. “Skip to main content” should be the first focusable element and should become visible. Activate it, then press <kbd>Tab</kbd> again and confirm focus resumes inside the main content.</p>
<p>Repeat at 100%, 200%, and 400% browser zoom.</p>
</section>

<section>
<h2>2. Visible text followed by hidden text</h2>
<p><a href="#suffix-target">Place block<span class="visually-hidden"> in the Header region</span></a></p>
<p id="suffix-target">Compare whether the spoken phrase preserves the boundary between “block” and “in”.</p>
</section>

<section>
<h2>3. Hidden text followed by visible text</h2>
<p><a href="#prefix-target"><span class="visually-hidden">Search </span>all content</a></p>
<p id="prefix-target">Compare whether the spoken phrase preserves the boundary between “Search” and “all”.</p>
</section>

<section>
<h2>4. Heading navigation</h2>
<h3>Account<span class="visually-hidden"> settings</span></h3>
<p>Navigate directly by heading. Compare word boundaries, pauses, and whether generated whitespace is announced explicitly.</p>
</section>

<section>
<h2>5. Different HTML contexts</h2>
<p>Paragraph<span class="visually-hidden"> additional context</span></p>
<button type="button">Save<span class="visually-hidden"> draft</span></button>
<fieldset>
  <legend>Delivery<span class="visually-hidden"> address</span></legend>
  <label><input type="radio" name="delivery"> Home</label>
</fieldset>
<details>
  <summary>More<span class="visually-hidden"> information</span></summary>
  <p>Details content.</p>
</details>
<table>
<caption>Table example</caption>
<tbody><tr><th scope="row">Plan</th><td>Standard<span class="visually-hidden"> subscription</span></td></tr></tbody>
</table>
</section>

<section>
<h2>6. Direct focus versus focus-within</h2>
<p>The wrapper below is visually hidden and carries Drupal's <code>focusable</code> class, but the wrapper itself is not focusable. Its child link is.</p>

<div class="visually-hidden focusable focus-wrapper">
  <p>Hidden wrapper context.</p>
  <a href="#focus-target">Focusable descendant inside hidden wrapper</a>
</div>

<p id="focus-target">Compare whether the entire wrapper becomes visible when the child link receives focus.</p>

<p><strong>Expected distinction:</strong> an implementation using only <code>:focus</code> on the wrapper cannot react when the child is focused. An implementation using <code>:focus-within</code> can.</p>
</section>

<section>
<h2>7. Long hidden text</h2>
<button type="button">Continue<span class="visually-hidden"> to the next step where you will review all configuration choices before saving the form</span></button>
<p>Compare Drupal's current wrapping behavior with the explicit <code>white-space: nowrap</code> implementations.</p>
</section>

<section>
<h2>8. Text selection</h2>
<p>Copy this sentence<span class="visually-hidden"> including this hidden phrase</span> and compare clipboard behavior. GOV.UK applies <code>user-select: none</code>; the other implementations in this test do not.</p>
</section>

<section>
<h2>9. High zoom and magnification</h2>
<p>At 400% browser zoom, reload and start again from the skip link. Confirm revealed focusable content is not constrained by one-pixel dimensions, clipping, or hidden overflow.</p>
</section>
</main>
</body>
</html>
`;
}

function renderIndex() {
  const rows = variants
    .map(
      (v) =>
        `      <li><a href="${v.id}.html">${esc(v.title)}</a> — <span class="variant-meta">${esc(v.faithfulTo)}</span></li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Skip-link variant index</title>
  <link rel="stylesheet" href="../assets/site.css">
</head>
<body>
<!-- GENERATED FILE — do not edit. Source: scripts/build-variants.mjs -->
<header>
  <h1>Skip-link and visually-hidden variants</h1>
  <nav aria-label="Site navigation">
    <ul>
      <li><a href="../index.html">Overview</a></li>
      <li><a href="../tests.html">Switcher test page</a></li>
    </ul>
  </nav>
</header>
<main id="main-content">
<section>
<h2>Faithful variant pages</h2>
<p>Each page is static markup faithful to one real or proposed pattern. Skip-target
markup and reveal CSS vary independently so each variable can be tested on its own.</p>
<ul>
${rows}
    </ul>
</section>
<section>
<h2>Matrix</h2>
<div class="table-wrap">
<table>
<caption>Skip target x reveal CSS</caption>
<thead><tr><th scope="col">Variant</th><th scope="col">Skip target</th><th scope="col">Reveal CSS</th></tr></thead>
<tbody>
${variants
  .map((v) => {
    const target = targets[v.target].label;
    const css = v.cssOverride
      ? `${v.cssOverride} (project stylesheet)`
      : revealCss[v.css].label;
    return `<tr><th scope="row"><a href="${v.id}.html">${esc(v.title)}</a></th><td>${esc(target)}</td><td>${esc(css)}</td></tr>`;
  })
  .join("\n")}
</tbody>
</table>
</div>
</section>
</main>
</body>
</html>
`;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const written = [];
  for (const variant of variants) {
    const file = path.join(outDir, `${variant.id}.html`);
    await fs.writeFile(file, renderPage(variant));
    written.push(path.relative(hiddenDir, file));
  }

  const indexFile = path.join(outDir, "index.html");
  await fs.writeFile(indexFile, renderIndex());
  written.push(path.relative(hiddenDir, indexFile));

  process.stdout.write(`Generated ${written.length} variant files:\n`);
  for (const file of written) {
    process.stdout.write(`  ${file}\n`);
  }
}

await main();
