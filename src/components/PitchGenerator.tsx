"use client";

import { useState, useEffect, useTransition } from "react";
import { JobRecord } from "../models/ui.model.js";
import { generateOutreachPitch } from "../services/pitch.service.js";
import {
  updateJobStatusAction,
  sendOutreachEmailAction,
} from "../app/actions.js";

export default function PitchGenerator({
  job,
  onStatusChange,
}: {
  job: JobRecord;
  onStatusChange: (status: string) => void;
}) {
  const [pitch, setPitch] = useState({ subject: "", body: "", mailtoUrl: "" });
  const [recipientEmail, setRecipientEmail] = useState("");
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLocalPending, setIsLocalPending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (job) {
      setPitch(generateOutreachPitch(job));
      setStatusMsg(null);
      setRecipientEmail("");
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
    setIsLocalPending(true);
    try {
      await updateJobStatusAction(job.hashId, "APPLIED");
      onStatusChange("APPLIED");
      setStatusMsg({ type: "success", text: "Status updated to APPLIED" });
    } catch (e) {
      String(e);
      setStatusMsg({ type: "error", text: "Failed to update status" });
    }
    setIsLocalPending(false);
  };

  const handleSendGmail = () => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await sendOutreachEmailAction(
        job.hashId,
        recipientEmail,
        pitch.subject,
        pitch.body.replace(/\n/g, "<br>"),
      );
      if (res.success) {
        onStatusChange("APPLIED");
        setStatusMsg({
          type: "success",
          text: "Email sent successfully! Status updated to APPLIED.",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res.error || "Failed to send email.",
        });
      }
    });
  };

  if (!pitch.subject) return null;

  const isApplied = job.status === "APPLIED";
  const disableActions = isPending || isLocalPending || isApplied;

  return (
    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
        Local Pitch Generator
      </h3>

      {statusMsg && (
        <div
          className={`mb-4 p-3 rounded-md text-sm font-medium ${
            statusMsg.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            Destinataire / Recruiter Email
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="recruteur@entreprise.com"
            disabled={disableActions}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

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
                  <svg
                    className="w-3 h-3"
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
                  <svg
                    className="w-3 h-3"
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

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
          <button
            onClick={handleSendGmail}
            disabled={disableActions || !recipientEmail}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors ${
              disableActions || !recipientEmail
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isPending ? "Sending..." : "Envoyer via Gmail (Automatique)"}
          </button>
          <a
            href={pitch.mailtoUrl}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Send via Mail Client
          </a>
          <button
            onClick={handleFastTrack}
            disabled={disableActions}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors ${
              disableActions ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Copy & Mark as Applied
          </button>
        </div>
      </div>
    </div>
  );
}
