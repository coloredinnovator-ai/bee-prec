import Link from "next/link";

import { primaryNav, secureNav } from "@/lib/site-data";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link className="brand" href="/">
          <span className="brand__mark" aria-hidden="true">
            B
          </span>
          <span>
            <strong>BEE COOP</strong>
            <small>co-op clinic + reporting website</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <nav className="site-nav site-nav--secondary" aria-label="Secure">
          {secureNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
