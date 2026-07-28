"use client";

import { useTransition } from "react";
import { JobRecord } from "../models/ui.model.js";
import { updateJobStatusAction } from "../app/actions.js";

export default function JobsTable({
  jobs,
  onSelect,
}: {
  jobs: JobRecord[];
  onSelect: (job: JobRecord) => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED_BY_ZAI":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Approved
          </span>
        );
      case "REJECTED_BY_CODE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Rejected
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pending
          </span>
        );
      case "APPLIED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Applied
          </span>
        );
      case "INTERVIEW":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Interview
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Role & Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No offers match the current filters.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <JobRow key={job.hashId} job={job} onSelect={onSelect} getStatusBadge={getStatusBadge} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobRow({
  job,
  onSelect,
  getStatusBadge,
}: {
  job: JobRecord;
  onSelect: (job: JobRecord) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  const handleQuickAction = (e: React.MouseEvent, status: string) => {
    e.stopPropagation();
    startTransition(async () => {
      await updateJobStatusAction(job.hashId, status);
    });
  };

  return (
    <tr
      onClick={() => onSelect(job)}
      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
          {job.jobTitle}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          {job.companyName}
          {job.rejectionReason && (
            <span
              className="truncate max-w-[200px] text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-sm"
              title={job.rejectionReason}
            >
              {job.rejectionReason}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(job.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {new Date(job.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-3">
          {job.status !== "APPLIED" && (
            <button
              onClick={(e) => handleQuickAction(e, "APPLIED")}
              disabled={isPending}
              title="Mark as Applied"
              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          )}

          {job.status !== "ARCHIVED" && (
            <button
              onClick={(e) => handleQuickAction(e, "ARCHIVED")}
              disabled={isPending}
              title="Archive"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </button>
          )}

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="External Link"
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </td>
    </tr>
  );
}
