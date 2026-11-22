#!/usr/bin/env node
/**
 * Flattens Playwright's JSON report into one row per test, for the results
 * dashboard: `node tests/e2e/summarize-results.mjs <report.json> <out.json>`.
 *
 * Produce the report with:
 *   PLAYWRIGHT_JSON_OUTPUT_NAME=playwright/.cache/results.json \
 *     pnpm exec playwright test --reporter=line,json
 */
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const [input, output] = process.argv.slice(2)
if (!input || !output) {
  console.error("usage: summarize-results.mjs <report.json> <out.json>")
  process.exit(1)
}

const report = JSON.parse(readFileSync(input, "utf8"))
const rows = []

function walk(suite, file, describe) {
  const here = suite.file ? suite.file : file
  const names = suite.title && suite.title !== here && !suite.file ? [...describe, suite.title] : describe
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const results = t.results ?? []
      const last = results.at(-1) ?? {}
      // Playwright: expected | unexpected | flaky | skipped
      const status =
        t.status === "expected" ? "passed" : t.status === "unexpected" ? "failed" : t.status === "flaky" ? "flaky" : "skipped"
      const caseId = spec.title.match(/\b([A-Z]{2,6}-\d+[a-z]?)\b/)?.[1] ?? ""
      const tags = [...new Set([...(spec.tags ?? []), ...(spec.title.match(/@\w+/g) ?? []).map((s) => s.slice(1))])]
      const known = (t.annotations ?? []).some((a) => a.type === "issue")
      const error = (last.error?.message ?? last.errors?.[0]?.message ?? "")
        .replace(/\u001b\[[0-9;]*m/g, "")
        .split("\n")
        .find((l) => l.trim()) ?? ""
      rows.push({
        spec: path.basename(here ?? "").replace(/\.e2e\.ts$|\.setup\.ts$/, ""),
        project: t.projectName ?? "",
        group: names.join(" › "),
        caseId,
        title: spec.title.replace(/@\w+\s*/g, "").trim(),
        level: tags.includes("smoke") ? "smoke" : tags.includes("regression") ? "regression" : "other",
        status,
        knownBug: known ? "yes" : "no",
        retries: Math.max(0, results.length - 1),
        durationSec: Math.round(results.reduce((s, r) => s + (r.duration ?? 0), 0) / 100) / 10,
        error: error.slice(0, 300),
      })
    }
  }
  for (const child of suite.suites ?? []) walk(child, here, names)
}

for (const s of report.suites ?? []) walk(s, s.file, [])

const startedAt = report.stats?.startTime ?? new Date().toISOString()
writeFileSync(
  output,
  JSON.stringify({ rows, meta: [{ label: "Run started", value: startedAt }, { label: "Total wall time (s)", value: Math.round((report.stats?.duration ?? 0) / 1000) }] }, null, 0)
)
const count = (st) => rows.filter((r) => r.status === st).length
console.log(`${rows.length} tests: ${count("passed")} passed, ${count("failed")} failed, ${count("flaky")} flaky, ${count("skipped")} skipped`)
