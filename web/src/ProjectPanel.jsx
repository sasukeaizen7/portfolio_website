import { useEffect, useRef } from 'react';

const paragraphs = (text) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export function ProjectPanel({ project, onClose, onPrev, onNext }) {
  const closeRef = useRef();
  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, [project.slug]);

  return (
    <aside className="panel" aria-labelledby="panel-title" style={{ '--planet': project.color }}>
      <div className="panel-bar">
        <button className="icon-btn" onClick={onPrev} aria-label="Previous project">‹</button>
        <button className="icon-btn" onClick={onNext} aria-label="Next project">›</button>
        <span className="grow" />
        <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="panel-body">
        <div className="panel-kicker"><span className="dot" />{project.category}{project.period && ` · ${project.period}`}</div>
        <h2 id="panel-title">{project.title}</h2>
        {project.imageUrl && <img className="panel-image" src={project.imageUrl} alt="" />}
        {project.summary && <p className="panel-summary">{project.summary}</p>}
        {paragraphs(project.description ?? '').map((p, i) => <p key={i}>{p}</p>)}
        {project.highlights?.length > 0 && (
          <>
            <h3>Highlights</h3>
            <ul className="highlights">{project.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
          </>
        )}
        {project.tags?.length > 0 && <div className="tags">{project.tags.map((t) => <span key={t}>{t}</span>)}</div>}
        <div className="panel-links">
          {project.repoUrl && <a className="btn primary" href={project.repoUrl} target="_blank" rel="noopener noreferrer">View the code</a>}
          {project.demoUrl && <a className="btn" href={project.demoUrl} target="_blank" rel="noopener noreferrer">Live demo</a>}
        </div>
      </div>
    </aside>
  );
}

export function AboutPanel({ profile, count, onClose }) {
  return (
    <aside className="panel" aria-labelledby="about-title" style={{ '--planet': '#fbbf24' }}>
      <div className="panel-bar">
        <span className="grow" />
        <button className="icon-btn" onClick={onClose} aria-label="Close" autoFocus>✕</button>
      </div>
      <div className="panel-body">
        <div className="panel-kicker"><span className="dot" />About · {count} projects</div>
        <h2 id="about-title">{profile.name}</h2>
        <p className="panel-summary">{profile.headline}</p>
        {paragraphs(profile.bio).map((p, i) => <p key={i}>{p}</p>)}
        <div className="panel-links">
          {profile.githubUrl && <a className="btn primary" href={profile.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
          {profile.linkedinUrl && <a className="btn" href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
          {profile.contactEmail && <a className="btn" href={`mailto:${profile.contactEmail}`}>Email</a>}
        </div>
      </div>
    </aside>
  );
}
