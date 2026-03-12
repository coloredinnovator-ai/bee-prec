import { PageHero } from "@/components/page-hero";
import { newsItems } from "@/lib/site-data";

export default function NewsPage() {
  return (
    <div className="container stack stack--xl">
      <PageHero
        eyebrow="Delivery notes"
        title="News and movement context remain visible, but no longer compete with core intake flows."
        description="This lane stays intentionally lighter in wave 1 while the legal, reporting, and admin surfaces are hardened."
      />
      <section className="card-grid">
        {newsItems.map((item) => (
          <article className="card" key={item.href}>
            <p className="eyebrow">{item.date}</p>
            <h2>{item.title}</h2>
            <a href={item.href} target="_blank" rel="noreferrer">
              Open source
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
