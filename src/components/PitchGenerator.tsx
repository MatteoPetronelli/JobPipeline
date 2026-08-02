"use client";

import { useState, useEffect } from "react";
import { JobRecord } from "../models/ui.model.js";
import { generateOutreachPitch } from "../services/pitch.service.js";
import { updateJobStatusAction } from "../app/actions.js";

export default function PitchGenerator({
  job,
  onStatusChange,
}: {
  job: JobRecord;
  onStatusChange: (status: string) => void;
}) {
  const [pitch, setPitch] = useState({ subject: "", body: "", mailtoUrl: "" });
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (job) {
      setPitch(generateOutreachPitch(job));
    }
  }, [job]);

  const copyToClipboard = async (text: string, type: "subject" | "body") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "subject") {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
    } catch (e) {
      String(e);
    }
  };

  const handleFastTrack = async () => {
    await copyToClipboard(pitch.body, "body");
    setIsPending(true);
    try {
      await updateJobStatusAction(job.hashId, "APPLIED");
      onStatusChange("APPLIED");
    } catch (e) {
      String(e);
    }
    setIsPending(false);
  };

  if (!pitch.subject) return null;

  return (
    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
        Local Pitch Generator
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Subject
            </label>
            <button
              onClick={() => copyToClipboard(pitch.subject, "subject")}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              {copiedSubject ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Copied!
                </>
              ) : (
                "Copy Subject"
              )}
            </button>
          </div>
          <input
            type="text"
            readOnly
            value={pitch.subject}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Body (Max 200 words)
            </label>
            <button
              onClick={() => copyToClipboard(pitch.body, "body")}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              {copiedBody ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Copied!
                </>
              ) : (
                "Copy Email Body"
              )}
            </button>
          </div>
          <textarea
            readOnly
            value={pitch.body}
            rows={8}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={pitch.mailtoUrl}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Send via Mail Client
          </a>
          <button
            onClick={handleFastTrack}
            disabled={isPending || job.status === "APPLIED"}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors ${
              (isPending || job.status === "APPLIED") ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Copy & Mark as Applied
          </button>
        </div>
      </div>
    </div>
  );
}
