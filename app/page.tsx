'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  Compass,
  FileWarning,
  LibraryBig,
  Map,
  MessageSquare,
  Scale,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { HeavyMetalBee } from '@/components/HeavyMetalBee';

const proofSignals = [
  {
    label: 'Surface',
    title: 'Public front door first',
    body: 'A cleaner product narrative sits above the portal instead of forcing visitors straight into operational tabs.',
  },
  {
    label: 'Governance',
    title: 'Scoped member workflows',
    body: 'Profiles, consultations, incident reports, and community publishing stay inside authenticated, role-aware lanes.',
  },
  {
    label: 'Security',
    title: 'Hardened assistive AI',
    body: 'Document analysis and legal-assist routes now require server-side controls instead of exposing weak browser-side flows.',
  },
  {
    label: 'Release',
    title: 'GitHub-visible delivery spine',
    body: 'Rules, hosting, checks, and parity now move together through auditable repository workflows.',
  },
];

const operatingLanes = [
  {
    icon: Building2,
    title: 'Public trust lane',
    body: 'Explain the product clearly, establish credibility, and route visitors into the right surface without exposing internal complexity.',
  },
  {
    icon: Users,
    title: 'Member workspace',
    body: 'Profiles, directory search, introductions, consultations, incident history, and community participation stay sign-in first.',
  },
  {
    icon: Briefcase,
    title: 'Attorney + admin review',
    body: 'Triage private requests, assign counsel, moderate content, and manage identity review with clearer boundaries.',
  },
  {
    icon: Bot,
    title: 'Shared intelligence layer',
    body: 'Research library, co-op news, Nexus AI, and document analysis support member work without becoming the whole homepage.',
  },
];

const productModules = [
  {
    icon: Scale,
    title: 'Clinic and legal intake',
    body: 'Structured requests for co-op formation, governance repair, funding questions, and attorney-ready summaries.',
    href: '/legal',
  },
  {
    icon: FileWarning,
    title: 'Protected reporting',
    body: 'Secure incident intake with scoped reviewer access, evidence uploads, and moderation-aware handling.',
    href: '/profile',
  },
  {
    icon: MessageSquare,
    title: 'Moderated community',
    body: 'Public-approved posts on the board, member comments, and moderator review instead of an uncontrolled feed.',
    href: '/forum',
  },
  {
    icon: LibraryBig,
    title: 'Library, resources, and news',
    body: 'Research, movement context, and shared materials read as one knowledge system instead of scattered tabs.',
    href: '/resources',
  },
  {
    icon: Sparkles,
    title: 'Nexus AI workflows',
    body: 'Use assisted analysis and legal summarization as scoped support tools, not as the public face of the product.',
    href: '/nexus-ai',
  },
  {
    icon: Map,
    title: 'Network visibility',
    body: 'Map, directory, and profile surfaces help members see each other without compromising privacy boundaries.',
    href: '/map',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(234,179,8,0.14),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(34,197,94,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_45%)] dark:bg-[radial-gradient(circle_at_12%_18%,rgba(234,179,8,0.12),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(34,197,94,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-400">
              <Compass className="h-3.5 w-3.5" />
              Co-op clinic + governed member operations
            </div>

            <h1 className="max-w-4xl font-display text-5xl font-black tracking-[-0.06em] text-stone-950 dark:text-zinc-50 sm:text-6xl lg:text-8xl">
              Serious infrastructure for cooperative legal support, community safety, and shared execution.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-600 dark:text-zinc-400">
              BEE COOP is no longer a loose collection of screens. It is a single operating surface for clinic intake,
              protected reporting, member records, moderated community work, shared resources, and AI-assisted legal preparation.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/legal"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-stone-950 shadow-[0_20px_50px_rgba(245,158,11,0.25)] transition hover:bg-amber-400"
              >
                Open legal intake
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/forum"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/75 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-stone-900 transition hover:border-amber-400 hover:text-amber-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-100 dark:hover:border-amber-500"
              >
                Enter community
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {proofSignals.slice(0, 3).map((signal) => (
                <div
                  key={signal.title}
                  className="rounded-3xl border border-stone-200/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">{signal.label}</p>
                  <h2 className="mt-3 text-lg font-bold tracking-tight text-stone-950 dark:text-zinc-100">{signal.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">{signal.body}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="relative"
          >
            <div className="absolute inset-8 rounded-full bg-amber-500/20 blur-[100px]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">Live product shell</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-950 dark:text-zinc-100">Public clarity with internal depth</h2>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Merged lane
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {['Public', 'Member', 'Attorney', 'Admin'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-stone-200 bg-stone-100/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-stone-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(255,255,255,0.92))] p-4 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(24,24,27,0.92))] md:col-span-2">
                  <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                    <div className="mx-auto w-full max-w-[180px]">
                      <HeavyMetalBee className="w-full" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-stone-950 dark:text-zinc-100">The floating AI Studio feel, kept inside a real product frame</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">
                        The visual shell now carries the same motion and confidence as the archived App Hosting lane, but the content is disciplined around the actual product.
                      </p>
                    </div>
                  </div>
                </div>

                {operatingLanes.map((lane) => (
                  <div
                    key={lane.title}
                    className="rounded-[1.5rem] border border-stone-200 bg-stone-50/95 p-5 dark:border-zinc-800 dark:bg-zinc-950/70"
                  >
                    <lane.icon className="h-5 w-5 text-amber-500" />
                    <h3 className="mt-4 text-base font-black tracking-tight text-stone-950 dark:text-zinc-100">{lane.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">{lane.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-stone-200/80 bg-white/70 px-4 py-16 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/30 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">Product lanes</p>
              <h2 className="mt-2 max-w-3xl font-display text-4xl font-black tracking-[-0.05em] text-stone-950 dark:text-zinc-100">
                Everything stays in the app. It just reads like one platform now.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-stone-600 dark:text-zinc-400">
              The homepage should sell the system. The portal should do the work. This version separates those jobs instead of mixing them.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {proofSignals.map((signal) => (
              <div
                key={signal.title}
                className="rounded-[1.75rem] border border-stone-200 bg-stone-50/90 p-6 dark:border-zinc-800 dark:bg-zinc-950/70"
              >
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">{signal.label}</p>
                <h3 className="mt-3 text-xl font-black tracking-tight text-stone-950 dark:text-zinc-100">{signal.title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-zinc-400">{signal.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">Feature map</p>
            <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.05em] text-stone-950 dark:text-zinc-100 md:text-5xl">
              The product surfaces are real. The homepage now proves that instead of hiding it.
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-600 dark:text-zinc-400">
              Every card below points to a working route. The goal is not to invent new features. It is to make the existing system legible, credible, and ready for external review.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {productModules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <Link
                  href={module.href}
                  className="group block h-full rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-amber-400/60 dark:border-zinc-800 dark:bg-zinc-900/85"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-stone-950 dark:text-amber-400">
                    <module.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight text-stone-950 dark:text-zinc-100">{module.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-zinc-400">{module.body}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                    Open route
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
