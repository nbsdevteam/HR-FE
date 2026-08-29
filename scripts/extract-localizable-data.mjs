import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";

const arabicPattern = /\p{Script=Arabic}/u;
const sqlFiles = [
  "database/supabase-migration.sql",
  "database/migration-part13-biometric.sql",
  "database/database-plain-postgresql.sql",
  "database/database-supabase.sql",
];
const serviceFiles = [
  "device-sync/hikvision-api.mjs",
  "device-sync/sync-service.mjs",
];

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function collectNestedJson(value, output) {
  try {
    const parsed = JSON.parse(value);
    const visit = (item) => {
      if (typeof item === "string" && arabicPattern.test(item)) {
        output.add(normalize(item));
      } else if (Array.isArray(item)) {
        item.forEach(visit);
      } else if (item && typeof item === "object") {
        Object.values(item).forEach(visit);
      }
    };
    visit(parsed);
    return true;
  } catch {
    return false;
  }
}

function addDisplayValues(rawValue, output) {
  const value = normalize(rawValue);
  if (!value || !arabicPattern.test(value)) return;
  if (collectNestedJson(value, output)) return;

  if (value.includes(",")) {
    for (const item of value.split(",")) {
      const label = item.includes(":") ? item.slice(item.lastIndexOf(":") + 1) : item;
      if (arabicPattern.test(label)) output.add(normalize(label));
    }
    return;
  }

  output.add(value);
}

function extractSqlStrings(source) {
  const values = [];
  let index = 0;
  while (index < source.length) {
    if (source[index] === "-" && source[index + 1] === "-") {
      index = source.indexOf("\n", index + 2);
      if (index === -1) break;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 2;
      continue;
    }
    if (source[index] !== "'") {
      index += 1;
      continue;
    }

    const lineStart = source.lastIndexOf("\n", index) + 1;
    const beforeQuote = source.slice(lineStart, index).trimStart().toUpperCase();
    let value = "";
    let cursor = index + 1;
    while (cursor < source.length) {
      if (source[cursor] === "'" && source[cursor + 1] === "'") {
        value += "'";
        cursor += 2;
      } else if (source[cursor] === "'") {
        break;
      } else {
        value += source[cursor];
        cursor += 1;
      }
    }
    if (!beforeQuote.startsWith("COMMENT ON")) values.push(value);
    index = cursor + 1;
  }
  return values;
}

function walkAst(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => walkAst(item, visit));
    else if (value && typeof value === "object" && value.type) walkAst(value, visit);
  }
}

function extractServiceStrings(source, filename) {
  const ast = parse(source, {
    sourceType: "module",
    sourceFilename: filename,
    plugins: ["topLevelAwait"],
  });
  const values = [];
  walkAst(ast, (node) => {
    if (node.type === "StringLiteral") values.push(node.value);
    else if (node.type === "TemplateElement") {
      values.push(node.value.cooked ?? node.value.raw);
    }
  });
  return values;
}

export function extractLocalizableData(root = process.cwd()) {
  const values = new Set();
  for (const relativeFile of sqlFiles) {
    const absoluteFile = path.resolve(root, relativeFile);
    const source = fs.readFileSync(absoluteFile, "utf8");
    extractSqlStrings(source).forEach((value) => addDisplayValues(value, values));
  }
  for (const relativeFile of serviceFiles) {
    const absoluteFile = path.resolve(root, relativeFile);
    const source = fs.readFileSync(absoluteFile, "utf8");
    extractServiceStrings(source, relativeFile).forEach((value) =>
      addDisplayValues(value, values),
    );
  }
  return [...values].sort((left, right) => left.localeCompare(right, "ar"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  process.stdout.write(`${JSON.stringify(extractLocalizableData(), null, 2)}\n`);
}
