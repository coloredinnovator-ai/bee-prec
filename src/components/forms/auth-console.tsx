"use client";

import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getClientAuth } from "@/lib/firebase/client";
import { roleOptions } from "@/lib/site-data";

type AuthConsoleProps = {
  adminMode?: boolean;
};

const lawyerCodes = new Set(["BEEPREC-LAWYER", "BEEPREC-LAWYER-2026"]);

export function AuthConsole({ adminMode = false }: AuthConsoleProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [requestedRole, setRequestedRole] = useState("member");
  const [lawyerCode, setLawyerCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function syncUserRecord() {
    return (async () => {
      const auth = getClientAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No authenticated user found.");
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/account/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: displayName || user.displayName || user.email?.split("@")[0] || "BEE member",
          requestedRole,
          lawyerCode: lawyerCode || undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to sync account.");
      }
    })();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);

    startTransition(() => {
      void (async () => {
        const auth = getClientAuth();

        if (mode === "register") {
          if (requestedRole === "pendingLawyer" && lawyerCode && !lawyerCodes.has(lawyerCode)) {
            throw new Error("The lawyer code was not accepted.");
          }

          const credentials = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(credentials.user, {
            displayName
          });
          await syncUserRecord();
          setNotice("Account created.");
          router.push(adminMode ? "/admin" : "/account/profile");
          router.refresh();
          return;
        }

        await signInWithEmailAndPassword(auth, email, password);
        router.push(adminMode ? "/admin" : "/account/profile");
        router.refresh();
      })().catch((submitError) => {
        console.error(submitError);
        setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
      });
    });
  }

  function sendReset() {
    setNotice(null);
    setError(null);

    startTransition(() => {
      void sendPasswordResetEmail(getClientAuth(), email)
        .then(() => setNotice("Password reset email sent."))
        .catch((resetError) => {
          console.error(resetError);
          setError("Unable to send reset email.");
        });
    });
  }

  return (
    <div className="stack">
      <div className="mode-toggle" role="tablist" aria-label="Authentication mode">
        <button className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")} type="button">
          Login
        </button>
        <button className={mode === "register" ? "is-active" : ""} onClick={() => setMode("register")} type="button">
          Register
        </button>
      </div>
      <form className="form-card" onSubmit={onSubmit}>
        <div className="form-grid">
          {mode === "register" ? (
            <label>
              <span>Display name</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </label>
          {mode === "register" ? (
            <>
              <label>
                <span>Requested role</span>
                <select value={requestedRole} onChange={(event) => setRequestedRole(event.target.value)}>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Lawyer code</span>
                <input value={lawyerCode} onChange={(event) => setLawyerCode(event.target.value)} placeholder="Optional reviewer code" />
              </label>
            </>
          ) : null}
        </div>
        <div className="action-row">
          <button className="button" disabled={isPending} type="submit">
            {isPending ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
          </button>
          <button className="button button--ghost" type="button" onClick={sendReset} disabled={isPending || !email}>
            Reset password
          </button>
        </div>
        {notice ? <p className="notice notice--success">{notice}</p> : null}
        {error ? <p className="notice notice--error">{error}</p> : null}
      </form>
    </div>
  );
}
