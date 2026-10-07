import { useEffect, useMemo } from 'react';
import { paragraphs, sortProjects, useSite } from '../lib/useSite';
import { Footer, Nav } from './Chrome';
import ProjectCard from './ProjectCard';

export default function ProjectPage({ slug }) {
  const { data, error } = useSite();
  const sorted = useMemo(() => (data ? sortProjects(data.projects) : []), [data]);
  const index = sorted.findIndex((p) => p.slug === slug);
  const project = sorted[index];

  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);
  useEffect(() => {
    if (data) document.title = project ? `${project.title} · ${data.profile.name}` : `Not found · ${data.profile.name}`;
  }, [project, data]);

  if (error) return <div className="center-note">Couldn’t load the project: {error}</div>;
  if (!data) return <div className="center-note"><span className="loader" /></div>;
  if (!project) {
    return (
      <div className="center-note">
        <p>This project doesn’t exist (or isn’t published).</p>
        <a className="btn" href="#/projects">See all projects</a>
      </div>
    );
  }

  const related = sorted.filter((p) => p.category === project.category && p.slug !== slug).slice(0, 3);
  const next = sorted[(index + 1) % sorted.length];

  return (
    <div className="site">
      <Nav profile={data.profile} />
      <article className="case" style={{ '--planet': project.color }}>
        <header className="case-hero">
          <div className="container narrow">
            <a className="back" href="#/projects">← All projects</a>
            <p className="kicker">{project.category}{project.period && ` · ${project.period}`}</p>
            <h1>{project.title}</h1>
            <p className="case-summary">{project.summary}</p>
            {project.tags.length > 0 && <div className="tags">{project.tags.map((t) => <span key={t}>{t}</span>)}</div>}
            <div className="hero-actions">
              {project.repoUrl && <a className="btn primary" href={project.repoUrl} target="_blank" rel="noopener noreferrer">View the code</a>}
              {project.demoUrl && <a className="btn" href={project.demoUrl} target="_blank" rel="noopener noreferrer">Live demo</a>}
              <a className="btn ghost" href={`#/galaxy/${project.slug}`}>See it in 3D</a>
            </div>
          </div>
        </header>

        <div className="container narrow case-body">
          {project.imageUrl && <img className="case-image" src={project.imageUrl} alt="" />}
          {paragraphs(project.description).length > 0 && (
            <section>
              <h2>Overview</h2>
              {paragraphs(project.description).map((p, i) => <p key={i}>{p}</p>)}
            </section>
          )}
          {project.highlights.length > 0 && (
            <section>
              <h2>Key points</h2>
              <ul className="bullets">{project.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
            </section>
          )}
          <div className="case-cta">
            <div>
              <h2>Need something similar?</h2>
              <p className="muted">I take on freelance missions across France.</p>
            </div>
            <a className="btn primary" href="#/contact">Get in touch</a>
          </div>
          {next && next.slug !== slug && (
            <a className="next-project" href={`#/projects/${next.slug}`}>
              <span className="muted small">Next project</span>
              <strong>{next.title} →</strong>
            </a>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="section alt">
          <div className="container">
            <h2 className="related-title">More in {project.category}</h2>
            <div className="project-grid">{related.map((p) => <ProjectCard key={p.slug} project={p} />)}</div>
          </div>
        </section>
      )}
      <Footer profile={data.profile} />
    </div>
  );
}
