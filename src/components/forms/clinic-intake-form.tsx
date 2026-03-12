"use client";

import { useState, useTransition } from "react";

const initialState = {
  name: "",
  email: "",
  organization: "",
  location: "",
  stage: "idea",
  helpType: "legal-coop-setup",
  preferredContact: "",
  description: "",
  consent: false
};

export function ClinicIntakeForm() {
  const [form, setForm] = useState(initialState);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/clinic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        });

        const payload = (await response.json()) as { id?: string; error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Unable to submit clinic intake.");
          return;
        }

        setNotice(`Clinic intake received. Reference: ${payload.id}`);
        setForm(initialState);
      })().catch((submitError) => {
        console.error(submitError);
        setError("Unable to submit clinic intake.");
      });
    });
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input value={form.name} onChange={(event) => update("name", event.target.value)} required maxLength={80} />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required maxLength={160} />
        </label>
        <label>
          <span>Organization</span>
          <input value={form.organization} onChange={(event) => update("organization", event.target.value)} maxLength={120} />
        </label>
        <label>
          <span>Location</span>
          <input value={form.location} onChange={(event) => update("location", event.target.value)} maxLength={120} />
        </label>
        <label>
          <span>Stage</span>
          <select value={form.stage} onChange={(event) => update("stage", event.target.value)}>
            <option value="idea">Idea</option>
            <option value="planning">Planning</option>
            <option value="pilot">Pilot</option>
            <option value="ready-to-launch">Ready to launch</option>
          </select>
        </label>
        <label>
          <span>Help needed</span>
          <select value={form.helpType} onChange={(event) => update("helpType", event.target.value)}>
            <option value="legal-coop-setup">Legal co-op setup</option>
            <option value="governance">Governance</option>
            <option value="funding">Funding</option>
            <option value="member-structure">Member structure</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="form-grid__wide">
          <span>Preferred contact</span>
          <input
            value={form.preferredContact}
            onChange={(event) => update("preferredContact", event.target.value)}
            maxLength={120}
            placeholder="Email, phone, or member handle"
          />
        </label>
        <label className="form-grid__wide">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={6}
            required
            maxLength={1200}
          />
        </label>
      </div>
      <label className="checkbox">
        <input checked={form.consent} onChange={(event) => update("consent", event.target.checked)} type="checkbox" />
        <span>I consent to follow-up contact about this clinic request.</span>
      </label>
      <div className="action-row">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Submit intake"}
        </button>
        <span className="muted">Handled by a server route with audit logging.</span>
      </div>
      {notice ? <p className="notice notice--success">{notice}</p> : null}
      {error ? <p className="notice notice--error">{error}</p> : null}
    </form>
  );
}
