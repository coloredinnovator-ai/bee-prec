"use client";

import { useState, useTransition } from "react";

const allowedCategories = [
  { value: "fraud", label: "Fraud" },
  { value: "harassment", label: "Harassment" },
  { value: "discrimination", label: "Discrimination" },
  { value: "stolenBusinessData", label: "Stolen business data" },
  { value: "other", label: "Other" }
];

export function ReportHarmForm() {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/report-harm", {
          method: "POST",
          body: formData
        });

        const payload = (await response.json()) as { id?: string; error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Unable to submit report.");
          return;
        }

        event.currentTarget.reset();
        setNotice(`Report received. Reference: ${payload.id}`);
      })().catch((submitError) => {
        console.error(submitError);
        setError("Unable to submit report.");
      });
    });
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          <span>Report title</span>
          <input name="title" required maxLength={120} />
        </label>
        <label>
          <span>Category</span>
          <select name="category" defaultValue="fraud">
            {allowedCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select name="priority" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          <span>Date and time</span>
          <input name="occurredAt" type="datetime-local" required />
        </label>
        <label>
          <span>Business or target</span>
          <input name="businessName" maxLength={80} />
        </label>
        <label>
          <span>Location</span>
          <input name="location" maxLength={80} />
        </label>
        <label>
          <span>Reporter alias</span>
          <input name="reporterAlias" maxLength={80} placeholder="Optional if not anonymous" />
        </label>
        <label>
          <span>Reporter email</span>
          <input name="reporterEmail" type="email" maxLength={160} />
        </label>
        <label className="form-grid__wide">
          <span>What happened</span>
          <textarea name="body" rows={7} required maxLength={5000} />
        </label>
        <label className="form-grid__wide">
          <span>Evidence upload</span>
          <input name="attachment" type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv" />
        </label>
      </div>
      <label className="checkbox">
        <input name="anonymous" type="checkbox" defaultChecked />
        <span>Keep this intake anonymous in staff views where policy allows.</span>
      </label>
      <div className="action-row">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit report"}
        </button>
        <span className="muted">Attachment handling is routed through the server, not direct browser Storage writes.</span>
      </div>
      {notice ? <p className="notice notice--success">{notice}</p> : null}
      {error ? <p className="notice notice--error">{error}</p> : null}
    </form>
  );
}
