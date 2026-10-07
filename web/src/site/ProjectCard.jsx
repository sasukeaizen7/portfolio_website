export default function ProjectCard({ project: p }) {
  return (
    <a className={`project-card${p.featured ? ' featured' : ''}`} href={`#/projects/${p.slug}`} style={{ '--planet': p.color }}>
      <div className="project-cover">
        {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" /> : <span className="cover-orb" aria-hidden="true" />}
      </div>
      <div className="project-body">
        <p className="project-meta">{p.category}{p.period && ` · ${p.period}`}</p>
        <h3>{p.title}</h3>
        <p className="project-summary">{p.summary}</p>
        {p.tags.length > 0 && <div className="tags">{p.tags.slice(0, 4).map((t) => <span key={t}>{t}</span>)}</div>}
        <span className="read-more">Read the case study →</span>
      </div>
    </a>
  );
}
