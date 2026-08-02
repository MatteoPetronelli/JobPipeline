import { dbAll } from "../db/database.js";
import { JobRecord, DashboardMetrics } from "../models/ui.model.js";
import DashboardClient from "../components/DashboardClient.js";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const jobs = await dbAll<JobRecord>(
    `SELECT * FROM jobs ORDER BY createdAt DESC LIMIT 500`,
  );

  const [totalResult, approvedResult, rejectedResult, pendingResult, followupResult] =
    await Promise.all([
      dbAll<{ count: number }>("SELECT COUNT(*) as count FROM jobs"),
      dbAll<{ count: number }>(
        "SELECT COUNT(*) as count FROM jobs WHERE status = 'APPROVED_BY_ZAI'",
      ),
      dbAll<{ count: number }>(
        "SELECT COUNT(*) as count FROM jobs WHERE status = 'REJECTED_BY_CODE'",
      ),
      dbAll<{ count: number }>(
        "SELECT COUNT(*) as count FROM jobs WHERE status = 'PENDING_REVIEW'",
      ),
      dbAll<{ count: number }>(
        "SELECT COUNT(*) as count FROM jobs WHERE status = 'NEEDS_FOLLOWUP'",
      ),
    ]);

  const metrics: DashboardMetrics = {
    total: totalResult[0]?.count || 0,
    approved: approvedResult[0]?.count || 0,
    rejected: rejectedResult[0]?.count || 0,
    pending: pendingResult[0]?.count || 0,
    needsFollowup: followupResult[0]?.count || 0,
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            JobPipeline Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Real-time tracking of AI-filtered apprenticeship opportunities.
          </p>
        </header>

        <DashboardClient initialJobs={jobs} initialMetrics={metrics} />
      </div>
    </main>
  );
}
