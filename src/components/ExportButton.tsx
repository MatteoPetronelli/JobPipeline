"use client";

import { JobRecord } from "../models/ui.model.js";

export default function ExportButton({ jobs }: { jobs: JobRecord[] }) {
  const sanitizeCSVCell = (value: string | null | undefined): string => {
    if (!value) return "";
    let sanitized = String(value);

    const maliciousPrefixes = ["=", "+", "-", "@"];
    if (maliciousPrefixes.some((prefix) => sanitized.startsWith(prefix))) {
      sanitized = "'" + sanitized;
    }

    if (sanitized.includes('"')) {
      sanitized = sanitized.replace(/"/g, '""');
    }

    if (
      sanitized.includes(",") ||
      sanitized.includes("\n") ||
      sanitized.includes('"') ||
      maliciousPrefixes.some((prefix) => sanitized.startsWith(prefix))
    ) {
      sanitized = `"${sanitized}"`;
    }

    return sanitized;
  };

  const downloadCSV = () => {
    const headers = [
      "hashId",
      "jobTitle",
      "companyName",
      "url",
      "status",
      "rejectionReason",
      "createdAt",
    ];

    const csvRows = [headers.join(",")];

    for (const job of jobs) {
      const row = [
        sanitizeCSVCell(job.hashId),
        sanitizeCSVCell(job.jobTitle),
        sanitizeCSVCell(job.companyName),
        sanitizeCSVCell(job.url),
        sanitizeCSVCell(job.status),
        sanitizeCSVCell(job.rejectionReason),
        sanitizeCSVCell(job.createdAt),
      ];
      csvRows.push(row.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvString], {
      type: "text/csv;charset=utf-8;",
    });
    triggerDownload(blob, "csv");
  };

  const downloadJSON = () => {
    const jsonString = JSON.stringify(jobs, null, 2);
    const blob = new Blob([jsonString], {
      type: "application/json;charset=utf-8;",
    });
    triggerDownload(blob, "json");
  };

  const triggerDownload = (blob: Blob, extension: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `job-offers-${timestamp}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadCSV}
        className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
      >
        Export CSV
      </button>
      <button
        onClick={downloadJSON}
        className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
      >
        Export JSON
      </button>
    </div>
  );
}
