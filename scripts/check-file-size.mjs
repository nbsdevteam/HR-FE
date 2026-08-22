import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve("src");
const maxLines = 300;
const oversizedFiles = [];

function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      scan(absolute);
      continue;
    }
    if (!entry.name.endsWith(".tsx")) continue;
    const lineCount = fs.readFileSync(absolute, "utf8").split("\n").length;
    if (lineCount > maxLines) {
      oversizedFiles.push({ file: path.relative(process.cwd(), absolute).replaceAll("\\", "/"), lineCount });
    }
  }
}

scan(sourceRoot);

if (oversizedFiles.length) {
  console.error(`File size check failed: ${oversizedFiles.length} .tsx file(s) exceed the ${maxLines}-line limit (CLAUDE.md rule 1):`);
  oversizedFiles
    .sort((a, b) => b.lineCount - a.lineCount)
    .forEach(({ file, lineCount }) => console.error(`- ${file}: ${lineCount} lines`));
  process.exit(1);
}

console.log(`File size check passed: all .tsx files under src/ are within ${maxLines} lines.`);
