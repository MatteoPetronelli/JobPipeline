import cron from "node-cron";
import { spawn } from "child_process";
import path from "path";

const runPipeline = () => {
  const scriptPath = path.resolve(process.cwd(), "src/scripts/run-pipeline.ts");
  const child = spawn("npx", ["tsx", scriptPath], { stdio: "inherit" });

  child.on("close", (code) => {
    if (code !== 0) {
      process.stdout.write(`Pipeline process exited with code ${code}\n`);
    }
  });
};

cron.schedule("0 8 * * *", () => {
  runPipeline();
});

cron.schedule("0 18 * * *", () => {
  runPipeline();
});
