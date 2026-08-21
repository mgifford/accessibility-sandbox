#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const reportPath = path.resolve("guidepup/logs/elements-report.json");
const strict = process.env.ELEMENTS_SUMMARY_STRICT === "1";

function printRow(line) {
  process.stdout.write(`${line}\n`);
}

try {
  const raw = await fs.readFile(reportPath, "utf8");
  const report = JSON.parse(raw);
  const rows = report.rows || [];
  const caseIds = rows[0]?.results?.map((result) => result.id) || [];
  const implementationNames = rows.map((row) => row.implementation);

  const caseMatrix = caseIds.map((caseId) => {
    const statuses = rows.map((row) => row.results.find((result) => result.id === caseId)?.status || "missing");
    const same = statuses.every((status) => status === statuses[0]);
    return { caseId, statuses, same };
  });

  printRow(`Elements report: ${reportPath}`);
  printRow(`Generated: ${report.generatedAt}`);
  printRow(`Base URL: ${report.baseURL}`);
  printRow("");

  printRow(`Cases identical across all implementations: ${caseMatrix.filter((item) => item.same).length}/${caseMatrix.length}`);
  printRow(`Cases with differences: ${caseMatrix.filter((item) => !item.same).length}/${caseMatrix.length}`);
  printRow("");

  printRow("Case matrix:");
  printRow(`| Case | ${implementationNames.join(" | ")} | Same? |`);
  printRow(`|---|${implementationNames.map(() => "---").join("|")}|---|`);
  for (const item of caseMatrix) {
    printRow(`| ${item.caseId} | ${item.statuses.join(" | ")} | ${item.same ? "yes" : "no"} |`);
  }
  printRow("");

  const differingCases = caseMatrix.filter((item) => !item.same);
  if (differingCases.length > 0) {
    printRow("Cases with differences:");
    for (const item of differingCases) {
      printRow(`- ${item.caseId}: ${implementationNames.map((implementation, index) => `${implementation}=${item.statuses[index]}`).join(", ")}`);
    }
    printRow("");
  } else {
    printRow("No case-level differences across implementations.");
    printRow("");
  }

  let totalFailures = 0;

  for (const row of rows) {
    const failedResults = (row.results || []).filter((item) => item.status === "fail");
    totalFailures += failedResults.length;

    if (failedResults.length === 0) {
      continue;
    }

    printRow(`${row.implementation}: ${failedResults.length} failing checks`);
    for (const result of failedResults) {
      printRow(`- ${result.id}: ${result.details}`);
    }
    printRow("");
  }

  const divergences = report?.baseline?.divergences || [];
  if (divergences.length > 0) {
    printRow(`Baseline divergences vs proposed: ${divergences.length}`);
    for (const diff of divergences) {
      const expected = diff.expectedStatus ?? (typeof diff.expectedFound === "boolean" ? String(diff.expectedFound) : "-");
      const observed = diff.observedStatus ?? (typeof diff.observedFound === "boolean" ? String(diff.observedFound) : "-");
      printRow(`- ${diff.implementation} / ${diff.caseId} / ${diff.reason} (expected=${expected}, observed=${observed})`);
    }
    printRow("");
  }

  if (totalFailures === 0 && divergences.length === 0) {
    printRow("No failing checks and no baseline divergences.");
  }

  if (strict && (totalFailures > 0 || divergences.length > 0)) {
    process.exit(1);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Unable to read elements summary: ${message}`);
  process.exit(1);
}
