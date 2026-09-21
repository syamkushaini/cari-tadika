// One command to go from an edited spreadsheet to the live apps:
//   npm run data:publish [-- path/to.xlsx]
// import (validates) -> tests -> commit the data files -> push. GitHub then redeploys the website.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { DEFAULT_FILE } from "./sheet-io";

const file = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? DEFAULT_FILE;
const run = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) { console.error(`\nStopped: "${cmd} ${args.join(" ")}" failed. Nothing was published.`); process.exit(r.status ?? 1); }
};
const out = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: "utf8" }).trim();

run("npx", ["tsx", "scripts/data-import.ts", file]);
run("npx", ["vitest", "run"]);

const files = ["src/data/curated.json", "src/data/manual-places.json"];
run("git", ["add", ...files]);
if (!out("git", ["diff", "--cached", "--name-only", "--", ...files])) { console.log("\nNothing changed since the last publish."); process.exit(0); }
const n = Object.keys(JSON.parse(readFileSync("src/data/curated.json", "utf8"))).length;
run("git", ["commit", "-m", `Update data from spreadsheet (${n} listings with verified details)`, "--", ...files]);
run("git", ["push"]);
console.log("\nPublished. The website updates in a couple of minutes: https://syamkushaini.github.io/cari-tadika/");
console.log("The iPhone app picks it up next time it opens with internet.");
