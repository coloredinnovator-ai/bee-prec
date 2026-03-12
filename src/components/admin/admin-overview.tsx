"use client";

import { useEffect, useState } from "react";

import { useFirebaseUser } from "@/hooks/use-firebase-user";

type OverviewPayload = {
  counts: Record<string, number>;
  latestClinic: Array<{ id: string; name: string; helpType: string; createdAt: string | null }>;
  latestReports: Array<{ id: string; title: string; status: string; createdAt: string | null }>;
  latestBackups: Array<{ id: string; status: string; createdAt: string | null; summary: string }>;
  latestAuditEvents: Array<{ id: string; eventType: string; createdAt: string | null; actorType: string }>;
};

export function AdminOverview() {
  const { loading, user } = useFirebaseUser();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/admin/overview", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const payload = (await response.json()) as OverviewPayload & { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Unable to load admin overview.");
          return;
        }

        setData(payload);
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load admin overview.");
      }
    })();
  }, [user]);

  if (loading) {
    return <p className="notice">Checking admin status...</p>;
  }

  if (!user) {
    return (
      <div className="empty-state">
        <h3>Admin access requires sign-in.</h3>
        <p className="muted">Use the admin login route to load moderated queues and the backup ledger.</p>
      </div>
    );
  }

  if (error) {
    return <p className="notice notice--error">{error}</p>;
  }

  if (!data) {
    return <p className="notice">Loading overview...</p>;
  }

  return (
    <div className="stack">
      <div className="stat-grid">
        {Object.entries(data.counts).map(([key, value]) => (
          <article className="card card--soft" key={key}>
            <p className="eyebrow">{key}</p>
            <h3>{value}</h3>
          </article>
        ))}
      </div>
      <div className="queue-grid">
        <section className="card">
          <h3>Latest clinic intakes</h3>
          <ul className="data-list">
            {data.latestClinic.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.helpType}</span>
                <small>{item.createdAt ?? "pending timestamp"}</small>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3>Latest reports</h3>
          <ul className="data-list">
            {data.latestReports.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.status}</span>
                <small>{item.createdAt ?? "pending timestamp"}</small>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3>Backup ledger</h3>
          <ul className="data-list">
            {data.latestBackups.map((item) => (
              <li key={item.id}>
                <strong>{item.status}</strong>
                <span>{item.summary}</span>
                <small>{item.createdAt ?? "pending timestamp"}</small>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3>Recent audit events</h3>
          <ul className="data-list">
            {data.latestAuditEvents.map((item) => (
              <li key={item.id}>
                <strong>{item.eventType}</strong>
                <span>{item.actorType}</span>
                <small>{item.createdAt ?? "pending timestamp"}</small>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
