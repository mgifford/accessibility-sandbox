(() => {
  const allowed = new Set(["drupal", "a11yproject", "govuk", "proposed"]);
  const labels = {
    drupal: "current Drupal",
    a11yproject: "A11Y Project",
    govuk: "GOV.UK",
    proposed: "proposed Drupal"
  };
  const params = new URLSearchParams(location.search);
  let current = params.get("implementation") || "proposed";
  if (!allowed.has(current)) current = "proposed";

  const stylesheet = document.getElementById("implementation-css");
  const status = document.getElementById("current-implementation");

  function apply(value, updateUrl = true) {
    stylesheet.href = `assets/${value}.css`;
    document.querySelector(`input[name="implementation"][value="${value}"]`).checked = true;
    status.textContent = `Using ${labels[value]} CSS.`;
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set("implementation", value);
      history.replaceState({}, "", url);
    }
  }

  document.querySelectorAll('input[name="implementation"]').forEach((control) => {
    control.addEventListener("change", () => apply(control.value));
  });
  apply(current, false);
})();
