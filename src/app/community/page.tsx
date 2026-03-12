import { CommunityComposer } from "@/components/forms/community-composer";
import { PageHero } from "@/components/page-hero";
import { getPublicCommunityPosts } from "@/lib/server-data";
import { communityGuidelines } from "@/lib/site-data";

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

export default async function CommunityPage() {
  const posts = await getPublicCommunityPosts(8);

  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Member community"
        title="Public framing on the outside, moderated member conversation on the inside."
        description="The community lane keeps trust copy and live discussion separate. Reading can remain broad, but posting and moderation now sit behind authenticated server routes."
        actions={[
          { href: "/account/login", label: "Sign in to post" },
          { href: "/admin", label: "Open moderation shell", kind: "ghost" }
        ]}
        aside={
          <div className="card card--soft">
            <h3>Guidelines</h3>
            <ul className="bullet-list">
              {communityGuidelines.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        }
      />
      <CommunityComposer />
      <section className="card-grid">
        {posts.map((post) => (
          <article className="card" key={post.id}>
            <p className="eyebrow">{formatDate(post.createdAt)}</p>
            <h3>{post.title}</h3>
            <p className="muted">{post.body}</p>
            <p className="card__meta">{post.authorName}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
