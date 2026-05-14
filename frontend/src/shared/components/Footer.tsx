import { Link } from "react-router-dom";
import "./Footer.css";

const COLUMNS = [
  {
    title: "Support",
    links: [
      { label: "Help Centre",           href: "#" },
      { label: "Safety information",    href: "#" },
      { label: "Cancellation options",  href: "#" },
      { label: "Report a concern",      href: "#" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Airbnb.org",            href: "#" },
      { label: "Anti-discrimination",   href: "#" },
      { label: "Invite friends",        href: "#" },
      { label: "Gift cards",            href: "#" },
    ],
  },
  {
    title: "Hosting",
    links: [
      { label: "Try hosting",           href: "/signup" },
      { label: "Host resources",        href: "#" },
      { label: "Community forum",       href: "#" },
      { label: "Responsible hosting",   href: "#" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Newsroom",              href: "#" },
      { label: "New features",          href: "#" },
      { label: "Careers",               href: "#" },
      { label: "Investors",             href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer">
      {/* Link columns */}
      <div className="footer-top">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="footer-col-title">{col.title}</p>
            <ul className="footer-col-links">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? (
                    <Link to={l.href}>{l.label}</Link>
                  ) : (
                    <a href={l.href}>{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span className="footer-copy">
          © {new Date().getFullYear()} Air<span className="footer-brand-b">b</span>nb, Inc.
          &nbsp;·&nbsp; All rights reserved.
        </span>

        <div className="footer-policy">
          <a href="#">Privacy</a>
          <span className="footer-policy-dot" />
          <a href="#">Terms</a>
          <span className="footer-policy-dot" />
          <a href="#">Sitemap</a>
          <span className="footer-policy-dot" />
          <a href="#">Company details</a>
        </div>

        <div className="footer-socials">
          {/* Facebook */}
          <a href="#" className="footer-social-btn" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {/* X / Twitter */}
          <a href="#" className="footer-social-btn" aria-label="X">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          {/* Instagram */}
          <a href="#" className="footer-social-btn" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
