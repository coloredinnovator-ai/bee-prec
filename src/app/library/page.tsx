import { PageHero } from "@/components/page-hero";
import { libraryResources } from "@/lib/site-data";

export default function LibraryPage() {
  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Reference library"
        title="Keep the learning lane curated instead of burying it inside the homepage."
        description="Wave 1 preserves the highest-value research and legal references while the deeper library catalog and newsletter tooling move to later delivery waves."
      />
      <section className="card-grid">
        {libraryResources.map((item) => (
          <article className="card" key={item.href}>
            <h2>{item.title}</h2>
            <p className="muted">{item.summary}</p>
            <a href={item.href} target="_blank" rel="noreferrer">
              Open resource
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
