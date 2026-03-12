import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { getPublicCommunityPosts } from "@/lib/server-data";
import { homepageHighlights, operatingLanes, trustSignals } from "@/lib/site-data";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default async function HomePage() {
  const posts = await getPublicCommunityPosts(3);

  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="BEE COOP reset"
        title="A tighter website for clinic work, harm reporting, and governed community operations."
        description="The homepage is no longer a mixed portal. Public trust routes, member account work, and staff operations now live in separate lanes backed by server-side validation and a GitHub-visible operating ledger."
        actions={[
          { href: "/clinic", label: "Open clinic intake" },
          { href: "/report-harm", label: "Submit report", kind: "ghost" }
        ]}
        aside={
          <div className="stack">
            <p className="eyebrow">Operating spine</p>
            <ul className="metric-list">
              {trustSignals.map((signal) => (
                <li key={signal.label}>
                  <strong>{signal.label}</strong>
                  <span>{signal.value}</span>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <section className="card-grid">
        {homepageHighlights.map((item) => (
          <article className="card" key={item.title}>
            <p className="eyebrow">{item.eyebrow}</p>
            <h2>{item.title}</h2>
            <p className="muted">{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="section-block">
        <div className="section-block__header">
          <div>
            <p className="eyebrow">Primary lanes</p>
            <h2>Separate public, member, and staff work without losing continuity.</h2>
          </div>
          <Link href="/admin" className="button button--ghost">
            View admin shell
          </Link>
        </div>
        <div className="route-grid">
          {operatingLanes.map((lane) => (
            <article className="card route-card" key={lane.href}>
              <h3>{lane.title}</h3>
              <p className="muted">{lane.body}</p>
              <Link href={lane.href}>Open route</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block section-block--accent">
        <div className="section-block__header">
          <div>
            <p className="eyebrow">Community pulse</p>
            <h2>Public-facing community context without exposing the whole moderation surface.</h2>
          </div>
          <Link href="/community" className="button">
            Enter community route
          </Link>
        </div>
        <div className="route-grid">
          {posts.map((post) => (
            <article className="card" key={post.id}>
              <p className="eyebrow">{formatDate(post.createdAt)}</p>
              <h3>{post.title}</h3>
              <p className="muted">{post.body}</p>
              <p className="card__meta">Posted by {post.authorName}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
