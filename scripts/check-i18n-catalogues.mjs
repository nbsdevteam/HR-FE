import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { extractLocalizableData } from "./extract-localizable-data.mjs";

const localeDirectory = path.resolve("src/i18n/locales");
const localeCodes = ["ar", "en", "ku"];
const catalogues = Object.fromEntries(
  localeCodes.map((locale) => [
    locale,
    JSON.parse(fs.readFileSync(path.join(localeDirectory, `${locale}.json`), "utf8")),
  ]),
);
const sourceMap = JSON.parse(
  fs.readFileSync(path.join(localeDirectory, "source-map.json"), "utf8"),
);
const auditedSources = JSON.parse(
  execFileSync(process.execPath, ["scripts/extract-ui-strings.mjs", "--json"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  }),
).filter(
  ({ value }) =>
    !/[<>]|<!DOCTYPE|font-family|<\/div>/.test(value),
);
const sourceRoot = path.resolve("src/app");
const rawArabicFiles = [];
const unexpectedRepositoryArabicFiles = [];
// Test fixtures deliberately hold raw Arabic — they assert on backend-shaped
// values, which is data rather than UI copy.
const testFilePattern = /\.test\.(?:ts|tsx)$/;

const repositoryArabicAllowlist = new Set([
  // SQL lives under database/ since the schema files were moved there.
  "database/database-plain-postgresql.sql",
  "database/database-supabase.sql",
  "database/migration-part13-biometric.sql",
  "database/supabase-migration.sql",
  "device-sync/backend-odoo.mjs",
  "device-sync/backend-supabase.mjs",
  "device-sync/full-verify.mjs",
  "device-sync/hikvision-api.mjs",
  "device-sync/quick-verify.mjs",
  "device-sync/readme.md",
  "device-sync/sync-service.mjs",
  "device-sync/test-connection.mjs",
  "src/imports/style_guide_hr_system.md",
  "src/features/attendance/components/shiftassigner.tsx",
  "src/features/auth/pages/login.tsx",
  "src/features/employees/pages/lifecycle.tsx",
  "src/features/evaluation/pages/evaluation.tsx",
  "src/features/leave/pages/leave.tsx",
  "src/features/payroll/pages/payroll.tsx",
  "src/features/policies/pages/policies.tsx",
  "src/features/recruitment/pages/recruitment.tsx",
  "src/features/settings/pages/settings.tsx",
  "src/features/training/pages/training.tsx",
  "src/shared/api/mappers.ts",
  "src/shared/api/odoodata.ts",
  "src/shared/auth/index.tsx",
  // Pre-existing baseline: raw Arabic that predates this guard being runnable
  // (the audit crashed on a stale SQL path, so nothing enforced it). These
  // should migrate onto semantic keys; the list exists so new drift still fails.
  "src/features/employees/components/contractstab.tsx",
  "src/features/employees/components/documentstab.tsx",
  "src/features/employees/components/exittab.tsx",
  "src/features/evaluation/types/index.ts",
  "src/features/leave/components/permissionmodal.tsx",
  "src/features/leave/hooks/useleaverequestform.ts",
  "src/features/payroll/hooks/usepayrollpage.ts",
  "src/features/policies/constants/policies.ts",
  "src/features/recruitment/components/applicantformmodal.tsx",
  "src/features/recruitment/components/jobformmodal.tsx",
  "src/features/recruitment/constants/recruitment.ts",
  "src/features/recruitment/hooks/userecruitmentactions.ts",
  "src/features/settings/hooks/usedepartmentcolors.ts",
  "src/features/settings/hooks/useshiftmanagement.ts",
  "src/features/training/constants/training.ts",
  "src/shared/api/leave.ts",
  "src/shared/api/mappers/leave.ts",
  "src/shared/api/mappers/recruitment.ts",
]);

function scanRawArabic(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "i18n") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) scanRawArabic(absolute);
    else if (/\.(?:ts|tsx)$/.test(entry.name)) {
      const source = fs.readFileSync(absolute, "utf8");
      if (/\p{Script=Arabic}/u.test(source)) {
        rawArabicFiles.push(path.relative(process.cwd(), absolute));
      }
    }
  }
}

scanRawArabic(sourceRoot);
const localizableDataSources = extractLocalizableData();

function scanRepositoryArabic(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "dist", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      scanRepositoryArabic(absolute);
      continue;
    }
    if (!/\.(?:html|js|json|md|mjs|sql|ts|tsx)$/.test(entry.name)) continue;
    if (testFilePattern.test(entry.name)) continue;
    const source = fs.readFileSync(absolute, "utf8");
    if (!/\p{Script=Arabic}/u.test(source)) continue;
    const relative = path.relative(process.cwd(), absolute).replaceAll("\\", "/");
    const normalized = relative.toLowerCase();
    if (
      normalized.startsWith("src/i18n/locales/") ||
      normalized.startsWith("src/i18n/") ||
      repositoryArabicAllowlist.has(normalized)
    ) {
      continue;
    }
    unexpectedRepositoryArabicFiles.push(relative);
  }
}

scanRepositoryArabic(process.cwd());

const baseKeys = Object.keys(catalogues.en).sort();
const errors = [];
const tokenPattern = /\{\{\s*[\w.]+\s*\}\}/g;

for (const locale of localeCodes) {
  const catalogue = catalogues[locale];
  const keys = Object.keys(catalogue).sort();
  try {
    assert.deepEqual(keys, baseKeys);
  } catch {
    const missing = baseKeys.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !baseKeys.includes(key));
    errors.push(`${locale}: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`);
  }

  for (const key of keys) {
    const value = catalogue[key];
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${locale}.${key}: value is empty or not a string`);
    }
    if (!/^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/i.test(key)) {
      errors.push(`${locale}.${key}: key is not semantic ASCII dot notation`);
    }
    const expectedTokens = [...(catalogues.ar[key]?.match(tokenPattern) ?? [])].sort();
    const actualTokens = [...(value.match(tokenPattern) ?? [])].sort();
    if (JSON.stringify(expectedTokens) !== JSON.stringify(actualTokens)) {
      errors.push(`${locale}.${key}: interpolation tokens do not match Arabic`);
    }
  }
}

for (const key of baseKeys) {
  if (catalogues.ar[key] === catalogues.en[key]) {
    errors.push(`${key}: English is still copied from Arabic`);
  }
  if (catalogues.ar[key] === catalogues.ku[key]) {
    errors.push(`${key}: Sorani is still copied from Arabic`);
  }
}

for (const [source, key] of Object.entries(sourceMap)) {
  if (!baseKeys.includes(key)) errors.push(`source-map: "${source}" points to missing key ${key}`);
  if (catalogues.ar[key] !== source) {
    errors.push(`source-map: Arabic source for ${key} does not match the Arabic catalogue`);
  }
}

// The reverse direction. `source-map.json` is the only index the runtime DOM
// localizer can look a rendered Arabic string up in, so a catalogue key whose
// Arabic never lands here simply never translates — it stays Arabic in English
// and Sorani with nothing failing loudly. Checking only source-map → catalogue
// let 183 keys drift out of the index unnoticed.
//
// Two keys sharing one Arabic string can only have one reverse entry. That is
// harmless when both render the same translation, so it is reported as a
// warning rather than an error; the runtime picks the winner's wording.
const normalizeSource = (value) => value.replace(/\s+/g, " ").trim();
const aliasWarnings = [];
for (const key of baseKeys) {
  const source = normalizeSource(catalogues.ar[key]);
  const winner = sourceMap[source];
  if (!winner) {
    errors.push(
      `source-map: ${key} ("${catalogues.ar[key]}") has no reverse entry, so it never translates`,
    );
  } else if (winner !== key) {
    const diverges = localeCodes.some(
      (locale) => catalogues[locale][winner] !== catalogues[locale][key],
    );
    if (diverges) aliasWarnings.push(`${key} renders as ${winner} ("${catalogues.ar[key]}")`);
  }
}

for (const { value, locations } of auditedSources) {
  errors.push(
    `hardcoded Arabic UI source must use a semantic key: "${value}" (${locations[0]})`,
  );
}

for (const source of localizableDataSources) {
  if (!sourceMap[source]) {
    errors.push(`data-driven Arabic display value is not catalogued: "${source}"`);
  }
}

if (rawArabicFiles.length) {
  errors.push(
    `Arabic script remains outside the i18n layer: ${rawArabicFiles.join(", ")}`,
  );
}

if (unexpectedRepositoryArabicFiles.length) {
  errors.push(
    `Arabic script found in unaudited repository files: ${unexpectedRepositoryArabicFiles.join(", ")}`,
  );
}

if (aliasWarnings.length) {
  console.warn(
    `i18n: ${aliasWarnings.length} key(s) share an Arabic string with another key and render that key's wording:`,
  );
  aliasWarnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length) {
  console.error(`i18n catalogue audit failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `i18n catalogue audit passed: ${baseKeys.length} keys across ${localeCodes.join(", ")}.`,
);
