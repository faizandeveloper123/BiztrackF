const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(standalone)) {
  console.warn("Standalone output not found; skip prepare-standalone");
  process.exit(0);
}

copyDir(publicDir, path.join(standalone, "public"));
copyDir(staticDir, path.join(standalone, ".next", "static"));

const preparedStatic = path.join(standalone, ".next", "static");
if (
  !fs.existsSync(preparedStatic) ||
  fs.readdirSync(preparedStatic).length === 0
) {
  console.error("Standalone static assets missing after copy");
  process.exit(1);
}

console.log("Standalone bundle prepared");
