import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default;
const root = path.resolve("src/app");
const arabicPattern = /\p{Script=Arabic}/u;
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "i18n") walk(absolute);
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(absolute);
  }
}

walk(root);

const strings = new Map();

function add(value, file, line, kind) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized || !arabicPattern.test(normalized)) return;
  const current = strings.get(normalized) ?? { value: normalized, count: 0, locations: [] };
  current.count += 1;
  if (current.locations.length < 5) {
    current.locations.push(`${path.relative(process.cwd(), file)}:${line}:${kind}`);
  }
  strings.set(normalized, current);
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
    errorRecovery: true,
  });

  traverse(ast, {
    StringLiteral(nodePath) {
      add(nodePath.node.value, file, nodePath.node.loc?.start.line ?? 0, "string");
    },
    JSXText(nodePath) {
      add(nodePath.node.value, file, nodePath.node.loc?.start.line ?? 0, "jsx");
    },
    TemplateElement(nodePath) {
      add(nodePath.node.value.raw, file, nodePath.node.loc?.start.line ?? 0, "template");
    },
  });
}

const results = [...strings.values()].sort((a, b) => {
  const firstFile = a.locations[0]?.split(":")[0] ?? "";
  const secondFile = b.locations[0]?.split(":")[0] ?? "";
  return firstFile.localeCompare(secondFile) || a.value.localeCompare(b.value, "ar");
});

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} else {
  console.log(`Found ${results.length} unique Arabic-script UI strings in ${files.length} files.`);
  for (const item of results) {
    console.log(`\n${item.value}\n  ${item.locations.join("\n  ")}`);
  }
}
