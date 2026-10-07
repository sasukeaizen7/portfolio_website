import { useEffect, useState } from 'react';

const LINKS = [
  ['about', 'About'],
  ['experience', 'Experience'],
  ['projects', 'Projects'],
  ['skills', 'Skills'],
  ['contact', 'Contact'],
];

const initials = (name) => name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function Nav({ profile }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav${scrolled || open ? ' solid' : ''}`}>
      <div className="container nav-inner">
        <a className="logo" href="#/" onClick={() => setOpen(false)}>
          <span className="logo-mark">{initials(profile.name)}</span>
          <span className="logo-name">{profile.name}</span>
        </a>
        <button className="nav-toggle" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="Sections">
          {LINKS.map(([id, label]) => <a key={id} href={`#/${id}`} onClick={() => setOpen(false)}>{label}</a>)}
          <a className="btn primary small" href="#/contact" onClick={() => setOpen(false)}>Hire me</a>
        </nav>
      </div>
    </header>
  );
}

export function Footer({ profile }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span className="footer-links">
          <a href="#/galaxy">Projects in 3D</a>
          {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
          {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
        </span>
      </div>
    </footer>
  );
}
