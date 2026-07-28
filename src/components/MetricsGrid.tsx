import { DashboardMetrics } from "../models/ui.model.js";

export default function MetricsGrid({
  metrics,
}: {
  metrics: DashboardMetrics;
}) {
  const cards = [
    {
      label: "Total Scraped",
      value: metrics.total,
      color: "text-slate-900 dark:text-slate-50",
    },
    {
      label: "Approved by AI",
      value: metrics.approved,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Pending Review",
      value: metrics.pending,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Rejected",
      value: metrics.rejected,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
        >
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {card.label}
          </span>
          <span className={`text-3xl font-bold mt-2 ${card.color}`}>
            {card.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
