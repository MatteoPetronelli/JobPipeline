import { JobRecord } from "../models/ui.model.js";
import { getPipelineAnalytics } from "../services/analytics.service.js";

export default function AnalyticsFunnel({ jobs }: { jobs: JobRecord[] }) {
  const analytics = getPipelineAnalytics(jobs);

  const getIndicatorColor = () => {
    if (analytics.appliedCount > 10 && analytics.interviewRate < 5) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    }
    if (analytics.interviewRate > 15) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    }
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
  };

  const getIndicatorText = () => {
    if (analytics.appliedCount > 10 && analytics.interviewRate < 5) {
      return "Action Needed: Optimize CV/Pitch";
    }
    if (analytics.interviewRate > 15) {
      return "High Performing Strategy";
    }
    return "Standard Conversion";
  };

  const calculateWidth = (count: number, max: number) => {
    if (max === 0) return "0%";
    return `${Math.min(100, Math.max(0, (count / max) * 100))}%`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
          Conversion Funnel Analytics
        </h2>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getIndicatorColor()}`}
        >
          {getIndicatorText()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Applications Sent
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {analytics.appliedCount}
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Interview Rate
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {analytics.interviewRate.toFixed(1)}%
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Follow-ups Required
          </p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {analytics.needsFollowupCount}
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Offers Received
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {analytics.offerCount}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span className="text-slate-700 dark:text-slate-300">
              Scraped / Total Opportunities
            </span>
            <span className="text-slate-900 dark:text-slate-100">
              {analytics.totalOffers}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
            <div
              className="bg-slate-400 dark:bg-slate-600 h-3 rounded-full transition-all duration-500"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span className="text-slate-700 dark:text-slate-300">Applied</span>
            <span className="text-slate-900 dark:text-slate-100">
              {analytics.appliedCount}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: calculateWidth(
                  analytics.appliedCount,
                  analytics.totalOffers
                ),
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span className="text-slate-700 dark:text-slate-300">
              Interviews
            </span>
            <span className="text-slate-900 dark:text-slate-100">
              {analytics.interviewCount}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: calculateWidth(
                  analytics.interviewCount,
                  analytics.totalOffers
                ),
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span className="text-slate-700 dark:text-slate-300">Offers</span>
            <span className="text-slate-900 dark:text-slate-100">
              {analytics.offerCount}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: calculateWidth(
                  analytics.offerCount,
                  analytics.totalOffers
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
