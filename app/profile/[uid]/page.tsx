'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Navbar } from '@/components/Navbar';
import { MapPin, User, Building, Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type PublicProfile = {
  uid?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  role?: string;
  location?: string;
  organization?: string;
  focusAreas?: string[];
  visibility?: 'members' | 'public';
};

export default function PublicProfilePage() {
  const params = useParams<{ uid: string }>();
  const uid = params?.uid;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const profileSnap = await getDoc(doc(db, 'profiles', uid));

        if (!profileSnap.exists() || profileSnap.data().visibility !== 'public') {
          setProfile(null);
          return;
        }

        const publicProfile = {
          uid,
          ...profileSnap.data(),
        } as PublicProfile;

        setProfile(publicProfile);
      } catch (error) {
        console.error('Failed to load public profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [uid]);

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center transition-colors duration-300">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors duration-300">
        <Navbar />
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 text-center">
          <User className="mb-6 h-16 w-16 text-stone-300 dark:text-zinc-700" />
          <h1 className="mb-4 text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-zinc-100">
            Public Profile Not Found
          </h1>
          <p className="mb-8 max-w-md text-stone-600 dark:text-zinc-400">
            This member profile is not available yet or is no longer shared publicly.
          </p>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-bold uppercase tracking-tight text-zinc-950 transition-colors hover:bg-amber-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Map
          </Link>
        </div>
      </main>
    );
  }

  const displayName = profile.displayName || 'B-PREC Member';
  const avatar = profile.avatarUrl;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-300">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/map"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500 transition-colors hover:text-amber-600 dark:text-zinc-500 dark:hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Map
        </Link>

        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-amber-500 bg-stone-100 dark:bg-zinc-800">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={displayName}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <User className="h-12 w-12 text-stone-400 dark:text-zinc-600" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black uppercase tracking-tighter">
                  {displayName}
                </h1>
                {profile.role && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                    {profile.role}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-stone-500 dark:text-zinc-400">
                {profile.organization && (
                  <span className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {profile.organization}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.role && (
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {profile.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-500">
                About
              </h2>
              <p className="leading-relaxed text-stone-700 dark:text-zinc-300">
                {profile.bio || 'This member has not added a public biography yet.'}
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-500">
                Focus Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.focusAreas?.length ? (
                  profile.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-stone-600 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-stone-500 dark:text-zinc-400">
                    No focus areas listed.
                  </span>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
