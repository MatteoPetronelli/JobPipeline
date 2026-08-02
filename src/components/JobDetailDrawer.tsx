"use client";

import { useEffect, useTransition } from "react";
import { JobRecord } from "../models/ui.model.js";
import { updateJobStatusAction } from "../app/actions.js";

export default function JobDetailDrawer({
  job,
  onClose,
}: {
  job: JobRecord | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!job) return null;

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      await updateJobStatusAction(job.hashId, newStatus);
    });
  };

  const statuses = [
    "NEW",
    "PENDING_REVIEW",
    "APPROVED_BY_ZAI",
    "REJECTED_BY_CODE",
    "HIGH_MATCH",
    "APPLIED",
    "NEEDS_FOLLOWUP",
    "INTERVIEW",
    "OFFER",
    "ARCHIVED",
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-xl overflow-y-auto transform transition-transform">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {job.jobTitle}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            {job.companyName}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Open External Listing
            </a>

            <select
              value={job.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isPending}
              className={`px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-sm font-medium focus:ring-blue-500 focus:border-blue-500 ${
                isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                System Status
              </h3>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 font-semibold">
                {job.status}
              </p>
            </div>

            {job.rejectionReason && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rejection Reason
                </h3>
                <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm whitespace-pre-wrap">
                  {job.rejectionReason}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Generated Outreach Prompt / Match
              </h3>
              <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-sm whitespace-pre-wrap">
                {job.generatedPrompt || "No prompt generated yet."}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Timestamps
              </h3>
              <div className="mt-2 flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                <p>Created: {new Date(job.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(job.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
