import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { paragraphs, sortProjects, useSite } from '../lib/useSite';
import { Footer, Nav } from './Chrome';
import ProjectCard from './ProjectCard';

const HeroScene = lazy(() => import('./HeroScene'));

// If the 3D scene fails (no GPU access, lost context, chunk failed to load), show the CSS galaxy instead.
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// A CSS-only galaxy for browsers without WebGL 2: same look, no interaction.
function GalaxyFallback() {
  return (
    <div className="galaxy-fallback" aria-hidden="true">
      <div className="gf-disc" />
      <div className="gf-core" />
      {[0, 1, 2, 3, 4].map((i) => <span key={i} className={`gf-orbit gf-orbit-${i}`}><i /></span>)}
    </div>
  );
}

function hasWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

export default function Home({ section }) {
  const { data, error } = useSite();

  useEffect(() => {
    if (data) document.title = `${data.profile.name} · ${data.profile.title || 'Portfolio'}`;
  }, [data]);

  // #/about, #/projects… scroll to that section once the content is there.
  useEffect(() => {
    if (!data) return;
    const el = section && document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (!section) window.scrollTo({ top: 0 });
  }, [section, data]);

  if (error) return <div className="center-note">Couldn’t load the portfolio: {error}</div>;
  if (!data) return <div className="center-note"><span className="loader" /></div>;

  const { profile, projects, experiences, skills } = data;
  const work = experiences.filter((e) => e.kind === 'work');
  const education = experiences.filter((e) => e.kind === 'education');
  const certifications = experiences.filter((e) => e.kind === 'certification');

  return (
    <div className="site">
      <Nav profile={profile} />
      <Hero profile={profile} projects={projects} />
      <About profile={profile} />
      {work.length > 0 && <Experience items={work} />}
      <Projects projects={projects} />
      {skills.length > 0 && <Skills groups={skills} />}
      {(education.length > 0 || certifications.length > 0) && <Education education={education} certifications={certifications} />}
      <Contact profile={profile} />
      <Footer profile={profile} />
    </div>
  );
}

function Hero({ profile, projects }) {
  const ref = useRef();
  const webgl = useMemo(hasWebGL, []);
  const [visible, setVisible] = useState(true);
  const featured = useMemo(() => sortProjects(projects).filter((p) => p.featured).slice(0, 6), [projects]);

  // Stop animating the 3D scene once the hero is scrolled out of view.
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section className="hero" ref={ref} id="top">
      {webgl ? (
        <SceneBoundary fallback={<GalaxyFallback />}>
          <Suspense fallback={<GalaxyFallback />}>
            <HeroScene projects={featured} active={visible} onOpen={(slug) => { window.location.hash = `/projects/${slug}`; }} />
          </Suspense>
        </SceneBoundary>
      ) : <GalaxyFallback />}
      <div className="hero-fade" />
      <div className="container hero-content">
        {profile.availability && <p className="availability"><span className="pulse" />{profile.availability}</p>}
        <h1>
          <span className="hero-name">{profile.name}</span>
          {profile.title && <span className="hero-title">{profile.title}</span>}
        </h1>
        <p className="hero-pitch">{profile.headline}</p>
        <div className="hero-actions">
          <a className="btn primary lg" href="#/projects">View my work</a>
          <a className="btn lg" href="#/contact">Get in touch</a>
          {profile.cvUrl && <a className="btn ghost lg" href={profile.cvUrl} download>Download CV</a>}
        </div>
        {webgl && <p className="hero-hint">The bright worlds in the galaxy are my featured projects. Click one to open it.</p>}
      </div>
    </section>
  );
}

function SectionHead({ kicker, title, children }) {
  return (
    <header className="section-head">
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      {children && <p className="section-lead">{children}</p>}
    </header>
  );
}

function About({ profile }) {
  return (
    <section className="section" id="about">
      <div className="container about">
        <div className="about-text">
          <SectionHead kicker="About" title="Machine learning meets data engineering" />
          {paragraphs(profile.bio).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <aside className="about-card">
          {profile.photoUrl && <img className="avatar" src={profile.photoUrl} alt={profile.name} />}
          <dl>
            {profile.location && <><dt>Based in</dt><dd>{profile.location}</dd></>}
            {profile.availability && <><dt>Availability</dt><dd>{profile.availability}</dd></>}
            {profile.languages?.length > 0 && <><dt>Languages</dt><dd>{profile.languages.join(' · ')}</dd></>}
          </dl>
          <SocialLinks profile={profile} />
        </aside>
      </div>
    </section>
  );
}

function dates(e) {
  return [e.startLabel, e.endLabel].filter(Boolean).join(' – ');
}

function Experience({ items }) {
  return (
    <section className="section alt" id="experience">
      <div className="container">
        <SectionHead kicker="Experience" title="Where I’ve built things" />
        <ol className="timeline">
          {items.map((e) => (
            <li key={e.id} className="timeline-item">
              <div className="timeline-when">{dates(e)}</div>
              <div className="timeline-body">
                <h3>{e.title}</h3>
                <p className="org">{e.organization}{e.location && <span className="muted"> · {e.location}</span>}</p>
                {e.summary && <p>{e.summary}</p>}
                {e.highlights.length > 0 && <ul className="bullets">{e.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>}
                {e.tags.length > 0 && <div className="tags">{e.tags.map((t) => <span key={t}>{t}</span>)}</div>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Projects({ projects }) {
  const sorted = useMemo(() => sortProjects(projects), [projects]);
  const categories = useMemo(() => [...new Set(sorted.map((p) => p.category))], [sorted]);
  const [category, setCategory] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const filtered = category ? sorted.filter((p) => p.category === category) : sorted;
  const shown = showAll || category ? filtered : filtered.filter((p) => p.featured);

  return (
    <section className="section" id="projects">
      <div className="container">
        <SectionHead kicker="Projects" title="Selected work">
          Computer vision, OCR and data platforms: what I built, how, and what came out of it.
        </SectionHead>
        <div className="project-toolbar">
          <div className="filters" role="group" aria-label="Filter by category">
            <button className={!category ? 'chip on' : 'chip'} onClick={() => setCategory(null)}>Featured</button>
            {categories.map((c) => (
              <button key={c} className={category === c ? 'chip on' : 'chip'} onClick={() => setCategory(c)}>
                {c} <span className="chip-count">{sorted.filter((p) => p.category === c).length}</span>
              </button>
            ))}
          </div>
          <a className="btn ghost" href="#/galaxy">Explore all in 3D →</a>
        </div>
        <div className="project-grid">
          {shown.map((p) => <ProjectCard key={p.slug} project={p} />)}
        </div>
        {!category && !showAll && sorted.length > shown.length && (
          <div className="center"><button className="btn" onClick={() => setShowAll(true)}>Show all {sorted.length} projects</button></div>
        )}
      </div>
    </section>
  );
}

function Skills({ groups }) {
  return (
    <section className="section alt" id="skills">
      <div className="container">
        <SectionHead kicker="Skills" title="Tools I work with" />
        <div className="skill-grid">
          {groups.map((g) => (
            <div key={g.id} className="skill-card">
              <h3>{g.name}</h3>
              <div className="tags">{g.items.map((s) => <span key={s}>{s}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Education({ education, certifications }) {
  return (
    <section className="section" id="education">
      <div className="container">
        <SectionHead kicker="Education" title="Education & certifications" />
        <div className="edu-grid">
          {education.length > 0 && (
            <div>
              {education.map((e) => (
                <article key={e.id} className="edu-card">
                  <p className="timeline-when">{dates(e)}</p>
                  <h3>{e.title}</h3>
                  <p className="org">{e.organization}{e.location && <span className="muted"> · {e.location}</span>}</p>
                  {e.summary && <p>{e.summary}</p>}
                  {e.highlights.length > 0 && <ul className="bullets">{e.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>}
                </article>
              ))}
            </div>
          )}
          {certifications.length > 0 && (
            <ul className="cert-list">
              {certifications.map((c) => (
                <li key={c.id}>
                  <h3>{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.title}</a> : c.title}</h3>
                  <p className="org">{c.organization}{dates(c) && <span className="muted"> · {dates(c)}</span>}</p>
                  {c.summary && <p className="muted">{c.summary}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Contact({ profile }) {
  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="contact-card">
          <p className="kicker">Contact</p>
          <h2>Have a project in mind?</h2>
          <p className="section-lead">
            {profile.availability || 'Available for new projects'}. Tell me about your data or computer-vision challenge and I’ll get back to you quickly.
          </p>
          <div className="hero-actions center">
            {profile.contactEmail && <a className="btn primary lg" href={`mailto:${profile.contactEmail}`}>Email me</a>}
            {profile.linkedinUrl && <a className="btn lg" href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
            {profile.cvUrl && <a className="btn ghost lg" href={profile.cvUrl} download>Download CV</a>}
          </div>
          {profile.contactEmail && <p className="muted small">{profile.contactEmail}</p>}
        </div>
      </div>
    </section>
  );
}

export function SocialLinks({ profile }) {
  return (
    <div className="social">
      {profile.contactEmail && <a href={`mailto:${profile.contactEmail}`}>Email</a>}
      {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
      {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
      {profile.cvUrl && <a href={profile.cvUrl} download>CV</a>}
    </div>
  );
}
