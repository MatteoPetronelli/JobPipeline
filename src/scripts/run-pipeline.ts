import { execSync } from "child_process";

export async function runPipeline(): Promise<void> {
  try {
    console.log("Initiating JobPipeline execution sequence.");

    console.log("Executing upstream scraper script...");
    execSync("npx tsx src/scripts/scrape-jobs.ts", { stdio: "inherit" });

    console.log("Executing downstream filtering script...");
    execSync("npx tsx src/scripts/filter-jobs.ts", { stdio: "inherit" });

    console.log("JobPipeline executed successfully.");
  } catch (error) {
    console.error("JobPipeline execution failed.", error);
    process.exit(1);
  }
}

runPipeline();
