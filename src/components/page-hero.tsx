import type { ReactNode } from "react";
import Link from "next/link";

type Action = {
  href: string;
  label: string;
  kind?: "primary" | "ghost";
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: Action[];
  aside?: ReactNode;
};

export function PageHero({ eyebrow, title, description, actions = [], aside }: PageHeroProps) {
  return (
    <section className="hero-panel">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-panel__copy">{description}</p>
        {actions.length > 0 ? (
          <div className="action-row">
            {actions.map((action) => (
              <Link key={action.href} href={action.href} className={`button ${action.kind === "ghost" ? "button--ghost" : ""}`}>
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {aside ? <div className="hero-panel__aside">{aside}</div> : null}
    </section>
  );
}
