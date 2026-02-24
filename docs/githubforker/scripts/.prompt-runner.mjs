// Reads a prompt from a file and runs openclaw.mjs directly in-process.
// This bypasses OS command-line argument length limits entirely — the message
// stays in Node.js memory and never crosses a spawn boundary.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [promptPath, ...flags] = process.argv.slice(2);
const message = readFileSync(promptPath, "utf-8");

// Set process.argv as if we launched `node openclaw.mjs <flags> --message <content>`
process.argv = ["node", "openclaw.mjs", ...flags, "--message", message];

// Prevent openclaw from re-spawning itself (which would hit ENAMETOOLONG again)
process.env.OPENCLAW_NODE_OPTIONS_READY = "1";

// Import openclaw.mjs directly (it loads dist/entry.js which reads process.argv)
const target = pathToFileURL(resolve(process.cwd(), "openclaw.mjs")).href;
await import(target);
