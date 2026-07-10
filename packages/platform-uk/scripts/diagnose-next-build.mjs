import { spawn } from "node:child_process";

const timeoutMs = Number(process.env.BUILD_DIAGNOSE_TIMEOUT_MS ?? 45000);
let timedOut = false;
const child = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "build"],
  {
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1"
    },
    stdio: "inherit"
  }
);

const timer = setTimeout(() => {
  timedOut = true;
  console.error(`\nnext build produced no completion signal within ${Math.round(timeoutMs / 1000)}s.`);
  console.error("Treating this as the known production-build blocker. Use npm run verify for the current quality gate.");
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 2000).unref();
}, timeoutMs);

child.on("exit", (code, signal) => {
  clearTimeout(timer);
  if (timedOut || signal) {
    process.exitCode = 124;
    return;
  }
  process.exitCode = code ?? 1;
});
