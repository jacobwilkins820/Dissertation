const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const env = process.env;

// Cypress fails to boot if Electron is forced into Node mode.
delete env.ELECTRON_RUN_AS_NODE;

const cypressCommand =
  process.platform === "win32"
    ? "node_modules\\.bin\\cypress.cmd"
    : "node_modules/.bin/cypress";

const result = spawnSync(cypressCommand, args, {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
