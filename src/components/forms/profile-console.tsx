"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useFirebaseUser } from "@/hooks/use-firebase-user";
import { getClientAuth } from "@/lib/firebase/client";
import { splitFocusAreas } from "@/lib/validators";

type ProfilePayload = {
  displayName: string;
  handle: string;
  organization: string;
  location: string;
  website: string;
  bio: string;
  focusAreas: string;
  visibility: "members" | "public";
  offlineAccessRequested: boolean;
  matchingOptIn: boolean;
};

const emptyProfile: ProfilePayload = {
  displayName: "",
  handle: "",
  organization: "",
  location: "",
  website: "",
  bio: "",
  focusAreas: "",
  visibility: "members",
  offlineAccessRequested: false,
  matchingOptIn: false
};

export function ProfileConsole() {
  const router = useRouter();
  const { loading, user } = useFirebaseUser();
  const [profile, setProfile] = useState<ProfilePayload>(emptyProfile);
  const [role, setRole] = useState<string>("member");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user) {
      return;
    }

    void (async () => {
      const token = await user.getIdToken();
      const response = await fetch("/api/account/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = (await response.json()) as {
        error?: string;
        profile?: {
          displayName?: string;
          handle?: string;
          organization?: string;
          location?: string;
          website?: string;
          bio?: string;
          focusAreas?: string[];
          visibility?: "members" | "public";
          offlineAccessRequested?: boolean;
          matchingOptIn?: boolean;
        };
        user?: {
          role?: string;
        };
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to load profile.");
        return;
      }

      setRole(payload.user?.role ?? "member");
      setProfile({
        displayName: payload.profile?.displayName ?? user.displayName ?? "",
        handle: payload.profile?.handle ?? "",
        organization: payload.profile?.organization ?? "",
        location: payload.profile?.location ?? "",
        website: payload.profile?.website ?? "",
        bio: payload.profile?.bio ?? "",
        focusAreas: (payload.profile?.focusAreas ?? []).join(", "),
        visibility: payload.profile?.visibility ?? "members",
        offlineAccessRequested: Boolean(payload.profile?.offlineAccessRequested),
        matchingOptIn: Boolean(payload.profile?.matchingOptIn)
      });
    })().catch((loadError) => {
      console.error(loadError);
      setError("Unable to load profile.");
    });
  }, [user]);

  function update<K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!user) {
      setError("Sign in before saving your profile.");
      return;
    }

    startTransition(() => {
      void (async () => {
        const token = await user.getIdToken();
        const response = await fetch("/api/account/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...profile,
            focusAreas: splitFocusAreas(profile.focusAreas)
          })
        });

        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Unable to save profile.");
          return;
        }

        setNotice("Profile saved.");
        router.refresh();
      })().catch((saveError) => {
        console.error(saveError);
        setError("Unable to save profile.");
      });
    });
  }

  async function signOutCurrentUser() {
    await getClientAuth().signOut();
    router.push("/account/login");
    router.refresh();
  }

  if (loading) {
    return <p className="notice">Checking account status...</p>;
  }

  if (!user) {
    return (
      <div className="empty-state">
        <h3>You are not signed in.</h3>
        <p className="muted">Use the member login route to access the profile baseline and secure flows.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card card--soft">
        <p className="eyebrow">Account baseline</p>
        <h2>{user.email}</h2>
        <p className="muted">Current role: {role}</p>
      </div>
      <form className="form-card" onSubmit={saveProfile}>
        <div className="form-grid">
          <label>
            <span>Display name</span>
            <input value={profile.displayName} onChange={(event) => update("displayName", event.target.value)} maxLength={80} required />
          </label>
          <label>
            <span>Handle</span>
            <input value={profile.handle} onChange={(event) => update("handle", event.target.value)} maxLength={40} />
          </label>
          <label>
            <span>Organization</span>
            <input value={profile.organization} onChange={(event) => update("organization", event.target.value)} maxLength={120} />
          </label>
          <label>
            <span>Location</span>
            <input value={profile.location} onChange={(event) => update("location", event.target.value)} maxLength={80} />
          </label>
          <label>
            <span>Website</span>
            <input value={profile.website} onChange={(event) => update("website", event.target.value)} maxLength={160} />
          </label>
          <label>
            <span>Visibility</span>
            <select value={profile.visibility} onChange={(event) => update("visibility", event.target.value as "members" | "public")}>
              <option value="members">Members only</option>
              <option value="public">Public</option>
            </select>
          </label>
          <label className="form-grid__wide">
            <span>Bio</span>
            <textarea value={profile.bio} onChange={(event) => update("bio", event.target.value)} rows={5} maxLength={400} />
          </label>
          <label className="form-grid__wide">
            <span>Focus areas</span>
            <input
              value={profile.focusAreas}
              onChange={(event) => update("focusAreas", event.target.value)}
              placeholder="governance, housing, legal, member capital"
            />
          </label>
        </div>
        <div className="checkbox-grid">
          <label className="checkbox">
            <input
              checked={profile.offlineAccessRequested}
              onChange={(event) => update("offlineAccessRequested", event.target.checked)}
              type="checkbox"
            />
            <span>Request offline support access</span>
          </label>
          <label className="checkbox">
            <input checked={profile.matchingOptIn} onChange={(event) => update("matchingOptIn", event.target.checked)} type="checkbox" />
            <span>Opt into member matching</span>
          </label>
        </div>
        <div className="action-row">
          <button className="button" disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save profile"}
          </button>
          <button className="button button--ghost" type="button" onClick={() => void signOutCurrentUser()}>
            Sign out
          </button>
        </div>
        {notice ? <p className="notice notice--success">{notice}</p> : null}
        {error ? <p className="notice notice--error">{error}</p> : null}
      </form>
    </div>
  );
}
