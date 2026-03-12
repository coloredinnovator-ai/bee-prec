import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <p className="eyebrow">BEE COOP</p>
          <h3>Website reset on a tighter operational spine.</h3>
          <p className="muted">
            Public trust, legal intake, and GitHub-visible operating evidence now live in separate lanes instead of one long mixed portal.
          </p>
        </div>
        <div>
          <h4>Routes</h4>
          <ul className="link-list">
            <li>
              <Link href="/clinic">Clinic intake</Link>
            </li>
            <li>
              <Link href="/report-harm">Report harm</Link>
            </li>
            <li>
              <Link href="/community">Community</Link>
            </li>
            <li>
              <Link href="/admin">Admin overview</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Operations</h4>
          <ul className="link-list">
            <li>
              <Link href="/news">Delivery notes</Link>
            </li>
            <li>
              <Link href="/library">Reference library</Link>
            </li>
            <li>
              <a href="https://github.com/coloredinnovator-ai/bee-prec" target="_blank" rel="noreferrer">
                GitHub repository
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
