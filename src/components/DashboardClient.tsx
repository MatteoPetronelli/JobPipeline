"use client";

import { useState } from "react";
import { JobRecord, DashboardMetrics } from "../models/ui.model.js";
import MetricsGrid from "./MetricsGrid.js";
import JobsTable from "./JobsTable.js";

export default function DashboardClient({
  initialJobs,
  initialMetrics,
}: {
  initialJobs: JobRecord[];
  initialMetrics: DashboardMetrics;
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const filteredJobs = initialJobs.filter((job) => {
    const matchesSearch =
      job.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      job.companyName.toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "APPROVED" && job.status === "APPROVED_BY_ZAI") ||
      (activeTab === "PENDING" && job.status === "PENDING_REVIEW") ||
      (activeTab === "REJECTED" && job.status === "REJECTED_BY_CODE");

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <MetricsGrid metrics={initialMetrics} />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          {["ALL", "APPROVED", "PENDING", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search roles or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <JobsTable jobs={filteredJobs} />
    </div>
  );
}
