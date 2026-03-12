"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useFirebaseUser } from "@/hooks/use-firebase-user";

export function CommunityComposer() {
  const router = useRouter();
  const { loading, user } = useFirebaseUser();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);

    if (!user) {
      setError("Sign in before posting to the community lane.");
      return;
    }

    startTransition(() => {
      void (async () => {
        const token = await user.getIdToken();
        const response = await fetch("/api/community/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title, body })
        });

        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Unable to publish post.");
          return;
        }

        setTitle("");
        setBody("");
        setNotice("Post published.");
        router.refresh();
      })().catch((submitError) => {
        console.error(submitError);
        setError("Unable to publish post.");
      });
    });
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          <span>Topic</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required />
        </label>
        <label className="form-grid__wide">
          <span>What do members need to know?</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} maxLength={5000} required />
        </label>
      </div>
      <div className="action-row">
        <button className="button" type="submit" disabled={isPending || loading}>
          {isPending ? "Publishing..." : "Publish post"}
        </button>
        <span className="muted">{user ? `Posting as ${user.email}` : "Login required for posting"}</span>
      </div>
      {notice ? <p className="notice notice--success">{notice}</p> : null}
      {error ? <p className="notice notice--error">{error}</p> : null}
    </form>
  );
}
